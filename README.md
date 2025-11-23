# 📊 Dynamic ML Analytics Platform  
A full-stack data analytics application built for internship assessment.  
It dynamically loads any CSV dataset, provides an editable grid interface, and performs supervised machine learning using FastAPI + MongoDB + scikit-learn.

---

## 🚀 Features

### **1. Dynamic Editable Data Grid (React)**
- Upload **any CSV**, automatic schema detection  
- Create, edit, delete, and bulk delete records  
- Sticky columns + scrollable grid  
- Data stored in **MongoDB**  
- No hardcoded columns — works with ANY dataset  

💡 **Completely schema-agnostic** UI.  

---

## 🤖 Machine Learning Pipeline (FastAPI + scikit-learn)

### Supports 3 Regression Models:
- **Linear Regression**
- **Random Forest Regressor**
- **Gradient Boosting Regressor**

### Automatic ML setup:
- Auto-detect **target column**  
- Auto-detect **feature columns**  
- Train/test split  
- Trains all 3 models simultaneously  
- Stores metrics:
  - R² Score  
  - MAE  
  - MSE  
  - RMSE  
  - Feature Importance  

💡 Allows user to **select which ML model** to use for prediction.

---

## 🔮 Real-Time Predictions
- Clean UI explaining:
  - What the target is  
  - Why it is selected  
  - What features are used  
- User inputs new values → prediction generated instantly  
- Professional prediction card with animated output  

---

## 📥 CSV Export
- One-click **Download CSV**
- Exports the current state of the dataset

---

## 🧰 Tech Stack

### **Frontend**
- React (Vite)
- Fetch API  
- HTML/CSS  
- Modular components  
- Sticky UX tables  

### **Backend**
- FastAPI (Python)
- scikit-learn (ML)
- pandas (CSV operations)
- pydantic (schema handling)

### **Database**
- MongoDB (via pymongo)

---

# 📸 Screenshots

### Dashboard
![Dashboard Screenshot](<img width="1897" height="905" alt="image" src="https://github.com/user-attachments/assets/35e84866-3f50-4c18-8213-e711003a5ba0" />
)

### Editable Grid
![Editable Grid](<img width="1293" height="823" alt="image" src="https://github.com/user-attachments/assets/82640d3c-ac75-4802-9007-2756b7b0e879" />
)

### Prediction Panel
![Prediction Panel](<img width="250" height="652" alt="image" src="https://github.com/user-attachments/assets/3cc9057b-7ad9-4bf4-b82b-91aa0f676c89" />
)

### Model Metrics
![Model Metrics](<img width="245" height="333" alt="image" src="https://github.com/user-attachments/assets/d9113d36-4374-4534-90bc-5e6979d491aa" />
)

---

# 🗂️ Project Structure

/frontend
/src
/components
/styles
/pages
/backend
main.py
model_utils.py
requirements.txt
README.md


---

# ⚙️ Setup Instructions

## 1️⃣ Clone the Repository

git clone https://github.com/YS-force/dynamic-ml-analytics.git

cd dynamic-ml-analytics


---

# 🖥️ Backend Setup — FastAPI + MongoDB

## Install dependencies

cd backend
pip install -r requirements.txt


## Start FastAPI
uvicorn main:app --reload

The backend runs at:  
👉 **http://127.0.0.1:8000**

### Make sure MongoDB is running:


The backend runs at:  
👉 **http://127.0.0.1:8000**

### Make sure MongoDB is running:

mongod

---

# 🖥️ Frontend Setup — React

cd frontend
npm install
npm run dev


Frontend runs at:  
👉 **http://localhost:5173**

---

# 🛣️ API Endpoints Summary (Backend)

### **GET /schema**
Returns detected columns, feature list, target column.

### **GET /records**
Fetch all data from DB.

### **POST /records**
Create new record.

### **PUT /records/{id}**
Update existing record.

### **DELETE /records/{id}**
Delete a record.

### **POST /train**
Train all models and return metrics.

### **POST /predict**
Make a prediction using selected model.

### **GET /download**
Download dataset as CSV.

---

# 📘 How Target Column is Selected (Auto Logic)
When a CSV is uploaded:

- If dataset contains a numeric column with the **highest correlation** to others → choose that as target  
- Otherwise, choose the **last numeric column**  
- All remaining numeric columns become **features**

This method works well for general ML prediction tasks.

---

# 🏁 Conclusion

This project delivers a **complete full-stack machine learning interface**, including:

- Dynamic editable grid  
- MongoDB persistence  
- Multi-model training  
- Real-time prediction  
- CSV export  
- Beautiful UI & user explanation panel  

⚡ Perfect for analytics demos, internal tools, prototyping, or internship assessment submission.

---

# ✨ Author  
**YUVASHREE R**  

