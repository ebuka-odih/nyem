import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/api/useProfile';

interface WebSocketContextType {
    isConnected: boolean;
    subscribe: (channel: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: profile } = useProfile();
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

    const connect = useCallback(() => {
        if (!profile?.id || socketRef.current?.readyState === WebSocket.OPEN) return;

        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168');

        // If local, use the local port. 
        // If production, try to connect to the same host but on the socket port or a proxied path.
        const wsUrl = isLocal
            ? `ws://${hostname}:6002`
            : `wss://${hostname}/app/ws`;

        console.log('[WebSocket] Connecting to:', wsUrl);

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('[WebSocket] Connected');
            setIsConnected(true);

            // Authenticate
            socket.send(JSON.stringify({
                type: 'auth',
                userId: profile.id
            }));
        };

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                console.log('[WebSocket] Raw Payload Received:', payload);

                const { type, data } = payload;

                if (type === 'message.sent') {
                    const conversationId = data.conversation_id;
                    const channel = `conversation.${conversationId}`;

                    console.log(`[WebSocket] Looking for subscribers on channel: ${channel}`);

                    const callbacks = subscribersRef.current.get(channel);
                    if (callbacks) {
                        callbacks.forEach(callback => callback(data.message));
                    }

                    // Also notify user channel
                    const userChannel = `user.${profile.id}`;
                    const userCallbacks = subscribersRef.current.get(userChannel);
                    if (userCallbacks) {
                        userCallbacks.forEach(callback => callback(payload));
                    }
                } else if (type === 'escrow.toggle') {
                    const channel = 'escrow.toggle';
                    console.log(`[WebSocket] Escrow toggle received, notifying subscribers on channel: ${channel}`);
                    const callbacks = subscribersRef.current.get(channel);
                    if (callbacks) {
                        callbacks.forEach(callback => callback(data));
                    }
                } else if (type === 'auth_success') {
                    console.log('[WebSocket] Successfully authenticated with server');
                }

            } catch (error) {
                console.error('[WebSocket] Error processing message:', error);
            }
        };

        socket.onclose = () => {
            console.log('[WebSocket] Disconnected');
            setIsConnected(false);
            socketRef.current = null;

            // Reconnect after 3 seconds
            setTimeout(connect, 3000);
        };

        socket.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
            socket.close();
        };

        socketRef.current = socket;
    }, [profile?.id]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect]);

    const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
        if (!subscribersRef.current.has(channel)) {
            subscribersRef.current.set(channel, new Set());
        }
        subscribersRef.current.get(channel)?.add(callback);

        return () => {
            const subscribers = subscribersRef.current.get(channel);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    subscribersRef.current.delete(channel);
                }
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ isConnected, subscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
