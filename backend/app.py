# backend/app.py  (modular version using services/)
import os
from dotenv import load_dotenv
load_dotenv()

import asyncio
from bson import ObjectId
import numbers
import numpy as np
from datetime import datetime, date
from typing import Dict, Any, List, Optional

# --------------------------
# BSON / numpy serializer
# --------------------------
def serialize_bson(obj):
    """
    Recursively convert Mongo/BSON types into JSON-serializable types:
    - ObjectId -> str
    - datetime/date -> isoformat string
    - numpy scalars -> native python types
    - dict/list -> recursively processed
    """
    if isinstance(obj, ObjectId):
        return str(obj)

    if isinstance(obj, (datetime, date)):
        try:
            return obj.isoformat()
        except Exception:
            return str(obj)

    if hasattr(np, 'integer') and isinstance(obj, np.integer):  # type: ignore
        return int(obj)
    if hasattr(np, 'floating') and isinstance(obj, np.floating):  # type: ignore
        return float(obj)
    if hasattr(np, 'bool_') and isinstance(obj, np.bool_):
        return bool(obj)

    if isinstance(obj, (str, bool, type(None), numbers.Number)):
        return obj

    if isinstance(obj, dict):
        return {str(k): serialize_bson(v) for k, v in obj.items()}

    if isinstance(obj, (list, tuple)):
        return [serialize_bson(v) for v in obj]

    try:
        return str(obj)
    except Exception:
        return None

# --------------------------
# FastAPI & imports
# --------------------------
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Correct imports (no backend.)
from backend.services.mongo_client import symptom_col, water_col, prediction_col, raw_col
from backend.services.predictor import predict_disease, _model as _ml_model
from backend.services.merger import merge_and_predict_and_store

from backend.auth.routes import router as auth_router
from backend.auth.otp_routes import router as otp_router
from backend.auth.alert_routes import router as alert_router
from backend.routes.hotspots import router as hotspots_router
from backend.routes.district_stats import router as district_router

# CONFIG
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))

# FastAPI init
app = FastAPI(title="Nirogya ML Backend (modular)")

# CORS - allow dev origins; change to explicit origins in production
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:8501",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount auth routes
app.include_router(auth_router)       # <--- FIXED (login/register working now)
app.include_router(otp_router)
app.include_router(alert_router)
app.include_router(hotspots_router)
app.include_router(district_router)

# ML availability flag
ML_READY = _ml_model is not None

# --------------------------
# Pydantic model for /predict
# --------------------------
class Report(BaseModel):
    location: Optional[str] = None

    pH: Optional[float] = None
    ph: Optional[float] = None
    turbidity: Optional[float] = None
    tds: Optional[float] = None
    chlorine: Optional[float] = None
    fluoride: Optional[float] = None
    nitrate: Optional[float] = None
    coliform: Optional[float] = None
    temperature: Optional[float] = None

    symptoms: Optional[List[str]] = []
    severity: Optional[str] = None
    family_members_affected: Optional[int] = None


############################################################
# /report endpoint
############################################################
@app.post("/report")
async def save_report(payload: Dict[str, Any] = Body(...)):
    now = datetime.utcnow()
    result = {"symptoms_saved": False, "water_saved": False, "raw_saved": False}

    patient = payload.get("patient")
    water = payload.get("water")
    meta = payload.get("meta", {})

    if not patient and not water:
        if any(k in payload for k in ["symptoms", "patientName", "contact_number", "reporter_name"]):
            patient = {
                "patientName": payload.get("patientName") or payload.get("reporter_name"),
                "age": payload.get("age"),
                "gender": payload.get("gender"),
                "location": payload.get("location") or payload.get("village"),
                "contactNumber": payload.get("contact_number"),
                "symptoms": payload.get("symptoms"),
                "severity": payload.get("severity"),
                "duration": payload.get("duration"),
                "additionalInfo": payload.get("symptom_details"),
                "reportedBy": payload.get("reporter_name"),
                "family_members_affected": payload.get("family_members_affected")
            }
        if any(k in payload for k in ["pH", "ph", "turbidity", "tds", "chlorine", "fluoride", "nitrate", "coliform", "temperature"]):
            water = {
                "location": payload.get("location") or payload.get("waterLocation"),
                "district": payload.get("district"),
                "pH": payload.get("pH") or payload.get("ph"),
                "turbidity": payload.get("turbidity"),
                "tds": payload.get("tds"),
                "chlorine": payload.get("chlorine"),
                "fluoride": payload.get("fluoride"),
                "nitrate": payload.get("nitrate"),
                "coliform": payload.get("coliform"),
                "temperature": payload.get("temperature"),
                "primary_water_source": payload.get("water_source"),
                "water_treatment": payload.get("water_treatment") or payload.get("waterTreatment") or [],
                "unusual_flags": payload.get("unusual_water_flags") or []
            }

    meta.setdefault("received_at", now.isoformat())

    symptom_id = None

    if patient:
        doc = {**patient, "meta": meta, "created_at": now, "processed_by_model": False}
        res = await symptom_col.insert_one(doc)
        symptom_id = str(res.inserted_id)
        result["symptoms_saved"] = True

        # schedule immediate processing (async task)
        asyncio.create_task(schedule_immediate_processing(symptom_id))

    if water:
        doc2 = {**water, "meta": meta, "created_at": now}
        res2 = await water_col.insert_one(doc2)
        wid = str(res2.inserted_id)
        result["water_saved"] = True

        loc = doc2.get("location")
        if loc:
            asyncio.create_task(schedule_processing_by_location(loc))

    await raw_col.insert_one({"payload": payload, "meta": {"received_at": now.isoformat()}, "created_at": now})
    result["raw_saved"] = True

    return {"status": "ok", **result}


############################################################
# /predict endpoint
############################################################
@app.post("/predict")
async def predict_endpoint(payload: Report):
    raw_doc = payload.dict()
    raw_doc.setdefault("timestamp", datetime.utcnow().isoformat())
    await raw_col.insert_one(raw_doc)

    if not ML_READY:
        raise HTTPException(status_code=503, detail="Model not loaded")

    water_doc = {
        "pH": payload.pH if payload.pH is not None else payload.ph,
        "ph": payload.ph if payload.ph is not None else payload.pH,
        "turbidity": payload.turbidity,
        "tds": payload.tds,
        "chlorine": payload.chlorine,
        "fluoride": payload.fluoride,
        "nitrate": payload.nitrate,
        "coliform": payload.coliform,
        "temperature": payload.temperature
    }

    sym_doc = {
        "symptoms": payload.symptoms or [],
        "severity": payload.severity,
        "family_members_affected": payload.family_members_affected,
        "location": payload.location
    }

    # run predict_disease in threadpool (predict_disease is CPU-bound / sync)
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, predict_disease, water_doc, sym_doc)

    pred_doc = {
        "location": payload.location,
        "timestamp": datetime.utcnow(),
        "input": payload.dict(),
        "prediction": result
    }
    await prediction_col.insert_one(pred_doc)

    return {"prediction": result}


############################################################
# Matching + Background Poller
############################################################
async def schedule_immediate_processing(symptom_id: str):
    try:
        sym = await symptom_col.find_one({"_id": ObjectId(symptom_id)})
        if sym:
            await try_match_and_predict(sym)
    except Exception as e:
        print("schedule_immediate_processing error:", e)

async def schedule_processing_by_location(location: str):
    try:
        cursor = symptom_col.find(
            {"location": location, "processed_by_model": {"$ne": True}}
        ).sort("created_at", -1).limit(20)

        async for sym in cursor:
            await try_match_and_predict(sym)
    except Exception as e:
        print("schedule_processing_by_location error:", e)

async def try_match_and_predict(sym_doc: Dict[str, Any]):
    loc = sym_doc.get("location")
    if not loc:
        return None

    water_doc = await water_col.find_one(
        {"location": loc},
        sort=[("meta.submitted_at", -1), ("created_at", -1), ("_id", -1)]
    )

    if not water_doc:
        water_doc = await water_col.find_one({"village": loc}, sort=[("created_at", -1)])

    if not water_doc:
        return None

    try:
        return await merge_and_predict_and_store(sym_doc, water_doc)
    except Exception as e:
        print("try_match_and_predict error:", e)
        return None

async def poller_loop():
    seen_temp = set()
    while True:
        try:
            cursor = symptom_col.find(
                {"processed_by_model": {"$ne": True}}
            ).sort("created_at", -1).limit(200)

            async for sym in cursor:
                sid = str(sym.get("_id"))
                if sid in seen_temp:
                    continue
                await try_match_and_predict(sym)
                seen_temp.add(sid)

            if len(seen_temp) > 10000:
                seen_temp.clear()

        except Exception as e:
            print("Poller error:", e)

        await asyncio.sleep(POLL_INTERVAL_SECONDS)

@app.on_event("startup")
async def startup_tasks():
    # start the background poller
    asyncio.create_task(poller_loop())
    print("Background poller started.")
    # optionally print ML readiness
    print(f"ML_READY = {ML_READY}")

# --------------------------
# Convenience Endpoints
# --------------------------
@app.get("/predictions")
async def list_predictions(limit: int = 50):
    cursor = prediction_col.find().sort("predicted_at", -1).limit(limit)
    out = []
    async for d in cursor:
        out.append(serialize_bson(d))
    return out

@app.get("/water_reports")
async def get_water_reports(limit: int = 50):
    cursor = water_col.find().sort("created_at", -1).limit(limit)
    docs = []
    async for d in cursor:
        docs.append(serialize_bson(d))
    return docs

############################################################
# OUTBREAK DETECTION ENDPOINT
############################################################

OUTBREAK_THRESHOLD = 50  # SET THE DETECTION LIMIT

@app.get("/outbreak-status")
async def outbreak_status():
    """
    Declares an outbreak when predicted_disease count >= threshold.
    """
    pipeline = [
        {
            "$group": {
                "_id": "$prediction.predicted_disease",
                "count": {"$sum": 1}
            }
        }
    ]

    results = await prediction_col.aggregate(pipeline).to_list(None)

    final_output = []
    for r in results:
        disease = r["_id"]
        count = r["count"]

        if disease is None:
            continue

        final_output.append({
            "disease": disease,
            "count": count,
            "outbreak": count >= OUTBREAK_THRESHOLD
        })

    return {
        "threshold": OUTBREAK_THRESHOLD,
        "results": final_output
    }

############################################################
# END - Run using: uvicorn backend.app:app --reload --port 8000
############################################################
