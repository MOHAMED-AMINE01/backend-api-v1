import json
import paho.mqtt.client as mqtt
from helpers.config import MQTT_HOST, MQTT_PORT, logger

def publish_device_event(topic: str, payload: dict):
    """
    Publish a device event (creation, status update, etc.) using MQTT (Paho)
    instead of AMQP (Pika).
    """
    try:
        # Create a temporary client for publishing or use a singleton
        client = mqtt.Client()
        client.connect(MQTT_HOST, MQTT_PORT, 60)
        
        # Publish the message
        result = client.publish(topic, json.dumps(payload))
        
        # Wait for completion (optional but safer for events)
        result.wait_for_publish()
        
        client.disconnect()
        # logger.info(f"Event published to topic {topic} via MQTT")
        
    except Exception as e:
        logger.error(f"Failed to publish MQTT event: {e}")
