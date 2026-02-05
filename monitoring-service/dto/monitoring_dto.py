from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any, Optional

class MetricResponse(BaseModel):
    device_id: int
    timestamp: datetime
    owner_id: int
    data: Dict[str, Any]

class HistoryResponse(BaseModel):
    device_id: int
    count: int
    history: List[MetricResponse]
