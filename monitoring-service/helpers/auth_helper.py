import requests
import os
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)
http_bearer = HTTPBearer()

# Auth service URL from environment
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://host.docker.internal:8000")

def get_current_user(token: HTTPAuthorizationCredentials = Security(http_bearer)) -> dict:
    credentials = token.credentials
    
    try:
        response = requests.post(
            f"{AUTH_SERVICE_URL}/users/verify-token", 
            json={"token": credentials},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            payload = data.get("payload", {})
            
            user_id = payload.get("user_id")
            is_admin = payload.get("role", False)
            
            if user_id is None:
                user_id = payload.get("sub")
                
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token response")
                
            return {"user_id": user_id, "is_admin": is_admin}
        else:
            raise HTTPException(status_code=401, detail="Unauthorized")
            
    except Exception as e:
        logger.error(f"Auth error in Monitoring: {str(e)}")
        raise HTTPException(status_code=503, detail="Auth Service Error")
