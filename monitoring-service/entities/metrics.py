from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel, Field

class Metric(BaseModel):
    device_id: int
    owner_id: int
    topic: str                             # Ex: "device/iot/temperature" ou "device/status/1"
    data: Dict[str, Any]                   # Contiendra soit {"value": 25}, soit {"cpu": 10, "ram": 50}, etc.
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
