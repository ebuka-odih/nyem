import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useProfile } from '../hooks/api/useProfile';
import { getStoredToken } from '../utils/api';

// Make Pusher available for Echo
(window as any).Pusher = Pusher;

interface WebSocketContextType {
    isConnected: boolean;
    subscribe: (channel: string, callback: (data: any) => void) => () => void;
    echo?: Echo<any>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: profile } = useProfile();
    const [isConnected, setIsConnected] = useState(false);
    const echoRef = useRef<Echo<any> | null>(null);

    const connect = useCallback(() => {
        if (!profile?.id || echoRef.current) return;

        const token = getStoredToken();
        if (!token) {
            console.warn('[WebSocket] No auth token available, skipping Echo connection');
            return;
        }

        const appKey = import.meta.env.VITE_REVERB_APP_KEY || 'XXtWgUw0t6Lf0kBvOmu0';
        const host = import.meta.env.VITE_REVERB_HOST || 'nyem.gnosisbrand.com';
        const port = import.meta.env.VITE_REVERB_PORT || 443;
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'https';
        const apiBase = import.meta.env.VITE_API_BASE || 'https://api.nyem.online/backend/public/api';

        console.log('[WebSocket] Connecting via Echo to:', host);

        try {
            const echo = new Echo({
                broadcaster: 'reverb',
                key: appKey,
                wsHost: host,
                wsPort: port,
                wssPort: port,
                forceTLS: scheme === 'https',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: `${apiBase}/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                },
            });

            echo.connector.pusher.connection.bind('connected', () => {
                console.log('[WebSocket] Echo Connected');
                setIsConnected(true);
            });

            echo.connector.pusher.connection.bind('disconnected', () => {
                console.log('[WebSocket] Echo Disconnected');
                setIsConnected(false);
            });

            echo.connector.pusher.connection.bind('error', (err: any) => {
                console.error('[WebSocket] Echo Error:', err);
            });

            echoRef.current = echo;
        } catch (error) {
            console.error('[WebSocket] Failed to initialize Echo:', error);
        }
    }, [profile?.id]);

    useEffect(() => {
        connect();
        return () => {
            if (echoRef.current) {
                console.log('[WebSocket] Disconnecting Echo');
                echoRef.current.disconnect();
                echoRef.current = null;
            }
        };
    }, [connect]);

    const subscribe = useCallback((channelName: string, callback: (data: any) => void) => {
        if (!echoRef.current) {
            console.warn('[WebSocket] Echo not initialized, cannot subscribe to:', channelName);
            return () => { };
        }

        console.log(`[WebSocket] Subscribing to: ${channelName}`);

        let channel: any;
        if (channelName.startsWith('user.') || channelName.startsWith('conversation.')) {
            channel = echoRef.current.private(channelName);
        } else {
            channel = echoRef.current.channel(channelName);
        }

        // Handle common event for both individual and conversation channels
        channel.listen('.message.sent', (data: any) => {
            console.log(`[WebSocket][${channelName}] Received message:`, data);
            callback(data.message || data);
        });

        // Handle escrow toggle specifically
        if (channelName === 'escrow.toggle' || channelName.startsWith('conversation.')) {
            channel.listen('.escrow.toggle', (data: any) => {
                console.log(`[WebSocket][${channelName}] Received escrow toggle:`, data);
                callback(data);
            });
        }

        return () => {
            console.log(`[WebSocket] Unsubscribing from: ${channelName}`);
            if (echoRef.current) {
                echoRef.current.leave(channelName);
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ isConnected, subscribe, echo: echoRef.current || undefined }}>
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
