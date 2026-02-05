import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from controllers.device_controller import router
from helpers.config import Base, engine, logger
from helpers.mqtt_sender import start_mqtt_metrics_sender

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting background MQTT metrics sender...")
    asyncio.create_task(start_mqtt_metrics_sender())
    yield
    # Shutdown logic (optional)
    logger.info("Shutting down...")

from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(
    title="Device Management Service",
    description="Microservice for managing IOT and End Devices",
    lifespan=lifespan
)

Instrumentator().instrument(app).expose(app)

# Create tables on startup
Base.metadata.create_all(bind=engine)

app.include_router(router)

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
