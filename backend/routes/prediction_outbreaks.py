# backend/routes/prediction_outbreaks.py
"""
Prediction-based outbreak detection endpoint.
Aggregates prediction_reports by area (district + village/area) and disease,
then identifies outbreak areas based on configurable thresholds.
"""

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from backend.services.mongo_client import prediction_col
from backend.app import serialize_bson
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["prediction-outbreaks"])

# ============================================================
# CONFIGURATION - Outbreak Thresholds
# ============================================================
# These can be moved to environment variables or a config file

OUTBREAK_MIN_THRESHOLD = 20      # Minimum predictions to be considered an outbreak
OUTBREAK_HIGH_THRESHOLD = 25     # Predictions >= this are "red" (high severity)
# 20-24 predictions = "yellow" (medium severity)

# District coordinates for mapping (same as hotspots.py)
DISTRICT_COORDS = {
    # Assam
    "guwahati": (26.1445, 91.7362),
    "kamrup": (26.3161, 91.5984),
    "Kamrup Metro": (26.17, 91.75),
    "kamrup metro": (26.17, 91.75),
    "jorhat": (26.7509, 94.2037),
    "Jorhat": (26.75, 94.20),
    "dibrugarh": (27.4728, 94.9120),
    "Dibrugarh": (27.48, 94.91),
    "silchar": (24.8333, 92.7789),
    "Cachar": (24.82, 92.78),
    "cachar": (24.82, 92.78),
    "tezpur": (26.6528, 92.7926),
    "Sonitpur": (26.63, 92.78),
    "sonitpur": (26.63, 92.78),
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
    "namchi": (27.1668, 88.3632),
}


def _now_utc():
    return datetime.utcnow()


def _get_coordinates(district: str, location: Optional[str] = None):
    """
    Try to find coordinates for a district or location.
    Returns (lat, lng) tuple or None.
    """
    # Try district first
    if district:
        district_str = str(district).strip()
        if district_str in DISTRICT_COORDS:
            return DISTRICT_COORDS[district_str]
        # Try lowercase
        key = district_str.lower()
        if key in DISTRICT_COORDS:
            return DISTRICT_COORDS[key]
    
    # Try location as fallback
    if location:
        location_str = str(location).strip()
        if location_str in DISTRICT_COORDS:
            return DISTRICT_COORDS[location_str]
        key = location_str.lower()
        if key in DISTRICT_COORDS:
            return DISTRICT_COORDS[key]
    
    return None


def _determine_color(total_predictions: int) -> str:
    """
    Determine circle color based on prediction count.
    - 20-24: yellow
    - 25+: red
    """
    if total_predictions >= OUTBREAK_HIGH_THRESHOLD:
        return "red"
    elif total_predictions >= OUTBREAK_MIN_THRESHOLD:
        return "yellow"
    return "green"  # Below threshold (shouldn't be returned but just in case)


def _determine_severity(total_predictions: int) -> str:
    """
    Determine severity level based on prediction count.
    """
    if total_predictions >= OUTBREAK_HIGH_THRESHOLD:
        return "high"
    elif total_predictions >= OUTBREAK_MIN_THRESHOLD:
        return "medium"
    return "low"


@router.get("/prediction-outbreaks")
async def get_prediction_outbreaks(
    district: Optional[str] = Query(None, description="Filter by district name"),
    disease: Optional[str] = Query(None, description="Filter by disease name"),
    days: int = Query(30, description="Time window in days (lookback period)"),
    min_threshold: int = Query(OUTBREAK_MIN_THRESHOLD, description="Minimum predictions to be an outbreak"),
    high_threshold: int = Query(OUTBREAK_HIGH_THRESHOLD, description="Predictions >= this are high severity"),
    limit: int = Query(100, description="Max outbreak areas to return"),
):
    """
    Returns outbreak areas based on aggregated prediction_reports.
    
    An outbreak is defined as an area (district + village/location) with
    >= min_threshold predictions within the specified time window.
    
    Response format:
    {
        "outbreaks": [
            {
                "id": "unique_id",
                "district": "Kamrup Metro",
                "areaName": "Fancy Bazar",
                "disease": "Cholera",
                "totalPredictions": 25,
                "latestPredictionDate": "2024-01-15T10:30:00Z",
                "coordinates": [26.17, 91.75],
                "color": "red",
                "severity": "high",
                "status": "PREDICTED OUTBREAK"
            },
            ...
        ],
        "thresholds": {
            "min": 20,
            "high": 25
        },
        "window_days": 30
    }
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
        match_stage["$or"] = [
            {"input_water.district": {"$regex": district, "$options": "i"}},
            {"district": {"$regex": district, "$options": "i"}},
        ]

    # Aggregation pipeline
    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": {
                    "district": {"$ifNull": ["$input_water.district", "$district"]},
                    "area": {"$ifNull": ["$input_water.location", "$village", "$area", "$location"]},
                    "disease": "$features.predicted_disease",
                },
                "totalPredictions": {"$sum": 1},
                "latestPredictionDate": {"$max": "$features.predicted_at"},
                "earliestPredictionDate": {"$min": "$features.predicted_at"},
                # Collect sample prediction IDs for reference
                "sampleIds": {
                    "$push": {
                        "id": "$_id",
                        "predicted_at": "$features.predicted_at",
                    }
                },
            }
        },
        # Only include areas meeting the outbreak threshold
        {"$match": {"totalPredictions": {"$gte": min_threshold}}},
        {"$sort": {"totalPredictions": -1}},
        {"$limit": limit},
        {
            "$project": {
                "_id": 0,
                "district": "$_id.district",
                "areaName": "$_id.area",
                "disease": "$_id.disease",
                "totalPredictions": 1,
                "latestPredictionDate": 1,
                "earliestPredictionDate": 1,
                "sampleIds": {"$slice": ["$sampleIds", 5]},  # Limit samples
            }
        },
    ]

    try:
        cursor = prediction_col.aggregate(pipeline)
        outbreaks = []

        async for doc in cursor:
            district_name = doc.get("district") or ""
            area_name = doc.get("areaName") or district_name
            total = doc.get("totalPredictions", 0)
            
            # Get coordinates
            coords = _get_coordinates(district_name, area_name)
            
            # Determine color and severity based on thresholds
            color = _determine_color(total)
            severity = _determine_severity(total)
            
            # Generate a unique ID
            outbreak_id = f"{district_name}-{area_name}-{doc.get('disease', 'unknown')}".replace(" ", "_").lower()
            
            # Process dates - convert datetime to ISO string if needed
            latest_date = doc.get("latestPredictionDate")
            if latest_date and isinstance(latest_date, datetime):
                latest_date = latest_date.isoformat()
            
            earliest_date = doc.get("earliestPredictionDate")
            if earliest_date and isinstance(earliest_date, datetime):
                earliest_date = earliest_date.isoformat()
            
            outbreak_entry = {
                "id": outbreak_id,
                "district": district_name,
                "areaName": area_name,
                "disease": doc.get("disease"),
                "totalPredictions": total,
                "latestPredictionDate": latest_date,
                "earliestPredictionDate": earliest_date,
                "coordinates": list(coords) if coords else None,
                "color": color,
                "severity": severity,
                "status": "PREDICTED OUTBREAK",
            }
            
            # Serialize to handle ObjectId, numpy, etc.
            outbreak_entry = serialize_bson(outbreak_entry)
            
            outbreaks.append(outbreak_entry)

        return {
            "outbreaks": outbreaks,
            "thresholds": {
                "min": min_threshold,
                "high": high_threshold,
            },
            "window_days": days,
            "total_outbreak_areas": len(outbreaks),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aggregation failed: {e}")


@router.get("/prediction-outbreaks/summary")
async def get_outbreak_summary(
    days: int = Query(30, description="Time window in days"),
):
    """
    Returns a summary of outbreak statistics without full details.
    Useful for dashboard cards.
    """
    now = _now_utc()
    since = now - timedelta(days=days)

    match_stage = {
        "features.predicted_at": {"$gte": since}
    }

    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": {
                    "district": {"$ifNull": ["$input_water.district", "$district"]},
                    "area": {"$ifNull": ["$input_water.location", "$village", "$area"]},
                },
                "count": {"$sum": 1},
            }
        },
        {
            "$group": {
                "_id": None,
                "total_predictions": {"$sum": "$count"},
                "total_areas": {"$sum": 1},
                "outbreak_areas": {
                    "$sum": {"$cond": [{"$gte": ["$count", OUTBREAK_MIN_THRESHOLD]}, 1, 0]}
                },
                "high_severity_areas": {
                    "$sum": {"$cond": [{"$gte": ["$count", OUTBREAK_HIGH_THRESHOLD]}, 1, 0]}
                },
            }
        },
    ]

    try:
        cursor = prediction_col.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        if result:
            summary = result[0]
            return {
                "total_predictions": summary.get("total_predictions", 0),
                "total_areas_monitored": summary.get("total_areas", 0),
                "outbreak_areas": summary.get("outbreak_areas", 0),
                "high_severity_areas": summary.get("high_severity_areas", 0),
                "window_days": days,
            }
        
        return {
            "total_predictions": 0,
            "total_areas_monitored": 0,
            "outbreak_areas": 0,
            "high_severity_areas": 0,
            "window_days": days,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary aggregation failed: {e}")
