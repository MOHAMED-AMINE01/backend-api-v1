import asyncio
import json
import random
import time
import paho.mqtt.client as mqtt
import psutil
from helpers.config import MQTT_HOST, MQTT_PORT, LocalSession, logger
from entities.device import Device, DeviceStatus, DeviceCategory, IoTType

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("MQTT Sender successfully connected to Broker")
    else:
        logger.error(f"MQTT Connection failed with code {rc}")

async def start_mqtt_metrics_sender():
    """
    Background task that sends metrics for all ONLINE devices every 2 seconds.
    """
    client = mqtt.Client()
    client.username_pw_set("guest", "guest")
    client.on_connect = on_connect
    
    # Simple retry logic for MQTT connection
    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, 60)
            client.loop_start()
            break
        except Exception as e:
            logger.error(f"MQTT Connection failed, retrying in 5s: {e}")
            await asyncio.sleep(5)

    while True:
        try:
            # Create a new session for each loop iteration
            with LocalSession() as session:
                # Query all ONLINE devices
                active_devices = session.query(Device).filter(Device.status == DeviceStatus.ONLINE).all()
                if len(active_devices) > 0:
                    logger.info(f"Found {len(active_devices)} online devices. Sending metrics...")
                
                for device in active_devices:
                    # Define topic and generate realistic values based on type
                    if device.category == DeviceCategory.IOT_DEVICE:
                        topic = f"device/iot/{device.type.value}"
                        if device.type == IoTType.TEMPERATURE:
                            value = round(random.uniform(15.0, 35.0), 2)
                            unit = "°C"
                        elif device.type == IoTType.HUMIDITY:
                            value = round(random.uniform(30.0, 80.0), 2)
                            unit = "%"
                        elif device.type == IoTType.LIGHT:
                            value = round(random.uniform(0.0, 1000.0), 2)
                            unit = "lux"
                        elif device.type == IoTType.PRESSURE:
                            value = round(random.uniform(980.0, 1050.0), 2)
                            unit = "hPa"
                        else:
                            value = random.randint(0, 1)
                            unit = "binary"
                            
                        payload = {
                            "device_id": device.id,
                            "name": device.name,
                            "value": value,
                            "unit": unit,
                            "timestamp": time.time(),
                            "owner_id": device.owner_id
                        }
                    else:
                        # End Device: Sending REAL CPU, RAM and Storage using psutil
                        topic = f"device/end/{device.type.value}"
                        
                        # Get real system metrics
                        cpu_usage = psutil.cpu_percent(interval=0.1)
                        ram_usage = psutil.virtual_memory().percent
                        storage_usage = psutil.disk_usage('/').percent

                        payload = {
                            "device_id": device.id,
                            "name": device.name,
                            "metrics": {
                                "cpu": cpu_usage,
                                "ram": ram_usage,
                                "storage": storage_usage
                            },
                            "unit": "%",
                            "timestamp": time.time(),
                            "owner_id": device.owner_id
                        }

                    # Publish metrics
                    client.publish(topic, json.dumps(payload))
                    # logger.info(f"Published metrics for device {device.id} to {topic}")

        except Exception as e:
            logger.error(f"Error in MQTT metrics sender loop: {e}")
        
        # Wait 2 seconds before next round
        await asyncio.sleep(2)
