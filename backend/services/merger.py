# backend/services/merger.py — FINAL WORKING VERSION

from datetime import datetime
from typing import Dict, Any, Optional
import re
from bson import ObjectId

# Direct imports
from backend.services.mongo_client import (
    symptom_col,
    water_col,
    prediction_col,
    record_asha_submission,
    users_col,
)

from backend.services.predictor import predict_disease


# ---------------------------------------------------------
# Helper: Check if a string looks like ObjectId
# ---------------------------------------------------------
def _looks_like_objectid(s: str) -> bool:
    return isinstance(s, str) and len(s) == 24 and all(c in "0123456789abcdefABCDEF" for c in s)


async def _maybe_cast_to_objectid(val):
    try:
        if isinstance(val, ObjectId):
            return val
        if isinstance(val, str) and _looks_like_objectid(val):
            return ObjectId(val)
    except Exception:
        pass
    return None


# ---------------------------------------------------------
# Resolve reporter user ID from various fields
# ---------------------------------------------------------
async def _find_user_id_from_string(val: str) -> Optional[ObjectId]:
    if not val or not isinstance(val, str):
        return None

    # objectid
    oid = await _maybe_cast_to_objectid(val)
    if oid:
        return oid

    # email
    if "@" in val and "." in val:
        user = await users_col.find_one({"email": {"$regex": f"^{re.escape(val)}$", "$options": "i"}})
        if user:
            return user.get("_id")

    # phone
    digits = re.sub(r"[^\d]", "", val)
    if len(digits) >= 6:
        user = await users_col.find_one({"phone": {"$regex": digits}})
        if user:
            return user.get("_id")

    # full name
    user = await users_col.find_one({"full_name": {"$regex": f"^{re.escape(val)}$", "$options": "i"}})
    if user:
        return user.get("_id")

    return None


async def _resolve_reporter_id_from_doc(doc: Dict[str, Any]) -> Optional[ObjectId]:
    """Attempts to extract reporter info from common fields."""
    if not doc:
        return None

    candidates = [
        "reported_by_user_id", "reported_by_user", "reported_by",
        "reportedBy", "reportedById", "reportedBy_id",
        "submittedBy", "submitted_by", "submittedById",
        "user_id", "userId", "submitted_by_user_id"
    ]

    for key in candidates:
        if key in doc and doc.get(key):
            val = doc.get(key)
            if isinstance(val, ObjectId):
                return val
            oid = await _maybe_cast_to_objectid(val)
            if oid:
                return oid
            if isinstance(val, str):
                uid = await _find_user_id_from_string(val)
                if uid:
                    return uid

    # Check meta fields
    meta = doc.get("meta") or {}
    for k in ["submitted_by", "reported_by"]:
        if k in meta and meta.get(k):
            val = meta.get(k)
            if isinstance(val, ObjectId):
                return val
            oid = await _maybe_cast_to_objectid(val)
            if oid:
                return oid
            if isinstance(val, str):
                uid = await _find_user_id_from_string(val)
                if uid:
                    return uid

    return None


# ---------------------------------------------------------
# Extract coordinates from various possible formats
# ---------------------------------------------------------
def _extract_center(sym_doc: Dict[str, Any], water_doc: Dict[str, Any]) -> Optional[list]:
    candidates = []

    for doc in (sym_doc or {}, water_doc or {}):
        if not isinstance(doc, dict):
            continue

        # Common coordinate keys
        for key in ("center", "coords", "coordinates", "location_coords", "latlng", "lat_lng"):
            if isinstance(doc.get(key), (list, tuple)) and len(doc[key]) >= 2:
                candidates.append(doc[key])
            if isinstance(doc.get(key), dict):
                c = doc[key]
                if "lat" in c and "lng" in c:
                    candidates.append([c["lat"], c["lng"]])

        # Simple lat/lng fields
        if doc.get("lat") and doc.get("lng"):
            candidates.append([doc["lat"], doc["lng"]])
        if doc.get("latitude") and doc.get("longitude"):
            candidates.append([doc["latitude"], doc["longitude"]])

        # nested inside input
        if isinstance(doc.get("input"), dict):
            inp = doc["input"]
            for sub in ("sym_doc", "water_doc"):
                d2 = inp.get(sub)
                if isinstance(d2, dict):
                    if d2.get("lat") and d2.get("lng"):
                        candidates.append([d2["lat"], d2["lng"]])
                    if d2.get("location_coords"):
                        candidates.append(d2["location_coords"])

        # Geo inside meta
        meta = doc.get("meta") or {}
        if isinstance(meta.get("geo"), dict):
            g = meta["geo"]
            if g.get("lat") and g.get("lng"):
                candidates.append([g["lat"], g["lng"]])

        if meta.get("lat") and meta.get("lng"):
            candidates.append([meta["lat"], meta["lng"]])

    # Pick first valid coordinate pair
    for c in candidates:
        try:
            if isinstance(c, dict) and "lat" in c and "lng" in c:
                return [float(c["lat"]), float(c["lng"])]
            if isinstance(c, (list, tuple)) and len(c) >= 2:
                return [float(c[0]), float(c[1])]
        except Exception:
            pass

    return None


# ---------------------------------------------------------
# MERGE & ML PREDICT & STORE (Main Pipeline)
# ---------------------------------------------------------
async def merge_and_predict_and_store(sym_doc: Dict[str, Any], water_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    - Merges symptom + water report
    - Runs ML model
    - Stores prediction in UNIFIED MongoDB schema:
        {
            "patientName": "...",
            "symptoms": [...],
            "input_water": {...},
            "features": {
                 "predicted_disease": "...",
                 "predicted_at": ISODate,
                 "feature_vector": {...},
                 "center": [lat, lng]
            }
        }
    - Marks symptom as processed
    - Records ASHA submission if reporter identified
    """

    try:
        # -------------------------
        # 1. Build clean merged input
        # -------------------------
        location = sym_doc.get("location") or water_doc.get("location")
        district = water_doc.get("district")

        water_input = {
            "location": location,
            "district": district,
            "ph": water_doc.get("pH") or water_doc.get("ph"),
            "turbidity": water_doc.get("turbidity"),
            "tds": water_doc.get("tds"),
            "chlorine": water_doc.get("chlorine"),
            "fluoride": water_doc.get("fluoride"),
            "nitrate": water_doc.get("nitrate"),
            "coliform": water_doc.get("coliform"),
            "temperature": water_doc.get("temperature"),
            "primary_water_source": water_doc.get("primary_water_source") or water_doc.get("water_source"),
        }

        symptoms_list = sym_doc.get("symptoms", [])

        # -------------------------
        # 2. RUN ML PREDICTOR
        # -------------------------
        prediction_result = predict_disease(water_input, {"symptoms": symptoms_list})

        predicted_label = None
        feature_vector = None

        if isinstance(prediction_result, dict):
            predicted_label = prediction_result.get("predicted_disease")
            feature_vector = prediction_result.get("features_used")

        # -------------------------
        # 3. Extract coordinates (optional)
        # -------------------------
        center = _extract_center(sym_doc, water_doc)

        # -------------------------
        # 4. Construct FINAL UNIFIED PREDICTION DOC
        # -------------------------
        pred_doc = {
            "patientName": sym_doc.get("patientName"),
            "symptoms": symptoms_list,
            "input_water": water_input,
            "features": {
                "predicted_disease": predicted_label,
                "predicted_at": datetime.utcnow(),
                "feature_vector": feature_vector,
                "center": center,
            },
            "symptom_id": str(sym_doc.get("_id")),
            "water_id": str(water_doc.get("_id")) if water_doc and water_doc.get("_id") else None,
        }

        # -------------------------
        # 5. Store in MongoDB
        # -------------------------
        await prediction_col.insert_one(pred_doc)

        # -------------------------
        # 6. Mark symptom as processed
        # -------------------------
        await symptom_col.update_one(
            {"_id": sym_doc.get("_id")},
            {"$set": {"processed_by_model": True, "processed_at": datetime.utcnow()}},
        )

        # -------------------------
        # 7. Record ASHA submission if reporter identified
        # -------------------------
        try:
            reporter_oid = await _resolve_reporter_id_from_doc(sym_doc)
            sym_id = sym_doc.get("_id")
            if reporter_oid and sym_id:
                await record_asha_submission(reporter_oid, "symptom", sym_id)
        except Exception as e:
            print("Failed to record ASHA submission for symptom:", e)

        try:
            reporter_w_oid = await _resolve_reporter_id_from_doc(water_doc)
            water_id = water_doc.get("_id")
            if reporter_w_oid and water_id:
                await record_asha_submission(reporter_w_oid, "water", water_id)
        except Exception as e:
            print("Failed to record ASHA submission for water:", e)

        # -------------------------
        # 8. RETURN prediction
        # -------------------------
        return {
            "predicted_disease": predicted_label,
            "feature_vector": feature_vector,
            "center": center,
        }

    except Exception as e:
        print("merge_and_predict_and_store error:", e)
        return None
