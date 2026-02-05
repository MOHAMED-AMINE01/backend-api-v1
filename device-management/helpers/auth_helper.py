import requests
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from helpers.config import AUTH_SERVICE_URL, logger

http_bearer = HTTPBearer()

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
            is_admin = payload.get("role", False) # "role" contains is_admin in Auth service
            
            if user_id is None:
                user_id = payload.get("sub") # fallback
                
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token response")
                
            return {"user_id": user_id, "is_admin": is_admin}
        else:
            raise HTTPException(status_code=401, detail="Unauthorized")
            
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=503, detail="Auth Service Error")
