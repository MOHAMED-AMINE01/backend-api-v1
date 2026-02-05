import socketio

# Create an Async Server for Socket.io
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=[
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://127.0.0.1:5500'
])

# Simple event for debugging
@sio.event
async def connect(sid, environ):
    print(f"[SOCKET.IO] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[SOCKET.IO] Client disconnected: {sid}")
