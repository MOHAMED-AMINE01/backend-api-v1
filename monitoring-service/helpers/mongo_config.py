import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Final

MONGO_URL: Final[str] = os.getenv("MONGO_URL", "mongodb://admin:1234@mongodb:27017")
DB_NAME: Final[str] = os.getenv("MONGO_DB", "iot_monitoring")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

async def get_db():
    return db

async def ensure_indexes():
    """
    Ensure critical indexes exist for monitoring performance.
    - device_id and timestamp are used for history queries.
    """
    print("[MONGO] Ensuring indexes for metrics collection...")
    # Composite index for history queries (DESCENDING timestamp)
    await db.metrics.create_index([("device_id", 1), ("timestamp", -1)])
    # Optimization for owner-based queries
    await db.metrics.create_index([("owner_id", 1), ("timestamp", -1)])
    print("[MONGO] Indexes verified.")
