import json
import paho.mqtt.client as mqtt
import os
import asyncio
from helpers.mongo_config import get_db
from helpers.socket_helper import sio
from dal.monitoring_dao import insert_metric
from entities.metrics import Metric

# MQTT Configuration
MQTT_HOST = os.getenv("MQTT_HOST", "rabbitmq_broker") # Note: we use the MQTT port
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

async def process_mqtt_message(topic, payload):
    """
    Asynchronous processing of the MQTT message.
    """
    db = await get_db()
    try:
        data = json.loads(payload.decode())
        
        # 1. Create Metric object
        metric_data = Metric(
            device_id=data.get("device_id"),
            owner_id=data.get("owner_id"),
            topic=topic,
            data=data
        )
        
        # 2. Save to MongoDB
        await insert_metric(db, metric_data)
        
        # 3. Emit via Socket.io
        await sio.emit('new_metric', metric_data.model_dump_json())
        print(f" [MQTT] Data saved and emitted for device {metric_data.device_id}")
        
    except Exception as e:
        print(f" [!] Error processing MQTT message: {e}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(" [MQTT] Monitoring Consumer successfully connected to Broker")
        client.subscribe("device/#")
    else:
        print(f" [MQTT] Connection failed with code {rc}")

def on_message(client, userdata, message):
    print(f" [MQTT] Received message on topic: {message.topic}")
    """
    Paho Synchronous Callback. 
    We bridge it to the async event loop.
    """
    loop = userdata['loop']
    # Schedule the async processing in the running event loop
    asyncio.run_coroutine_threadsafe(
        process_mqtt_message(message.topic, message.payload), 
        loop
    )

async def consume_messages():
    """
    Starts the Paho MQTT Client.
    """
    print(f" [*] Monitoring MQTT Consumer starting (Host: {MQTT_HOST})...")
    
    # Get current event loop reference
    loop = asyncio.get_running_loop()
    
    # Setup Paho Client
    client = mqtt.Client(userdata={'loop': loop})
    client.username_pw_set("guest", "guest")
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Simple retry logic
    connected = False
    while not connected:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, 60)
            connected = True
        except Exception as e:
            print(f" [!] MQTT Connection failed, retrying in 5s : {e}")
            await asyncio.sleep(5)
    
    # Start the non-blocking MQTT loop
    client.loop_start()
    
    # Keep the task alive
    while True:
        await asyncio.sleep(1)
