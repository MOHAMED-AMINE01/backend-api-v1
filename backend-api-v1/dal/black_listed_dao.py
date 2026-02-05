from helpers.config import redis_client
from jose import jwt
from datetime import datetime, timezone

def is_blacklist_token(token: str):
    exists = redis_client.exists(token) > 0
    print(f"[REDIS] Checking token exists: {exists}")
    return exists

def add_token_to_blacklist(token: str):
    try:
        # Decode token to get 'exp' without validating (we just need the time)
        # We can use unverified_claims because we are just putting it in blacklist
        # The token itself was already validated in the check_token dependency
        payload = jwt.get_unverified_claims(token)
        exp = payload.get("exp")
        
        if exp:
            # Calculate remaining seconds for TTL
            current_time = int(datetime.now(timezone.utc).timestamp())
            ttl = int(exp) - current_time
            
            if ttl > 0:
                # Store in redis with the remaining TTL
                redis_client.setex(token, ttl, "true")
                print(f"[REDIS] Token blacklisted for {ttl} seconds")
                return True
            else:
                print(f"[REDIS] Token already expired, no need to blacklist (TTL: {ttl})")
                return True # Consider it processed
        print(f"[REDIS] Token has no exp claim")
        return False
    except Exception as e:
        print(f"[REDIS] Error blacklisting token: {e}")
        return False
