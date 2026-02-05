import uvicorn

from fastapi import FastAPI
from controllers.auth_controller import router
from helpers.config import Base,engine
from prometheus_fastapi_instrumentator import Instrumentator

app=FastAPI(
title="Authentication app",
description="Micro service signing app "
)

Instrumentator().instrument(app).expose(app)

#create one time
Base.metadata.create_all(bind=engine)
app.include_router(router)


if __name__ == '__main__':
    uvicorn.run("main:app",host="0.0.0.0",reload=True)