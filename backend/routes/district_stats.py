# backend/routes/district_stats.py
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import datetime, timedelta
from backend.services.mongo_client import prediction_col, symptom_col, water_col
from backend.app import serialize_bson

router = APIRouter(prefix="/api/districts", tags=["districts"])

# Outbreak detection constants
OUTBREAK_THRESHOLD = 20  # 20+ cases => outbreak
WINDOW_DAYS = 7          # last 7 days only


@router.get("/")
async def get_all_districts():
    """
    Get list of all districts with basic stats.
    """
    # Get unique districts from predictions
    pipeline = [
        {
            "$group": {
                "_id": "$input_water.district",
                "total_cases": {"$sum": 1},
                "latest": {"$max": "$features.predicted_at"}
            }
        },
        {"$sort": {"total_cases": -1}}
    ]
    
    results = await prediction_col.aggregate(pipeline).to_list(None)
    
    districts = []
    for r in results:
        if r["_id"]:
            districts.append({
                "district": r["_id"],
                "total_cases": r["total_cases"],
                "last_report": r["latest"].isoformat() if r["latest"] else None
            })
    
    return {"districts": districts}


@router.get("/stats")
async def get_district_stats(
    district: str = Query(..., description="District name"),
    days: int = Query(30, description="Number of days to look back")
):
    """
    Get detailed statistics for a specific district.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    # Disease breakdown
    disease_pipeline = [
        {
            "$match": {
                "input_water.district": district,
                "features.predicted_at": {"$gte": cutoff}
            }
        },
        {
            "$group": {
                "_id": "$features.predicted_disease",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    disease_results = await prediction_col.aggregate(disease_pipeline).to_list(None)
    
    # Daily trend
    daily_pipeline = [
        {
            "$match": {
                "input_water.district": district,
                "features.predicted_at": {"$gte": cutoff}
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$features.predicted_at"}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    daily_results = await prediction_col.aggregate(daily_pipeline).to_list(None)
    
    # Water quality summary
    water_pipeline = [
        {"$match": {"district": district}},
        {"$sort": {"created_at": -1}},
        {"$limit": 10}
    ]
    
    water_results = await water_col.aggregate(water_pipeline).to_list(None)
    
    avg_ph = 0
    avg_turbidity = 0
    if water_results:
        ph_values = [w.get("pH") or w.get("ph") for w in water_results if w.get("pH") or w.get("ph")]
        turb_values = [w.get("turbidity") for w in water_results if w.get("turbidity")]
        avg_ph = sum(ph_values) / len(ph_values) if ph_values else 0
        avg_turbidity = sum(turb_values) / len(turb_values) if turb_values else 0
    
    return {
        "district": district,
        "period_days": days,
        "disease_breakdown": [
            {"disease": r["_id"], "count": r["count"]}
            for r in disease_results if r["_id"]
        ],
        "daily_trend": [
            {"date": r["_id"], "count": r["count"]}
            for r in daily_results
        ],
        "water_quality": {
            "avg_ph": round(avg_ph, 2),
            "avg_turbidity": round(avg_turbidity, 2),
            "recent_reports": len(water_results)
        },
        "total_cases": sum(r["count"] for r in disease_results)
    }


@router.get("/comparison")
async def compare_districts(
    districts: str = Query(..., description="Comma-separated list of districts"),
    days: int = Query(30, description="Number of days to look back")
):
    """
    Compare statistics across multiple districts.
    """
    district_list = [d.strip() for d in districts.split(",")]
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    comparison = []
    
    for district in district_list:
        pipeline = [
            {
                "$match": {
                    "input_water.district": district,
                    "features.predicted_at": {"$gte": cutoff}
                }
            },
            {
                "$group": {
                    "_id": "$features.predicted_disease",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await prediction_col.aggregate(pipeline).to_list(None)
        
        total = sum(r["count"] for r in results)
        top_disease = max(results, key=lambda x: x["count"])["_id"] if results else None
        
        comparison.append({
            "district": district,
            "total_cases": total,
            "top_disease": top_disease
        })
    
    return {
        "comparison": comparison,
        "period_days": days
    }


@router.get("/alerts")
async def get_district_alerts(
    threshold: int = Query(5, description="Minimum cases to trigger alert")
):
    """
    Get districts with elevated disease activity.
    """
    cutoff = datetime.utcnow() - timedelta(days=7)
    
    pipeline = [
        {"$match": {"features.predicted_at": {"$gte": cutoff}}},
        {
            "$group": {
                "_id": {
                    "location": "$input_water.district",
                    "disease": "$features.predicted_disease"
                },
                "count": {"$sum": 1}
            }
        },
        {"$match": {"count": {"$gte": threshold}}},
        {"$sort": {"count": -1}}
    ]
    
    results = await prediction_col.aggregate(pipeline).to_list(None)
    
    alerts = []
    for r in results:
        if r["_id"]["location"] and r["_id"]["disease"]:
            severity = "critical" if r["count"] >= 15 else "high" if r["count"] >= 10 else "medium"
            alerts.append({
                "district": r["_id"]["location"],
                "disease": r["_id"]["disease"],
                "cases": r["count"],
                "severity": severity,
                "message": f"{r['count']} cases of {r['_id']['disease']} detected in {r['_id']['location']}"
            })
    
    return {
        "alerts": alerts,
        "threshold": threshold,
        "period": "last_7_days"
    }


@router.get("/district-disease-stats")
async def district_disease_stats(
    district: str = Query(..., description="District name e.g. 'Dibrugarh'")
):
    """
    Returns district-wise disease counts and outbreak flags, based on
    prediction_reports in the last WINDOW_DAYS days.
    """

    try:
        since = datetime.utcnow() - timedelta(days=WINDOW_DAYS)

        pipeline = [
            {
                "$match": {
                    "input_water.district": district,
                    "features.predicted_at": {"$gte": since},
                }
            },
            {
                "$group": {
                    "_id": "$features.predicted_disease",
                    "count": {"$sum": 1},
                }
            },
        ]

        docs = await prediction_col.aggregate(pipeline).to_list(length=None)

        diseases = []
        total = 0

        for row in docs:
            name = row.get("_id") or "Unknown"
            count = int(row.get("count", 0))
            total += count

            diseases.append(
                {
                    "name": name,
                    "count": count,
                    "outbreak": count >= OUTBREAK_THRESHOLD,
                }
            )

        # Serialize to handle any BSON types
        return serialize_bson({
            "district": district,
            "total_reports": total,
            "diseases": diseases,
            "threshold": OUTBREAK_THRESHOLD,
            "window_days": WINDOW_DAYS,
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute stats: {e}")
