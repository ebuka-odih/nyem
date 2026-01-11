import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const HTTP_PORT = 6001;
const WS_PORT = 6002;

// HTTP Server for broadcasting from Laravel
app.listen(HTTP_PORT, () => {
    console.log(`HTTP Broadcast server running on port ${HTTP_PORT}`);
});

// WebSocket Server for clients
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server running on port ${WS_PORT}`);

// Store clients: userId -> Set<WebSocket> (allow multiple connections per user)
const clients = new Map();

wss.on('connection', (ws, req) => {
    console.log('New client connected');

    let userId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Auth / Identification
            // In a production app, you should verify the token here!
            if (data.type === 'auth') {
                userId = String(data.userId);

                if (!clients.has(userId)) {
                    clients.set(userId, new Set());
                }
                clients.get(userId).add(ws);

                console.log(`User ${userId} authenticated`);
                ws.send(JSON.stringify({ type: 'auth_success' }));
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    ws.on('close', () => {
        if (userId && clients.has(userId)) {
            const userSockets = clients.get(userId);
            userSockets.delete(ws);
            if (userSockets.size === 0) {
                clients.delete(userId);
                console.log(`User ${userId} disconnected (all sessions)`);
            } else {
                console.log(`User ${userId} disconnected (one session)`);
            }
        }
    });

    // Ping/Pong to keep connection alive
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
});

// Heartbeat
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

// Broadcast endpoint called by Laravel
app.post('/broadcast', (req, res) => {
    const { type, data, receivers } = req.body;

    console.log(`[Broadcast] Type: ${type}, Receivers:`, receivers);
    console.log(`[Broadcast] Data:`, JSON.stringify(data, null, 2));

    let sentCount = 0;
    if (Array.isArray(receivers)) {
        receivers.forEach(receiverId => {
            const id = String(receiverId);
            if (clients.has(id)) {
                clients.get(id).forEach(client => {
                    if (client.readyState === 1) { // OPEN
                        client.send(JSON.stringify({ type, data }));
                        sentCount++;
                    }
                });
            } else {
                console.log(`[Broadcast] Receiver ${id} not connected`);
            }
        });
    }

    console.log(`[Broadcast] Sent to ${sentCount} clients`);
    res.json({ success: true, sentCount });
});
