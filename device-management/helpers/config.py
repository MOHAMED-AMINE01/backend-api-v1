from typing import Final
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import logging
import pika

# Environment variables
USER_DB: Final[str] = os.getenv('USER_DB', 'admin')
PASSWORD_DB: Final[str] = os.getenv('PASSWORD_DB', '1234')
NAME_DB: Final[str] = os.getenv('NAME_DB', 'db_devices')
SERVER_DB: Final[str] = os.getenv('SERVER_DB', 'localhost')
AUTH_SERVICE_URL: Final[str] = os.getenv('AUTH_SERVICE_URL', 'http://auth-ms:8000')
URL_DB: Final[str] = f'postgresql+psycopg2://{USER_DB}:{PASSWORD_DB}@{SERVER_DB}:5432/{NAME_DB}'

# MQTT configuration
MQTT_HOST: Final[str] = os.getenv('MQTT_HOST', 'localhost')
MQTT_PORT: Final[int] = int(os.getenv('MQTT_PORT', 1883))

# RabbitMQ configuration
RABBIT_HOST: Final[str] = os.getenv('RABBIT_HOST', 'localhost')

# MQTT configuration
MQTT_HOST: Final[str] = os.getenv('MQTT_HOST', 'localhost')
MQTT_PORT: Final[int] = int(os.getenv('MQTT_PORT', 1883))

# SQLAlchemy
engine = create_engine(URL_DB, pool_size=10)
LocalSession = sessionmaker(bind=engine)
Base = declarative_base()

def session_factory():
    session = LocalSession()
    try:
        yield session
    finally:
        session.close()

# Logs
if not os.path.exists('./logs'):
    os.makedirs('./logs')

formater = logging.Formatter(fmt='%(asctime)s-%(levelname)s-%(message)s')
handler = logging.FileHandler('./logs/device.log')
handler.setFormatter(formater)

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(formater)

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.addHandler(stream_handler)
