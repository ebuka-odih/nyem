# Custom WebSocket Setup

We have replaced the Reverb/Pusher WebSocket implementation with a custom Node.js WebSocket server to resolve connection issues.

## Architecture

1.  **Node.js Server (`backend/custom-socket.js`)**:
    *   **Port 6002 (WS)**: WebSocket server for frontend clients.
    *   **Port 6001 (HTTP)**: Internal API for Laravel to trigger broadcasts.

2.  **Laravel Backend**:
    *   Sends HTTP POST requests to `http://127.0.0.1:6001/broadcast` when events occur (MessageSent, MatchCreated, ConversationCreated).

3.  **Frontend**:
    *   Connects directly to `ws://127.0.0.1:6002` (or appropriate IP).
    *   Authenticates by sending `{"type": "auth", "userId": "..."}`.

## How to Run

### 1. Start the WebSocket Server
You must keep this running in the background.

```bash
cd backend
node custom-socket.js
```

### 2. Start Laravel (Standard)
No special changes needed, just ensure your web server (Herd) is running.

### 3. Start Frontend
```bash
npx expo start -c
```

## Troubleshooting

*   **Connection Failed**: Ensure `custom-socket.js` is running.
*   **Mobile Device Connection**: If testing on a physical device, you must update `getWebSocketUrl` in `app/src/contexts/WebSocketContext.tsx` to use your computer's LAN IP instead of `127.0.0.1`.
*   **Firewall**: Ensure ports 6001 and 6002 are allowed through your firewall.
