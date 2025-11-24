from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pymongo import MongoClient
from bson import ObjectId
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn import metrics
import io, os, certifi
from dotenv import load_dotenv

# ------------------ ENV & MongoDB ------------------
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in .env")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["iot_dynamic_db"]
collection = db["records"]

# In-memory schema + trained models
current_schema: Optional[Dict[str, Any]] = None
trained_models: Dict[str, Any] = {}

# ------------------ FastAPI ------------------
app = FastAPI(title="Dynamic IoT ML Grid (Any CSV)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Schemas ------------------
class RecordOut(BaseModel):
    id: str
    data: Dict[str, Any]

class PredictIn(BaseModel):
    model: str
    features: Dict[str, float]

class DatasetSchema(BaseModel):
    columns: List[str]
    numeric_columns: List[str]
    target: Optional[str]
    feature_columns: List[str]
    samples: int

# ------------------ Helpers ------------------
def doc_to_record(doc) -> RecordOut:
    d = dict(doc)
    rid = str(d.pop("_id"))
    return RecordOut(id=rid, data=d)

def compute_schema(df: pd.DataFrame) -> DatasetSchema:
    columns = df.columns.tolist()
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    target = numeric_cols[-1] if numeric_cols else None
    feature_cols = [c for c in numeric_cols if c != target] if target else []

    return DatasetSchema(
        columns=columns,
        numeric_columns=numeric_cols,
        target=target,
        feature_columns=feature_cols,
        samples=len(df),
    )

# ------------------ ADD COLUMN ------------------
@app.post("/add_column")
def add_column(data: dict):
    """
    Adds a new column dynamically to:
    - Schema (in memory)
    - All MongoDB documents
    """
    global current_schema

    column = data["column"].strip()
    if not column:
        raise HTTPException(status_code=400, detail="Column name cannot be empty")

    if current_schema is None:
        raise HTTPException(status_code=400, detail="No dataset loaded")

    schema = current_schema

    # Avoid duplicates
    if column in schema["columns"]:
        return {"message": "Column already exists", "schema": schema}

    # Add to schema
    schema["columns"].append(column)

    # Treat as numeric by default if possible
    try:
        float(0)
        schema["numeric_columns"].append(column)
    except:
        pass

    # Recompute target/feature columns
    if schema["numeric_columns"]:
        schema["target"] = schema["numeric_columns"][-1]
        schema["feature_columns"] = [
            c for c in schema["numeric_columns"] if c != schema["target"]
        ]

    # Add empty field to all DB records
    for rec in collection.find():
        collection.update_one(
            {"_id": rec["_id"]},
            {"$set": {column: None}}
        )

    current_schema = schema
    return {"message": "Column added", "schema": schema}

@app.post("/delete_column")
def delete_column(data: dict):
    column = data["column"]

    global current_schema

    if current_schema is None:
        raise HTTPException(status_code=400, detail="No schema loaded")

    if column not in current_schema["columns"]:
        raise HTTPException(status_code=404, detail="Column not found")

    # Update schema
    current_schema["columns"].remove(column)

    if column in current_schema["numeric_columns"]:
        current_schema["numeric_columns"].remove(column)

    if column in current_schema["feature_columns"]:
        current_schema["feature_columns"].remove(column)

    if current_schema["target"] == column:
        current_schema["target"] = None

    # Remove from MongoDB
    for rec in collection.find():
        collection.update_one(
            {"_id": rec["_id"]},
            {"$unset": {f"{column}": ""}}
        )

    return {"message": "Column deleted", "schema": current_schema}



# ------------------ Upload Dataset ------------------
@app.post("/upload-dataset", response_model=DatasetSchema)
async def upload_dataset(file: UploadFile = File(...)):
    global current_schema, trained_models

    content = await file.read()
    buf = io.BytesIO(content)

    try:
        df = pd.read_csv(buf, encoding="utf-8", on_bad_lines="skip")
    except UnicodeDecodeError:
        buf.seek(0)
        df = pd.read_csv(buf, encoding="latin1", on_bad_lines="skip")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV is empty")

    collection.delete_many({})
    records = df.to_dict(orient="records")
    if records:
        collection.insert_many(records)

    current_schema = compute_schema(df).dict()
    trained_models = {}

    return DatasetSchema(**current_schema)


@app.post("/create-empty-dataset")
def create_empty_dataset(data: dict):
    global current_schema, trained_models
    
    columns = data.get("columns", [])
    if not columns:
        raise HTTPException(status_code=400, detail="No columns provided")

    # Reset DB
    collection.delete_many({})

    # Build empty schema
    current_schema = {
        "columns": columns,
        "numeric_columns": [],       # user will start typing values
        "feature_columns": [],       # becomes valid once user enters numerics
        "target": None,
        "samples": 0
    }

    trained_models = {}  # reset ML

    return current_schema


# ------------------ Get Schema ------------------
@app.get("/schema", response_model=DatasetSchema)
def get_schema():
    global current_schema
    if current_schema is None:
        docs = list(collection.find().limit(200))
        if not docs:
            raise HTTPException(404, "No dataset loaded")
        df = pd.DataFrame(docs).drop(columns=["_id"])
        current_schema = compute_schema(df).dict()

    return DatasetSchema(**current_schema)

# ------------------ CRUD ------------------
@app.get("/records", response_model=List[RecordOut])
def get_records():
    return [doc_to_record(d) for d in collection.find()]

class GenericRecord(BaseModel):
    data: Dict[str, Any]

@app.post("/records", response_model=RecordOut)
def create_record(rec: GenericRecord):
    result = collection.insert_one(rec.data)
    new_doc = collection.find_one({"_id": result.inserted_id})
    return doc_to_record(new_doc)

@app.put("/records/{record_id}", response_model=RecordOut)
def update_record(record_id: str, rec: GenericRecord):
    try:
        oid = ObjectId(record_id)
    except Exception:
        raise HTTPException(400, "Invalid record id")

    collection.update_one({"_id": oid}, {"$set": rec.data})
    doc = collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Record not found")

    return doc_to_record(doc)

@app.delete("/records/{record_id}")
def delete_record(record_id: str):
    try:
        oid = ObjectId(record_id)
    except Exception:
        raise HTTPException(400, "Invalid record id")

    res = collection.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Record not found")

    return {"detail": "Record deleted"}

# ------------------ CSV Download ------------------
@app.get("/download")
def download_csv():
    docs = list(collection.find())
    if not docs:
        raise HTTPException(404, "No data to download")

    df = pd.DataFrame(docs).drop(columns=["_id"])
    output = df.to_csv(index=False)
    headers = {"Content-Disposition": "attachment; filename=dataset.csv"}
    return Response(output, media_type="text/csv", headers=headers)

# ------------------ Train Models ------------------
@app.post("/train")
def train_models():
    global current_schema, trained_models

    if current_schema is None:
        raise HTTPException(400, "No dataset schema available")

    docs = list(collection.find())
    if len(docs) < 10:
        raise HTTPException(400, "Not enough rows to train")

    df = pd.DataFrame(docs).drop(columns=["_id"])
    schema = DatasetSchema(**current_schema)

    if not schema.target or not schema.feature_columns:
        raise HTTPException(400, "Could not determine target/features")

    X = df[schema.feature_columns]
    y = df[schema.target]

    models = {
        "linear": LinearRegression(),
        "random_forest": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        "gradient_boosting": GradientBoostingRegressor(random_state=42),
    }

    results = {}
    for key, model in models.items():
        model.fit(X, y)
        y_pred = model.predict(X)

        fi = None
        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
        elif hasattr(model, "coef_"):
            fi = abs(model.coef_)

        fi_dict = (
            {name: float(val) for name, val in zip(schema.feature_columns, fi)}
            if fi is not None else None
        )

        results[key] = {
            "r2": float(metrics.r2_score(y, y_pred)),
            "mae": float(metrics.mean_absolute_error(y, y_pred)),
            "mse": float(metrics.mean_squared_error(y, y_pred)),
            "rmse": float(metrics.mean_squared_error(y, y_pred) ** 0.5),
            "feature_importance": fi_dict,
        }

        trained_models[key] = model

    return {
        "detail": "Models trained",
        "models": results,
        "samples": len(df),
        "schema": current_schema,
    }

# ------------------ Predict ------------------
@app.post("/predict")
def predict(payload: PredictIn):
    global trained_models, current_schema

    if payload.model not in trained_models:
        raise HTTPException(400, f"Model '{payload.model}' not trained yet")

    schema = DatasetSchema(**current_schema)
    X = [[payload.features[col] for col in schema.feature_columns]]

    model = trained_models[payload.model]
    pred = model.predict(X)[0]
    return {"prediction_pdmrg": float(pred)}
