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
import io, csv, os, certifi
from dotenv import load_dotenv

# ------------------ ENV & MongoDB ------------------
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in .env")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["iot_dynamic_db"]
collection = db["records"]

# in-memory schema + models
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
    model: str                 # "linear", "random_forest", "gradient_boosting"
    features: Dict[str, float] # dynamic feature values {colName: value}

class DatasetSchema(BaseModel):
    columns: List[str]
    numeric_columns: List[str]
    target: Optional[str]
    feature_columns: List[str]
    samples: int


# ------------------ Helpers ------------------
def doc_to_record(doc) -> RecordOut:
    d = dict(doc)
    d_id = str(d.pop("_id"))
    return RecordOut(id=d_id, data=d)

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


# ------------------ NEW: Upload any dataset ------------------
@app.post("/upload-dataset", response_model=DatasetSchema)
async def upload_dataset(file: UploadFile = File(...)):
    """
    Accept any CSV, infer schema, store all rows in MongoDB.
    """
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

    # reset DB
    collection.delete_many({})
    records = df.to_dict(orient="records")
    if records:
        collection.insert_many(records)

    # recompute schema and clear any old models
    current_schema = compute_schema(df).dict()
    trained_models = {}

    return DatasetSchema(**current_schema)


# ------------------ Get schema ------------------
@app.get("/schema", response_model=DatasetSchema)
def get_schema():
    global current_schema
    if current_schema is None:
        # fallback: try to infer from existing data
        docs = list(collection.find().limit(200))
        if not docs:
            raise HTTPException(
                status_code=404,
                detail="No dataset loaded. Upload a CSV first.",
            )
        df = pd.DataFrame(docs).drop(columns=["_id"])
        current_schema = compute_schema(df).dict()

    return DatasetSchema(**current_schema)


# ------------------ CRUD over generic records ------------------
@app.get("/records", response_model=List[RecordOut])
def get_records():
    docs = collection.find()
    return [doc_to_record(d) for d in docs]


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
        raise HTTPException(status_code=400, detail="Invalid record id")

    collection.update_one({"_id": oid}, {"$set": rec.data})
    doc = collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Record not found")
    return doc_to_record(doc)

@app.delete("/records/{record_id}")
def delete_record(record_id: str):
    try:
        oid = ObjectId(record_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid record id")

    result = collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"detail": "Record deleted"}

# ------------------ CSV Download ------------------
@app.get("/download")
def download_csv():
    docs = list(collection.find())
    if not docs:
        raise HTTPException(status_code=404, detail="No data to download")

    df = pd.DataFrame(docs).drop(columns=["_id"])
    output = io.StringIO()
    df.to_csv(output, index=False)
    headers = {"Content-Disposition": "attachment; filename=dataset.csv"}
    return Response(output.getvalue(), media_type="text/csv", headers=headers)


# ------------------ Train models on dynamic columns ------------------
@app.post("/train")
def train_models():
    global current_schema, trained_models

    if current_schema is None:
        raise HTTPException(status_code=400, detail="No dataset schema available")

    docs = list(collection.find())
    if len(docs) < 10:
        raise HTTPException(status_code=400, detail="Not enough rows to train")

    df = pd.DataFrame(docs).drop(columns=["_id"])

    schema = DatasetSchema(**current_schema)
    if not schema.target or not schema.feature_columns:
        raise HTTPException(
            status_code=400,
            detail="Could not determine target/feature columns from dataset",
        )

    X = df[schema.feature_columns]
    y = df[schema.target]

    models = {
        "linear": LinearRegression(),
        "random_forest": RandomForestRegressor(
            n_estimators=100, random_state=42, n_jobs=-1
        ),
        "gradient_boosting": GradientBoostingRegressor(random_state=42),
    }

    results = {}
    for key, model in models.items():
        model.fit(X, y)
        y_pred = model.predict(X)
        r2 = metrics.r2_score(y, y_pred)
        mae = metrics.mean_absolute_error(y, y_pred)
        mse = metrics.mean_squared_error(y, y_pred)
        rmse = mse ** 0.5

        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
        elif hasattr(model, "coef_"):
            import numpy as np
            fi = abs(model.coef_)
        else:
            fi = None

        fi_dict = None
        if fi is not None:
            fi_dict = {
                name: float(val) for name, val in zip(schema.feature_columns, fi)
            }

        results[key] = {
            "name": {
                "linear": "Linear Regression",
                "random_forest": "Random Forest",
                "gradient_boosting": "Gradient Boosting",
            }[key],
            "r2": float(r2),
            "mae": float(mae),
            "mse": float(mse),
            "rmse": float(rmse),
            "feature_importance": fi_dict,
        }

        trained_models[key] = model

    current_schema["target"] = schema.target
    current_schema["feature_columns"] = schema.feature_columns

    return {
        "detail": "Models trained successfully",
        "models": results,
        "samples": len(df),
        "schema": current_schema,
    }


# ------------------ Predict using chosen model ------------------
@app.post("/predict")
def predict(payload: PredictIn):
    global trained_models, current_schema

    if payload.model not in trained_models:
        raise HTTPException(
            status_code=400, detail=f"Model '{payload.model}' not trained yet"
        )

    if current_schema is None:
        raise HTTPException(status_code=400, detail="No dataset/schema loaded")

    schema = DatasetSchema(**current_schema)
    # enforce feature order from schema.feature_columns
    try:
        X = [[payload.features[col] for col in schema.feature_columns]]
    except KeyError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Missing feature '{e.args[0]}' in prediction request",
        )

    model = trained_models[payload.model]
    pred = model.predict(X)[0]
    return {"prediction_pdmrg": float(pred)}
