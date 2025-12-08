from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from backend.services.mongo_client import symptom_col

router = APIRouter(prefix="/api", tags=["heatmap"])


class HeatmapPoint(BaseModel):
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    intensity: float = Field(..., description="Symptom intensity (0-1)")
    count: int = Field(..., description="Number of reports")
    symptoms: List[str] = Field(default_factory=list, description="Common symptoms")


@router.get("/heatmap/symptoms", response_model=List[HeatmapPoint])
async def get_symptom_heatmap(
    min_lat: Optional[float] = Query(None, description="Minimum latitude"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude"),
    min_lng: Optional[float] = Query(None, description="Minimum longitude"),
    max_lng: Optional[float] = Query(None, description="Maximum longitude"),
    days: int = Query(30, description="Number of days to look back"),
):
    """
    Fetch aggregated symptom data for heatmap visualization.
    Returns points with intensity based on symptom report frequency.
    """
    
    # For now, return mock data for Northeast region
    # TODO: Replace with actual database query from symptom_col
    
    mock_data = [
        # High intensity areas (red) - More symptom reports
        HeatmapPoint(
            lat=26.1445,
            lng=91.7362,
            intensity=0.9,
            count=45,
            symptoms=["diarrhea", "stomach_pain", "nausea"]
        ),
        HeatmapPoint(
            lat=26.1845,
            lng=91.8262,
            intensity=0.85,
            count=38,
            symptoms=["vomiting", "fever", "diarrhea"]
        ),
        HeatmapPoint(
            lat=24.8333,
            lng=92.7877,
            intensity=0.92,
            count=52,
            symptoms=["skin_rash", "diarrhea", "fever"]
        ),
        HeatmapPoint(
            lat=24.5167,
            lng=93.7833,
            intensity=0.88,
            count=41,
            symptoms=["stomach_pain", "nausea", "headache"]
        ),
        
        # Medium intensity areas (yellow)
        HeatmapPoint(
            lat=26.2245,
            lng=91.9162,
            intensity=0.6,
            count=22,
            symptoms=["nausea", "fatigue"]
        ),
        HeatmapPoint(
            lat=25.6833,
            lng=91.9167,
            intensity=0.55,
            count=18,
            symptoms=["headache", "dizziness"]
        ),
        HeatmapPoint(
            lat=27.3314,
            lng=88.6139,
            intensity=0.5,
            count=15,
            symptoms=["stomach_pain"]
        ),
        HeatmapPoint(
            lat=26.1167,
            lng=91.6667,
            intensity=0.65,
            count=25,
            symptoms=["diarrhea", "nausea"]
        ),
        
        # Low intensity areas (normal)
        HeatmapPoint(
            lat=27.5833,
            lng=93.7167,
            intensity=0.3,
            count=8,
            symptoms=["fatigue"]
        ),
        HeatmapPoint(
            lat=27.3536,
            lng=88.7589,
            intensity=0.25,
            count=6,
            symptoms=["headache"]
        ),
        HeatmapPoint(
            lat=24.9133,
            lng=92.9677,
            intensity=0.35,
            count=10,
            symptoms=["nausea"]
        ),
        HeatmapPoint(
            lat=26.3045,
            lng=92.0962,
            intensity=0.4,
            count=12,
            symptoms=["stomach_pain"]
        ),
        
        # Additional scattered points for better heatmap coverage
        HeatmapPoint(lat=26.0, lng=91.8, intensity=0.7, count=28, symptoms=["diarrhea", "fever"]),
        HeatmapPoint(lat=26.3, lng=91.9, intensity=0.45, count=14, symptoms=["nausea"]),
        HeatmapPoint(lat=25.9, lng=92.0, intensity=0.55, count=19, symptoms=["stomach_pain"]),
        HeatmapPoint(lat=25.5, lng=91.7, intensity=0.38, count=11, symptoms=["fatigue"]),
        HeatmapPoint(lat=24.7, lng=92.8, intensity=0.82, count=35, symptoms=["diarrhea", "vomiting"]),
        HeatmapPoint(lat=27.2, lng=88.7, intensity=0.28, count=7, symptoms=["headache"]),
        HeatmapPoint(lat=27.6, lng=93.8, intensity=0.32, count=9, symptoms=["dizziness"]),
        HeatmapPoint(lat=24.4, lng=93.8, intensity=0.75, count=31, symptoms=["skin_rash", "fever"]),
    ]
    
    # Filter by bounding box if provided
    filtered = mock_data
    if min_lat is not None:
        filtered = [p for p in filtered if p.lat >= min_lat]
    if max_lat is not None:
        filtered = [p for p in filtered if p.lat <= max_lat]
    if min_lng is not None:
        filtered = [p for p in filtered if p.lng >= min_lng]
    if max_lng is not None:
        filtered = [p for p in filtered if p.lng <= max_lng]
    
    return filtered


@router.get("/heatmap/stats")
async def get_heatmap_stats():
    """Get aggregated statistics for the heatmap"""
    return {
        "total_reports": 475,
        "high_risk_areas": 4,
        "medium_risk_areas": 4,
        "low_risk_areas": 4,
        "most_common_symptoms": [
            {"name": "diarrhea", "count": 178},
            {"name": "stomach_pain", "count": 142},
            {"name": "nausea", "count": 128},
            {"name": "fever", "count": 95},
            {"name": "headache", "count": 67},
        ],
        "last_updated": datetime.utcnow().isoformat(),
    }
