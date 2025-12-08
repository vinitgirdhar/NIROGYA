from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(prefix="/api", tags=["water-bodies"])

WaterBodyType = Literal["river", "lake"]


class WaterBody(BaseModel):
    id: str
    name: str
    type: WaterBodyType
    state: Optional[str] = None
    district: Optional[str] = None
    qualityIndex: float = Field(..., description="Numeric quality index")
    qualityClass: str = Field(..., description="Quality bucket label")
    lastUpdated: Optional[str] = None
    pollution: Dict[str, float] = Field(default_factory=dict)
    geometry: Dict[str, Any] = Field(..., description="GeoJSON geometry")


_SAMPLE_DATA: List[WaterBody] = [
    # Northeast Region - Rivers
    WaterBody(
        id="brahmaputra-assam",
        name="Brahmaputra River (Assam)",
        type="river",
        state="Assam",
        district="Guwahati",
        qualityIndex=2.3,
        qualityClass="Moderate",
        lastUpdated="2024-12-01",
        pollution={"bod": 2.8, "cod": 11.2, "do": 5.8, "ph": 7.2, "tds": 285},
        geometry={
            "type": "LineString",
            "coordinates": [
                [91.7362, 26.1445],
                [91.8262, 26.1845],
                [91.9162, 26.2245],
                [92.0062, 26.2645],
                [92.0962, 26.3045],
            ],
        },
    ),
    WaterBody(
        id="barak-river",
        name="Barak River",
        type="river",
        state="Assam",
        district="Cachar",
        qualityIndex=1.8,
        qualityClass="Good",
        lastUpdated="2024-11-28",
        pollution={"bod": 1.9, "cod": 8.5, "do": 6.5, "ph": 7.1, "tds": 220},
        geometry={
            "type": "LineString",
            "coordinates": [
                [92.7877, 24.8333],
                [92.8777, 24.8733],
                [92.9677, 24.9133],
            ],
        },
    ),
    WaterBody(
        id="subansiri-river",
        name="Subansiri River",
        type="river",
        state="Arunachal Pradesh",
        district="Lakhimpur",
        qualityIndex=1.5,
        qualityClass="Good",
        lastUpdated="2024-11-30",
        pollution={"bod": 1.5, "cod": 7.2, "do": 7.2, "ph": 7.0, "tds": 180},
        geometry={
            "type": "LineString",
            "coordinates": [
                [93.7167, 27.5833],
                [93.8067, 27.6233],
                [93.8967, 27.6633],
            ],
        },
    ),
    WaterBody(
        id="teesta-river",
        name="Teesta River",
        type="river",
        state="Sikkim",
        district="North Sikkim",
        qualityIndex=1.2,
        qualityClass="Good",
        lastUpdated="2024-12-02",
        pollution={"bod": 1.2, "cod": 6.5, "do": 7.8, "ph": 6.9, "tds": 150},
        geometry={
            "type": "LineString",
            "coordinates": [
                [88.6139, 27.3314],
                [88.7039, 27.3714],
                [88.7939, 27.4114],
            ],
        },
    ),
    # Northeast Region - Lakes
    WaterBody(
        id="loktak-lake",
        name="Loktak Lake",
        type="lake",
        state="Manipur",
        district="Bishnupur",
        qualityIndex=2.8,
        qualityClass="Moderate",
        lastUpdated="2024-11-25",
        pollution={"bod": 3.5, "cod": 13.8, "do": 4.8, "ph": 7.5, "tds": 340},
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [93.7833, 24.5167],
                [93.8833, 24.5167],
                [93.8833, 24.4167],
                [93.7833, 24.4167],
                [93.7833, 24.5167],
            ]],
        },
    ),
    WaterBody(
        id="umiam-lake",
        name="Umiam Lake",
        type="lake",
        state="Meghalaya",
        district="East Khasi Hills",
        qualityIndex=1.6,
        qualityClass="Good",
        lastUpdated="2024-11-29",
        pollution={"bod": 1.8, "cod": 8.1, "do": 6.8, "ph": 7.0, "tds": 195},
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [91.9167, 25.6833],
                [91.9667, 25.6833],
                [91.9667, 25.6333],
                [91.9167, 25.6333],
                [91.9167, 25.6833],
            ]],
        },
    ),
    WaterBody(
        id="tsomgo-lake",
        name="Tsomgo Lake",
        type="lake",
        state="Sikkim",
        district="East Sikkim",
        qualityIndex=1.1,
        qualityClass="Good",
        lastUpdated="2024-12-01",
        pollution={"bod": 1.0, "cod": 5.8, "do": 8.2, "ph": 6.8, "tds": 140},
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [88.7589, 27.3536],
                [88.7789, 27.3536],
                [88.7789, 27.3336],
                [88.7589, 27.3336],
                [88.7589, 27.3536],
            ]],
        },
    ),
    WaterBody(
        id="deepor-beel",
        name="Deepor Beel",
        type="lake",
        state="Assam",
        district="Kamrup",
        qualityIndex=3.2,
        qualityClass="Poor",
        lastUpdated="2024-11-27",
        pollution={"bod": 4.2, "cod": 16.5, "do": 4.2, "ph": 7.8, "tds": 380},
        geometry={
            "type": "Polygon",
            "coordinates": [[
                [91.6667, 26.1167],
                [91.7167, 26.1167],
                [91.7167, 26.0667],
                [91.6667, 26.0667],
                [91.6667, 26.1167],
            ]],
        },
    ),
    # Legacy data
    WaterBody(
        id="ganga-varanasi",
        name="Ganga River (Varanasi stretch)",
        type="river",
        state="Uttar Pradesh",
        district="Varanasi",
        qualityIndex=2.1,
        qualityClass="Moderate",
        lastUpdated="2024-11-15",
        pollution={"bod": 3.2, "cod": 12.5, "do": 5.1, "ph": 7.4, "tds": 320},
        geometry={
            "type": "LineString",
            "coordinates": [
                [82.9602, 25.367],
                [82.9731, 25.3389],
                [83.0052, 25.2825],
            ],
        },
    ),
    WaterBody(
        id="yamuna-delhi",
        name="Yamuna River (Delhi)",
        type="river",
        state="Delhi",
        district="New Delhi",
        qualityIndex=3.7,
        qualityClass="Poor",
        lastUpdated="2024-11-18",
        pollution={"bod": 8.1, "cod": 32.4, "do": 2.3, "ph": 7.1, "tds": 510},
        geometry={
            "type": "LineString",
            "coordinates": [
                [77.218, 28.935],
                [77.246, 28.85],
                [77.275, 28.755],
            ],
        },
    ),
    WaterBody(
        id="sabarmati-ahmedabad",
        name="Sabarmati River (Ahmedabad)",
        type="river",
        state="Gujarat",
        district="Ahmedabad",
        qualityIndex=1.6,
        qualityClass="Good",
        lastUpdated="2024-10-28",
        pollution={"bod": 2.4, "cod": 8.8, "do": 6.2, "ph": 7.5, "tds": 290},
        geometry={
            "type": "LineString",
            "coordinates": [
                [72.57, 23.15],
                [72.58, 23.05],
                [72.59, 22.98],
            ],
        },
    ),
    WaterBody(
        id="powai-lake",
        name="Powai Lake",
        type="lake",
        state="Maharashtra",
        district="Mumbai",
        qualityIndex=2.8,
        qualityClass="Moderate",
        lastUpdated="2024-11-02",
        pollution={"bod": 4.5, "cod": 18.2, "do": 4.1, "ph": 7.2, "tds": 410},
        geometry={
            "type": "Polygon",
            "coordinates": [
                [
                    [72.9055, 19.1285],
                    [72.913, 19.1255],
                    [72.9175, 19.1205],
                    [72.9115, 19.1165],
                    [72.9045, 19.1195],
                    [72.9055, 19.1285],
                ]
            ],
        },
    ),
    WaterBody(
        id="chilika-lake",
        name="Chilika Lake",
        type="lake",
        state="Odisha",
        district="Puri",
        qualityIndex=1.4,
        qualityClass="Good",
        lastUpdated="2024-10-30",
        pollution={"bod": 1.8, "cod": 7.4, "do": 7.1, "ph": 7.9, "tds": 240},
        geometry={
            "type": "Polygon",
            "coordinates": [
                [
                    [85.19, 19.71],
                    [85.38, 19.7],
                    [85.45, 19.6],
                    [85.33, 19.54],
                    [85.14, 19.58],
                    [85.19, 19.71],
                ]
            ],
        },
    ),
]


def _matches(value: Optional[str], needle: Optional[str]) -> bool:
    if not needle:
        return True
    if value is None:
        return False
    return needle.lower() in value.lower()


def _quality_matches(value: Optional[str], needle: Optional[str]) -> bool:
    if not needle:
        return True
    if value is None:
        return False
    return value.lower() == needle.lower()


@router.get("/water-bodies", response_model=List[WaterBody])
async def list_water_bodies(
    types: Optional[str] = Query(None, description="Comma separated: river,lake"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    quality: Optional[str] = Query(None, description="Quality label e.g. Good/Moderate/Poor"),
):
    type_filters = None
    if types:
        type_filters = {t.strip().lower() for t in types.split(",") if t.strip()}

    out: List[WaterBody] = []
    for wb in _SAMPLE_DATA:
        if type_filters and wb.type.lower() not in type_filters:
            continue
        if not _matches(wb.state, state):
            continue
        if not _matches(wb.district, district):
            continue
        if not _quality_matches(wb.qualityClass, quality):
            continue
        out.append(wb)

    return out


@router.get("/water-bodies/meta")
async def water_body_meta():
    states = sorted({wb.state for wb in _SAMPLE_DATA if wb.state})
    districts = sorted({wb.district for wb in _SAMPLE_DATA if wb.district})
    qualities = sorted({wb.qualityClass for wb in _SAMPLE_DATA if wb.qualityClass})
    return {
        "states": states,
        "districts": districts,
        "qualities": qualities,
        "updated_at": datetime.utcnow().isoformat(),
        "count": len(_SAMPLE_DATA),
    }
