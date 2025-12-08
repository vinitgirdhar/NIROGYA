# backend/services/predictor.py
import os
from pathlib import Path
import joblib
import pandas as pd
import traceback

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/

MODEL_PATH = BASE_DIR / "models" / "disease_prediction_model.joblib"
ENCODER_PATH = BASE_DIR / "models" / "label_encoder.joblib"

# Load model and metadata (this is synchronous)
try:
    _model = joblib.load(MODEL_PATH)
    _meta = joblib.load(ENCODER_PATH)
    _feature_cols = _meta["feature_cols"]
    _categorical_cols = _meta["categorical_cols"]
    _label_encoder = _meta["label_encoder"]
    print("Predictor: Model Loaded Successfully!!")
except Exception as e:
    print("\n\n---------------- MODEL LOAD ERROR ----------------")
    print("MODEL_PATH =", MODEL_PATH)
    print("ENCODER_PATH =", ENCODER_PATH)
    print("ERROR:", e)
    traceback.print_exc()
    print("-------------------------------------------------\n\n")
    _model = None
    _meta = None
    _feature_cols = None
    _categorical_cols = None
    _label_encoder = None


def _safe_float(v):
    """Safely convert value to float, return 0.0 on error."""
    try:
        return float(v)
    except:
        return 0.0


def normalize_symptoms(symptoms):
    """Convert a list or string of symptoms to lowercase list."""
    if not symptoms:
        return []
    if isinstance(symptoms, str):
        return [s.strip().lower() for s in symptoms.split(",")]
    return [str(s).lower() for s in symptoms]

def build_features(w_doc: dict, s_doc: dict):
    """Build a dict of features EXACTLY matching the CatBoost training features."""
    
    # Extract district
    district = (s_doc.get("district") if s_doc else None) \
            or (w_doc.get("district") if w_doc else None)
    district = (district or "").strip()

    # Extract location
    location = (s_doc.get("location") if s_doc else None) \
            or (w_doc.get("location") if w_doc else None)
    location = (location or "").strip()

    # Water source
    source = None
    if w_doc:
        source = w_doc.get("primary_water_source") or w_doc.get("water_source") or w_doc.get("primaryWaterSource")
    source = (source or "").strip()

    # Water quality numeric fields
    ph = _safe_float(w_doc.get("ph") or w_doc.get("pH") if w_doc else 0)
    turbidity = _safe_float(w_doc.get("turbidity", 0) if w_doc else 0)
    tds = _safe_float(w_doc.get("tds", 0) if w_doc else 0)
    chlorine = _safe_float(w_doc.get("chlorine", 0) if w_doc else 0)
    fluoride = _safe_float(w_doc.get("fluoride", 0) if w_doc else 0)
    nitrate = _safe_float(w_doc.get("nitrate", 0) if w_doc else 0)
    coliform = _safe_float(w_doc.get("coliform", 0) if w_doc else 0)
    temperature = _safe_float(w_doc.get("temperature", 0) if w_doc else 0)

    # Symptoms
    symptoms_list = normalize_symptoms(s_doc.get("symptoms") if s_doc else [])

    diarrhea = 1 if "diarrhea" in symptoms_list else 0
    vomiting = 1 if "vomiting" in symptoms_list else 0
    fever = 1 if "fever" in symptoms_list else 0
    abdominal = 1 if ("abdominal pain" in symptoms_list or "stomach pain" in symptoms_list) else 0
    dehydration = 1 if "dehydration" in symptoms_list else 0
    headache = 1 if "headache" in symptoms_list else 0

    # Build feature dict (THIS ORDER MUST MATCH training feature_cols EXACTLY)
    features = {
        "district": district,
        "location": location,
        "primary_source": source,
        "ph": ph,
        "turbidity": turbidity,
        "tds": tds,
        "chlorine": chlorine,
        "fluoride": fluoride,
        "nitrate": nitrate,
        "coliform": coliform,
        "temperature": temperature,
        "diarrhea": diarrhea,
        "vomiting": vomiting,
        "fever": fever,
        "abdominal_pain": abdominal,
        "dehydration": dehydration,
        "headache": headache
    }

    return features

def predict_disease(w_doc: dict, s_doc: dict):
    """
    Synchronous predict function returning label and features dict.
    Call it inside run_in_executor from async code.
    Uses CatBoost model with label encoder for disease prediction.
    """
    if _model is None:
        raise RuntimeError("Model not loaded")

    # Build features
    feat_dict = build_features(w_doc or {}, s_doc or {})

    # Create DataFrame in correct order (using feature_cols from metadata)
    df = pd.DataFrame([feat_dict], columns=_feature_cols)

    # Predict (CatBoost returns [[class_index]])
    pred_idx = int(_model.predict(df)[0])

    # Convert back to label using label encoder
    if _label_encoder is None:
        raise RuntimeError("Label encoder not loaded")
    pred_label = _label_encoder.inverse_transform([pred_idx])[0]

    return {
        "predicted_disease": pred_label,
        "features_used": feat_dict
    }
