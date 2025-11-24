# Dynamic Grid & ML Prediction System  
### 🚀 With Interactive Visualizations, Dynamic Table Creation, and Model Performance Charts

This project is a **full-stack Machine Learning platform** built using **FastAPI + MongoDB + React**, designed for **dynamic datasets**, **automatic ML training**, **interactive grid editing**, and **live visualizations**.

---

## ✨ Features Included

### 📌 1. Upload Any CSV Dataset  
<img width="800" height="800" alt="image" src="https://github.com/YS-force/dynamic-ml-analytics/blob/b79d9bcd0a22295ac2e85361fb5861552cc4efb3/screenshorts/dashboard.png" />
- Automatically infers schema
- Detects numeric columns
- Determines target and feature columns  
- Stores everything in MongoDB  

### 📌 2. Create Table From Scratch  
<img width="800" height="800" alt="image" src="https://github.com/YS-force/dynamic-ml-analytics/blob/f9006e50c10a8574883af8febb76a468d11eae58/screenshorts/Create_table.png" />
- Add custom column names  
- Starts with an empty dataset  
- Add rows dynamically  
- Fully editable grid UI  

### 📌 3. Dynamic Editable Grid  
<img width="800" height="800" alt="image" src="https://github.com/YS-force/dynamic-ml-analytics/blob/b79d9bcd0a22295ac2e85361fb5861552cc4efb3/screenshorts/Dataset.png" />
- Add new rows and columns  
- Edit existing rows  
- Delete rows (single or bulk delete)  
- Add/delete columns dynamically  
- Sticky action column UI  

### 📌 4. Machine Learning – Automatic Training  
<img width="500" height="800" alt="image" src="https://github.com/YS-force/dynamic-ml-analytics/blob/b79d9bcd0a22295ac2e85361fb5861552cc4efb3/screenshorts/Model_Overview.png" />
Uses 3 ML models:  
- **Linear Regression**  
- **Random Forest Regressor**  
- **Gradient Boosting Regressor**  

Each model returns:  
✔ R² Score  
✔ MAE  
✔ MSE  
✔ RMSE  
✔ Feature Importance  

### 📌 5. Model Prediction  
<img width="500" height="800" alt="image" src="https://github.com/YS-force/dynamic-ml-analytics/blob/b79d9bcd0a22295ac2e85361fb5861552cc4efb3/screenshorts/Prediction_target.png" />
- Live prediction UI  
- Uses trained model  
- Supports dynamic feature input  

### 📌 6. Data Visualizations
<img width="800" height="800" alt="image" src="https://github.com/YS-force/dynamic-ml-analytics/blob/f9006e50c10a8574883af8febb76a468d11eae58/screenshorts/Visualizations.png" />
Designed to improve model interpretability.

#### 📊 Model Comparison Chart  
Shows R² accuracy for all 3 models.

#### 📉 Error Comparison Chart  
Compares MAE, MSE, RMSE across models.

#### 🔥 SHAP‑Style Feature Importance Chart  
Helps readers understand which features contributed most.

---

## 🧩 Project Flow

### **1. Upload / Create Dataset**
React → FastAPI  
FastAPI stores data → MongoDB Atlas
FastAPI computes schema → sent to React  

---

### **2. User Edits Data**
React grid updates → Sends record updates to FastAPI  
FastAPI updates MongoDB  

---

### **3. Train Models**
FastAPI trains ML models using:  
`sklearn.LinearRegression`  
`sklearn.RandomForestRegressor`  
`sklearn.GradientBoostingRegressor`

Returns metrics & feature importance to React.

---

### **4. Predict Values**
User enters values → React sends to FastAPI  
FastAPI model.predict returns result  

---

### **5. Visualizations**
React charts use data from backend training metrics.

---

## 📂 Tech Stack

### **Frontend**
- React.js  
- Recharts (for graphs)  
- CSS Modules  
- Responsive Layout  

### **Backend**
- FastAPI  
- Pydantic  
- CORS Middleware  
- Model Training with Scikit-Learn  

### **Database**
- MongoDB (Atlas)  
- pymongo  

---

## 📸 UI Preview (Add Your Images Here)
```
Add your screenshots inside the repo:  
assets/ui-1.png  
assets/ui-2.png  
assets/chart-1.png  
```

---

## 🛠 How to Run

### **Backend**
```
cd backend
uvicorn main:app --reload
```

### **Frontend**
```
cd frontend
npm install
npm run dev
```

---

## 📜 Author
**Yuva Shree**  
Dynamic ML Automation & Interactive Data Systems

---

## ⭐ If you like this project, star the repo!  
