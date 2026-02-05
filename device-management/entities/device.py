import enum
from sqlalchemy import Column, String, Integer, DateTime, func, Boolean, JSON, Enum
from helpers.config import Base

class DeviceCategory(enum.Enum):
    END_DEVICE = "end_device"
    IOT_DEVICE = "iot_device"

class DeviceStatus(enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"

class IoTType(enum.Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    LIGHT = "light"
    PRESSURE = "pressure"
    SERVER = "server"
    WORKSTATION = "workstation"
    GATEWAY = "gateway"
    OTHER = "other"

class Device(Base):
    __tablename__ = 't_devices'
    
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    
    # Category: End Device vs IoT Device
    category = Column(Enum(DeviceCategory), nullable=False, default=DeviceCategory.IOT_DEVICE)
    
    # Type: Enumerated for IoT (temp, hum, light)
    type = Column(Enum(IoTType), nullable=False)
    
    # Status: Enumerated
    status = Column(Enum(DeviceStatus), nullable=False, default=DeviceStatus.ONLINE)
    
    # Configuration: Only for End Devices (nullable for IoT)
    configuration = Column(JSON, nullable=True) 
    
    last_seen = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Owner identifier (Using ID from Auth service)
    owner_id = Column(Integer, nullable=False, index=True) 
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), server_onupdate=func.now())
