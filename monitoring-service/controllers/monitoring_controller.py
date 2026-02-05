from fastapi import APIRouter, Depends, HTTPException
from helpers.mongo_config import get_db
from dal import monitoring_dao
from dto.monitoring_dto import HistoryResponse, MetricResponse
from datetime import datetime
from typing import List, Optional

from helpers.auth_helper import get_current_user

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

@router.get("/weather/current")
async def get_current_weather(
    db = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Returns the latest recorded weather data.
    """
    weather = await monitoring_dao.get_latest_weather(db)
    if not weather:
        return {"status": "pending", "message": "Weather data sync in progress"}
    return weather

@router.get("/history/{device_id}", response_model=HistoryResponse)
async def get_device_history(
    device_id: int, 
    limit: int = 50, 
    db = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Returns the last metrics stored for a device.
    Only owner or admin can access.
    """
    results = await monitoring_dao.get_device_history(db, device_id, limit)
    
    # Filter and format
    history = []
    for doc in results:
        # Check ownership: owner_id must match OR user must be admin
        if doc.get("owner_id") == user["user_id"] or user["is_admin"]:
            history.append(MetricResponse(
                device_id=doc["device_id"],
                timestamp=doc["timestamp"],
                owner_id=doc["owner_id"],
                data=doc["data"]
            ))
        
    return HistoryResponse(
        device_id=device_id,
        count=len(history),
        history=history
    )

@router.get("/filter/{device_id}", response_model=List[MetricResponse])
async def filter_by_date(
    device_id: int,
    start: str,
    end: str,
    limit: int = 500,
    db = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Filter metrics by ISO date range.
    Only owner or admin can access.
    """
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
        results = await monitoring_dao.get_metrics_by_date(db, device_id, start_dt, end_dt, limit)
        
        # Security check: Filter results where user is owner or admin
        return [MetricResponse(
            device_id=doc["device_id"],
            timestamp=doc["timestamp"],
            owner_id=doc["owner_id"],
            data=doc["data"]
        ) for doc in results if doc.get("owner_id") == user["user_id"] or user["is_admin"]]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format (ISO required)")

@router.get("/user/metrics", response_model=List[MetricResponse])
async def get_my_metrics(
    limit: int = 50,
    db = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Returns the latest metrics for all devices owned by the authenticated user.
    """
    results = await monitoring_dao.get_user_metrics(db, user["user_id"], limit)
    
    return [MetricResponse(
        device_id=doc["device_id"],
        timestamp=doc["timestamp"],
        owner_id=doc["owner_id"],
        data=doc["data"]
    ) for doc in results]
