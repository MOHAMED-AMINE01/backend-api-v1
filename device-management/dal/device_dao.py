from sqlalchemy.orm import Session
from entities.device import Device, DeviceStatus
from dto.device_dto import DeviceCreate, DeviceUpdate
from typing import List, Optional
from datetime import datetime

def create_device(session: Session, device_in: DeviceCreate, owner_id: int) -> Device:
    db_device = Device(
        name=device_in.name,
        category=device_in.category,
        type=device_in.type,
        status=device_in.status,
        configuration=device_in.configuration,
        owner_id=owner_id
    )
    session.add(db_device)
    try:
        session.commit()
        session.refresh(db_device)
        return db_device
    except Exception as e:
        session.rollback()
        raise e

def get_device(session: Session, device_id: int) -> Optional[Device]:
    return session.query(Device).filter(Device.id == device_id).first()

def get_user_devices(session: Session, owner_id: int) -> List[Device]:
    return session.query(Device).filter(Device.owner_id == owner_id).all()

def update_device(session: Session, db_device: Device, device_update: DeviceUpdate) -> Device:
    update_data = device_update.model_dump(exclude_unset=True)
    
    for field in update_data:
        setattr(db_device, field, update_data[field])
    
    try:
        session.commit()
        session.refresh(db_device)
        return db_device
    except Exception as e:
        session.rollback()
        raise e

def delete_device(session: Session, device_id: int) -> bool:
    db_device = get_device(session, device_id)
    if db_device:
        session.delete(db_device)
        session.commit()
        return True
    return False

def update_status(session: Session, device_id: int, status: DeviceStatus) -> Optional[Device]:
    db_device = get_device(session, device_id)
    if db_device:
        db_device.status = status
        session.commit()
        session.refresh(db_device)
        return db_device
    return None

def get_devices_by_date(session: Session, owner_id: int, start_date: datetime, end_date: datetime) -> List[Device]:
    return session.query(Device).filter(
        Device.owner_id == owner_id,
        Device.created_at >= start_date,
        Device.created_at <= end_date
    ).all()

def get_all_devices(session: Session) -> List[Device]:
    return session.query(Device).all()
