from motor.motor_asyncio import AsyncIOMotorDatabase
from entities.metrics import Metric
from datetime import datetime
from typing import List, Optional

async def insert_metric(db: AsyncIOMotorDatabase, metric: Metric):
    """
    Inserts a single metric into the 'metrics' collection.
    """
    # Convert Pydantic model to dictionary for MongoDB
    metric_dict = metric.model_dump()
    await db.metrics.insert_one(metric_dict)

async def get_device_history(db: AsyncIOMotorDatabase, device_id: int, limit: int = 100) -> List[dict]:
    """
    Retrieves the last N metrics for a specific device with projection for performance.
    """
    cursor = db.metrics.find(
        {"device_id": device_id},
        {"_id": 0, "device_id": 1, "timestamp": 1, "owner_id": 1, "data": 1}
    ).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(length=limit)

async def get_metrics_by_date(
    db: AsyncIOMotorDatabase, 
    device_id: int, 
    start_date: datetime, 
    end_date: datetime,
    limit: int = 500
) -> List[dict]:
    """
    Retrieves metrics for a device between two dates with limit and projection.
    """
    query = {
        "device_id": device_id,
        "timestamp": {
            "$gte": start_date,
            "$lte": end_date
        }
    }
    # Sort DESC to get LATEST metrics first, then limit to avoid timeout
    cursor = db.metrics.find(
        query,
        {"_id": 0, "device_id": 1, "timestamp": 1, "owner_id": 1, "data": 1}
    ).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(length=limit)

async def get_user_metrics(db: AsyncIOMotorDatabase, owner_id: int, limit: int = 100) -> List[dict]:
    """
    Retrieves latest metrics for all devices of a user with projection.
    """
    cursor = db.metrics.find(
        {"owner_id": owner_id},
        {"_id": 0, "device_id": 1, "timestamp": 1, "owner_id": 1, "data": 1}
    ).sort("timestamp", -1).limit(limit)
    return await cursor.to_list(length=limit)

async def insert_weather(db: AsyncIOMotorDatabase, weather_data: dict):
    """Stores weather snapshot in the weather_logs collection."""
    weather_data["logged_at"] = datetime.now()
    await db.weather_logs.insert_one(weather_data)

async def get_latest_weather(db: AsyncIOMotorDatabase) -> Optional[dict]:
    """Retrieves the most recent weather snapshot."""
    return await db.weather_logs.find_one({}, {"_id": 0}, sort=[("logged_at", -1)])
