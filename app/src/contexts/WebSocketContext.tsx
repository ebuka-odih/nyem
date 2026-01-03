import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface WebSocketContextType {
    isConnected: boolean;
    subscribeToConversation: (conversationId: string, onMessage: (message: any) => void) => () => void;
    subscribeToUserChannel: (userId: string, onMessage: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Helper to get the correct WebSocket URL
const getWebSocketUrl = () => {
    // You might need to change this IP if testing on a physical device
    // For Android Emulator: 10.0.2.2
    // For iOS Simulator: 127.0.0.1
    // For Physical Device: Your Machine's LAN IP (e.g., 192.168.1.x)

    let host = '127.0.0.1';

    // Attempt to use the host from Expo config if available (often the LAN IP)
    if (Constants.expoConfig?.hostUri) {
        host = Constants.expoConfig.hostUri.split(':')[0];
    }

    // Override for Android Emulator if strictly localhost
    if (Platform.OS === 'android' && host === '127.0.0.1') {
        host = '10.0.2.2';
    }

    // Hardcode for now if running locally with Herd on Mac
    // If you are on iOS Simulator, 127.0.0.1 is fine.
    // If you are on Android Emulator, 10.0.2.2 is needed.
    // If you are on a physical device, you MUST replace this with your machine's IP.
    // host = '192.168.1.155'; // Example

    return `ws://${host}:6002`;
};

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { token, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Subscribers: Map<id, Set<Callback>>
    // We use a simple event bus pattern
    const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

    useEffect(() => {
        if (!user) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        const connect = () => {
            const url = getWebSocketUrl();
            console.log('[WebSocket] Connecting to:', url);

            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WebSocket] Connected');
                setIsConnected(true);

                // Authenticate immediately
                ws.send(JSON.stringify({
                    type: 'auth',
                    userId: user.id
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    console.log('[WebSocket] Received:', payload);

                    if (payload.type === 'message.sent') {
                        const { data } = payload;

                        // Notify conversation subscribers
                        if (data.conversation_id) {
                            const convChannel = `conversation.${data.conversation_id}`;
                            const convSubs = subscribersRef.current.get(convChannel);
                            if (convSubs) {
                                convSubs.forEach(callback => callback(data.message));
                            }
                        }

                        // Notify user subscribers (if we want to listen to all user events)
                        // The backend sends to 'receivers', so if we are here, we are a receiver.
                        const userChannel = `user.${user.id}`;
                        const userSubs = subscribersRef.current.get(userChannel);
                        if (userSubs) {
                            userSubs.forEach(callback => callback(payload));
                        }
                    }
                } catch (e) {
                    console.error('[WebSocket] Error parsing message:', e);
                }
            };

            ws.onerror = (e) => {
                console.error('[WebSocket] Error:', e);
            };

            ws.onclose = () => {
                console.log('[WebSocket] Disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Reconnect logic could go here (e.g., setTimeout(connect, 3000))
            };
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [user]);

    const subscribeToConversation = useCallback((conversationId: string, onMessage: (message: any) => void) => {
        const channel = `conversation.${conversationId}`;

        if (!subscribersRef.current.has(channel)) {
            subscribersRef.current.set(channel, new Set());
        }

        const subs = subscribersRef.current.get(channel)!;
        subs.add(onMessage);

        console.log(`[WebSocket] Subscribed to ${channel}`);

        return () => {
            console.log(`[WebSocket] Unsubscribed from ${channel}`);
            const currentSubs = subscribersRef.current.get(channel);
            if (currentSubs) {
                currentSubs.delete(onMessage);
                if (currentSubs.size === 0) {
                    subscribersRef.current.delete(channel);
                }
            }
        };
    }, []);

    const subscribeToUserChannel = useCallback((userId: string, onMessage: (data: any) => void) => {
        const channel = `user.${userId}`;

        if (!subscribersRef.current.has(channel)) {
            subscribersRef.current.set(channel, new Set());
        }

        const subs = subscribersRef.current.get(channel)!;
        subs.add(onMessage);

        console.log(`[WebSocket] Subscribed to ${channel}`);

        return () => {
            console.log(`[WebSocket] Unsubscribed from ${channel}`);
            const currentSubs = subscribersRef.current.get(channel);
            if (currentSubs) {
                currentSubs.delete(onMessage);
                if (currentSubs.size === 0) {
                    subscribersRef.current.delete(channel);
                }
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider
            value={{
                isConnected,
                subscribeToConversation,
                subscribeToUserChannel,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
