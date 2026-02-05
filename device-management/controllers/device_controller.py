from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from helpers.config import session_factory, logger
from helpers.auth_helper import get_current_user
from helpers.rabbitmq_helper import publish_device_event
from dto.device_dto import DeviceCreate, DeviceResponse, DeviceUpdate
from dal import device_dao
from entities.device import DeviceCategory, DeviceStatus
from typing import List, Any
from datetime import datetime

router = APIRouter(prefix="/devices", tags=["devices"])

@router.post("/add", response_model=DeviceResponse)
def create_new_device(
    device_in: DeviceCreate,
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    user_id = user["user_id"]
    try:
        new_device = device_dao.create_device(session, device_in, owner_id=user_id)
        
        # RabbitMQ Topic Specification:
        # For IoT: device/iot/temperature, device/iot/humidity, etc.
        # For End: device/end/system
        if device_in.category == DeviceCategory.IOT_DEVICE:
            routing_key = f"device/iot/{device_in.type.value}"
        else:
            routing_key = "device/end/system"
            
        publish_device_event(routing_key, {
            "action": "create",
            "device_id": new_device.id,
            "name": new_device.name,
            "type": new_device.type.value,
            "owner_id": user_id
        })
        
        return new_device
    except Exception as e:
        logger.error(f"Error creating device: {str(e)}")
        raise HTTPException(status_code=400, detail="Could not create device")

@router.get("/my-devices", response_model=List[DeviceResponse])
def list_my_devices(
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    return device_dao.get_user_devices(session, owner_id=user["user_id"])

@router.get("/admin/all", response_model=List[DeviceResponse])
def list_all_devices(
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    # Only Admin can see everything
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    return device_dao.get_all_devices(session)

@router.put("/{device_id}/status")
def update_status(
    device_id: int,
    status: DeviceStatus,
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    db_device = device_dao.get_device(session, device_id)
    if not db_device or (db_device.owner_id != user["user_id"] and not user["is_admin"]):
        raise HTTPException(status_code=404, detail="Device not found")
        
    updated_device = device_dao.update_status(session, device_id, status)
        
    # RabbitMQ: Notification de changement de statut
    publish_device_event(f"device/status/{device_id}", {
        "device_id": device_id,
        "new_status": status,
        "action": "status_update"
    })
    
    return {"message": "Status updated"}
@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    device = device_dao.get_device(session, device_id)
    if not device or (device.owner_id != user["user_id"] and not user["is_admin"]):
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_update: DeviceUpdate,
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    db_device = device_dao.get_device(session, device_id)
    if not db_device or (db_device.owner_id != user["user_id"] and not user["is_admin"]):
        raise HTTPException(status_code=404, detail="Device not found")
        
    updated = device_dao.update_device(session, db_device, device_update)
    
    # Notify RabbitMQ/MQTT of property changes
    publish_device_event(f"device/update/{device_id}", {
        "device_id": device_id,
        "action": "update",
        "changes": device_update.model_dump(exclude_unset=True)
    })
    
    return updated

@router.delete("/{device_id}")
def delete_device(
    device_id: int,
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    db_device = device_dao.get_device(session, device_id)
    if not db_device or (db_device.owner_id != user["user_id"] and not user["is_admin"]):
        raise HTTPException(status_code=404, detail="Device not found")
        
    device_dao.delete_device(session, device_id)
    
    # Notify deletion
    publish_device_event(f"device/delete/{device_id}", {
        "device_id": device_id,
        "action": "delete"
    })
    
    return {"message": "Device deleted successfully"}

@router.get("/filter/by-date", response_model=List[DeviceResponse])
def filter_devices_by_date(
    start: str,
    end: str,
    session: Session = Depends(session_factory),
    user: dict = Depends(get_current_user)
):
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
        return device_dao.get_devices_by_date(session, user["user_id"], start_dt, end_dt)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD)")
