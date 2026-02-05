from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Any
from datetime import datetime
from entities.device import DeviceCategory, DeviceStatus, IoTType

class DeviceBase(BaseModel):
    name: str
    category: DeviceCategory
    type: IoTType
    status: DeviceStatus = DeviceStatus.ONLINE

class DeviceCreate(DeviceBase):
    configuration: Optional[dict[str, Any]] = None

    @field_validator('configuration')
    @classmethod
    def validate_config_by_category(cls, v: Any, info: Any) -> Any:
        # Check the category from the input data
        category = info.data.get('category')
        if category == DeviceCategory.IOT_DEVICE and v is not None:
            raise ValueError("Configuration must be null for IoT Devices")
        if category == DeviceCategory.END_DEVICE and v is None:
             # Optionnel: On pourrait forcer une config par défaut pour les End Devices
             return {}
        return v

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[DeviceStatus] = None
    configuration: Optional[dict[str, Any]] = None

class DeviceResponse(DeviceBase):
    id: int
    owner_id: int
    configuration: Optional[dict[str, Any]] = None
    last_seen: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
