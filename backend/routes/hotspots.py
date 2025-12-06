# backend/routes/hotspots.py
from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from backend.services.mongo_client import db, prediction_col
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["hotspots"])

def _now_utc():
    return datetime.utcnow()

@router.get("/hotspots")
async def get_hotspots(
    disease: Optional[str] = Query(None, description="Filter by disease name"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    days: int = Query(7, description="Time window in days"),
    threshold: int = Query(10, description="Minimum count to be considered a hotspot"),
    limit: int = Query(100, description="Max buckets to return"),
):
    """
    Returns hotspot buckets grouped by (location OR grid) + disease.
    Works with prediction_reports that have either:
      - top-level fields: predicted_disease, predicted_at, location
      - OR nested: prediction.predicted_disease, prediction.features, timestamp / predicted_at
    """

    now = _now_utc()
    since = now - timedelta(days=days)

    pr = prediction_col

    # Build an aggregation pipeline that:
    # - normalizes disease and predicted_at fields into "disease" and "predicted_at_norm"
    # - optionally filters by disease/district/time window
    # - groups by location string (fallback) and disease
    # - returns buckets with count and sample list
    pipeline: List[Dict[str, Any]] = []

    # 1) Add normalized fields: disease and predicted_at
    pipeline.append({
        "$addFields": {
            "disease_norm": {
                "$ifNull": [
                    "$predicted_disease",
                    {"$ifNull": ["$prediction.predicted_disease", None]}
                ]
            },
            "predicted_at_norm": {
                "$ifNull": [
                    "$predicted_at",
                    {"$ifNull": ["$prediction.predicted_at", {"$ifNull": ["$prediction.timestamp", "$timestamp"]} ]}
                ]
            },
            # keep location fallback
            "location_norm": {
                "$ifNull": ["$location", {"$ifNull": ["$input.sym_doc.location", "$input.water_doc.location"]}]
            }
        }
    })

    # 2) match by time window and optional disease/district
    match_stage = {
        "$match": {
            "disease_norm": {"$ne": None},
            # predicted_at_norm must exist and be within time window - relies on stored ISODate or string
            # We'll attempt to match by date if field is ISODate; if it's string ISO, Mongo will not compare directly -
            # but in your data predicted_at is a date object; so this should work.
            "predicted_at_norm": {"$gte": since}
        }
    }
    pipeline.append(match_stage)

    if disease:
        pipeline.append({"$match": {"disease_norm": {"$regex": f"^{disease}$", "$options": "i"}}})
    if district:
        # user sample had district inside input_water.district; try both
        pipeline.append({
            "$match": {
                "$or": [
                    {"location_norm": {"$regex": f"{district}", "$options": "i"}},
                    {"input_water.district": {"$regex": f"{district}", "$options": "i"}},
                    {"input.sym_doc.district": {"$regex": f"{district}", "$options": "i"}}
                ]
            }
        })

    # 3) Group by location_norm + disease_norm
    pipeline.append({
        "$group": {
            "_id": {"location": "$location_norm", "disease": "$disease_norm"},
            "count": {"$sum": 1},
            "samples": {"$push": {
                "prediction_id": "$_id",
                "patientName": {"$ifNull": ["$patientName", "$input.sym_doc.patientName"]},
                "predicted_at": "$predicted_at_norm",
                "location": "$location_norm"
            }}
        }
    })

    # 4) keep only groups >= threshold
    pipeline.append({"$match": {"count": {"$gte": threshold}}})

    # 5) sort by count desc, limit
    pipeline.append({"$sort": {"count": -1}})
    pipeline.append({"$limit": limit})

    # 6) project a friendly shape
    pipeline.append({
        "$project": {
            "_id": 0,
            "location": "$_id.location",
            "disease": "$_id.disease",
            "count": 1,
            "samples": {"$slice": ["$samples", 10]}
        }
    })

    try:
        cursor = pr.aggregate(pipeline)
        out = []
        async for doc in cursor:
            # compute severity based on threshold
            cnt = doc.get("count", 0)
            if cnt >= threshold * 1.5:
                severity = "high"
            elif cnt >= threshold:
                severity = "medium"
            else:
                severity = "low"

            out.append({
                "location": doc.get("location"),
                "disease": doc.get("disease"),
                "count": cnt,
                "severity": severity,
                "samples": doc.get("samples", [])
            })

        return {"hotspots": out, "threshold": threshold, "window_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aggregation failed: {e}")