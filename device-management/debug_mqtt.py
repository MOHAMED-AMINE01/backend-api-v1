import paho.mqtt.client as mqtt
import time

def on_message(c, u, m):
    print(f"DEBUG_WS: {m.topic} {m.payload.decode()}")

client = mqtt.Client()
client.username_pw_set("guest", "guest")
client.on_message = on_message

try:
    client.connect("rabbitmq", 1883)
    client.subscribe("device/#")
    print("DEBUG_WS: Subscribed to device/#")
    
    # Run for 10 seconds
    client.loop_start()
    time.sleep(10)
    client.loop_stop()
except Exception as e:
    print(f"DEBUG_WS_ERROR: {e}")
