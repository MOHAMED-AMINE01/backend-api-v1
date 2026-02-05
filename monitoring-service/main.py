import asyncio
import socketio
from fastapi import FastAPI
from contextlib import asynccontextmanager
from helpers.rabbit_consumer import consume_messages
from helpers.socket_helper import sio
from controllers.monitoring_controller import router as monitoring_router
from helpers.mongo_config import ensure_indexes, get_db
from helpers.weather_helper import weather_service
from dal.monitoring_dao import insert_weather

# Define Lifespan for background tasks
async def weather_updater():
    """Periodic task to update weather data every 30 minutes."""
    while True:
        print("[WEATHER] Updating data...")
        weather_data = await weather_service.fetch_weather()
        if weather_data:
            # Get DB instance (this is a bit manual in lifespan as no request context)
            db = await get_db()
            await insert_weather(db, weather_data)
            # Broadcast to UI
            await sio.emit("weather_update", weather_data)
        await asyncio.sleep(1800) # 30 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    print("[LOG] Starting Monitoring Service...")
    # Initialize MongoDB Indexes
    await ensure_indexes()
    # Launch RabbitMQ consumer
    consumer_task = asyncio.create_task(consume_messages())
    # Launch Weather updater
    weather_task = asyncio.create_task(weather_updater())
    yield
    # SHUTDOWN
    print("[LOG] Stopping Monitoring Service...")
    consumer_task.cancel()
    weather_task.cancel()

from prometheus_fastapi_instrumentator import Instrumentator

# Create FastAPI App
app = FastAPI(
    title="IoT Monitoring Service",
    description="Microservice for real-time monitoring and historical data storage (MongoDB)",
    version="1.0.0",
    lifespan=lifespan
)

# Start Instrumentator
instrumentator = Instrumentator().instrument(app)

@app.on_event("startup")
async def expose_metrics():
    instrumentator.expose(app, endpoint="/metrics")

# Integrate Socket.io with FastAPI using ASGI wrapping
# This is more robust than app.mount for some Ingress configurations
sio_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/monitoring/socket.io')

# Include Routers
app.include_router(monitoring_router)

@app.get("/")
async def root():
    return {
        "service": "monitoring-service",
        "status": "active",
        "realtime": "socket.io mounted"
    }

# Running with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:sio_app", host="0.0.0.0", port=8002, reload=True)
