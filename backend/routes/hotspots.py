# backend/routes/hotspots.py
from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from backend.services.mongo_client import prediction_col
from backend.app import serialize_bson  # IMPORTANT FIX for serialization
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["hotspots"])

# North East India District Coordinates (Approximate Centers)
# Updated with tuple format for consistency
DISTRICT_COORDS = {
    # Assam
    "guwahati": (26.1445, 91.7362),
    "kamrup": (26.3161, 91.5984),
    "Kamrup Metro": (26.17, 91.75),
    "jorhat": (26.7509, 94.2037),
    "Jorhat": (26.75, 94.20),
    "dibrugarh": (27.4728, 94.9120),
    "Dibrugarh": (27.48, 94.91),
    "silchar": (24.8333, 92.7789),
    "Cachar": (24.82, 92.78),
    "tezpur": (26.6528, 92.7926),
    "Sonitpur": (26.63, 92.78),
    "nagaon": (26.3479, 92.6906),
    "tinsukia": (27.4886, 95.3558),
    # Meghalaya
    "shillong": (25.5788, 91.8933),
    "tura": (25.5141, 90.2032),
    "jowai": (25.4468, 92.2116),
    # Manipur
    "imphal": (24.8170, 93.9368),
    "churachandpur": (24.3333, 93.6667),
    # Mizoram
    "aizawl": (23.7271, 92.7176),
    "lunglei": (22.8896, 92.7400),
    # Nagaland
    "kohima": (25.6701, 94.1077),
    "dimapur": (25.9060, 93.7272),
    # Tripura
    "agartala": (23.8315, 91.2868),
    "udaipur": (23.5363, 91.4847),
    # Arunachal Pradesh
    "itanagar": (27.0844, 93.6053),
    "tawang": (27.5861, 91.8594),
    "pasighat": (28.0665, 95.3271),
    # Sikkim
    "gangtok": (27.3389, 88.6065),
    "namchi": (27.1668, 88.3632)
}

# Alias for backward compatibility
NE_DISTRICT_COORDS = DISTRICT_COORDS

def _now_utc():
    return datetime.utcnow()

@router.get("/heatmap")
async def get_heatmap_data(
    disease: Optional[str] = Query(None, description="Filter by disease name"),
    days: int = Query(30, description="Time window in days"),
):
    """
    Returns heatmap data points [lat, lng, intensity] based on prediction counts.
    Works with new structure: features.predicted_disease, features.predicted_at
    """
    now = _now_utc()
    since = now - timedelta(days=days)

    match_stage: Dict[str, Any] = {
        "features.predicted_at": {"$gte": since}
    }

    if disease:
        match_stage["features.predicted_disease"] = {
            "$regex": f"^{disease}$",
            "$options": "i",
        }

    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": {
                    "district": "$input_water.district",
                    "location": "$input_water.location"
                },
                "count": {"$sum": 1}
            }
        }
    ]

    cursor = prediction_col.aggregate(pipeline)
    points = []
    
    async for doc in cursor:
        district = doc["_id"].get("district")
        location = doc["_id"].get("location")
        count = doc["count"]
        
        # Try to find coordinates
        coords = None
        
        # 1. Try district lookup (try both with and without case)
        if district and isinstance(district, str):
            # Try exact match first
            if district in DISTRICT_COORDS:
                coords = DISTRICT_COORDS[district]
            else:
                # Try lowercase
                key = district.lower().strip()
                if key in DISTRICT_COORDS:
                    coords = DISTRICT_COORDS[key]
        
        # 2. Try location lookup if district failed
        if not coords and location and isinstance(location, str):
            if location in DISTRICT_COORDS:
                coords = DISTRICT_COORDS[location]
            else:
                key = location.lower().strip()
                if key in DISTRICT_COORDS:
                    coords = DISTRICT_COORDS[key]
        
        if coords:
            # Return as [lat, lng, intensity]
            points.append([coords[0], coords[1], count])

    return points

@router.get("/hotspots")
async def get_hotspots(
    disease: Optional[str] = Query(None, description="Filter by disease name"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    days: int = Query(7, description="Time window in days"),
    threshold: int = Query(10, description="Minimum count to be considered a hotspot"),
    limit: int = Query(100, description="Max buckets to return"),
):
    """
    Returns hotspot buckets grouped by district/location + disease.
    Works with new prediction structure: features.predicted_disease, features.predicted_at
    """

    now = _now_utc()
    since = now - timedelta(days=days)

    # Build match stage
    match_stage: Dict[str, Any] = {
        "features.predicted_at": {"$gte": since}
    }

    if disease:
        match_stage["features.predicted_disease"] = {
            "$regex": f"^{disease}$",
            "$options": "i",
        }

    if district:
        match_stage["input_water.district"] = {
            "$regex": district,
            "$options": "i",
        }

    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": {
                    "district": "$input_water.district",
                    "location": "$input_water.location",
                    "disease": "$features.predicted_disease",
                },
                "count": {"$sum": 1},
                "samples": {
                    "$push": {
                        "prediction_id": "$_id",
                        "patientName": "$patientName",
                        "predicted_at": "$features.predicted_at",
                        "location": {
                            "$ifNull": ["$input_water.location", "$location"]
                        },
                    }
                },
            }
        },
        {"$match": {"count": {"$gte": threshold}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {
            "$project": {
                "_id": 0,
                "district": "$_id.district",
                "location": {"$ifNull": ["$_id.location", "$_id.district"]},
                "disease": "$_id.disease",
                "count": 1,
                "samples": {"$slice": ["$samples", 10]},
            }
        },
    ]

    try:
        cursor = prediction_col.aggregate(pipeline)
        results = []

        async for doc in cursor:
            count = int(doc.get("count", 0))

            if count >= threshold * 1.5:
                severity = "high"
            else:
                severity = "medium"

            district_name = doc.get("district") or ""
            coords = DISTRICT_COORDS.get(district_name)

            clean_doc = {
                "location": doc.get("location"),
                "district": district_name,
                "disease": doc.get("disease"),
                "count": count,
                "severity": severity,
                "samples": doc.get("samples", []),
                "center": list(coords) if coords else None,
            }

            # FIX: convert all ObjectId, datetime, numpy, etc. to JSON-safe types
            clean_doc = serialize_bson(clean_doc)
            results.append(clean_doc)

        return {
            "hotspots": results,
            "threshold": threshold,
            "window_days": days,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aggregation failed: {e}")