

import { useState, useCallback, useEffect, useRef } from 'react';
import { ConnectionStatus } from '../services/types';
import { connect as wsConnect, disconnect as wsDisconnect, send as wsSend } from '../services/websocketService';

type MessageHandler = (data: any) => void;

export const useConnection = (onMessage: MessageHandler) => {
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const [error, setError] = useState<string | null>(null);
    const [connectionCode, setConnectionCode] = useState<string | null>(() => {
        return localStorage.getItem('lastConnectionCode');
    });

    const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<number | null>(() => {
        const saved = localStorage.getItem('lastSuccessfulConnection');
        return saved ? parseInt(saved) : null;
    });

    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const connectionTimeoutRef = useRef<number | null>(null);
    const clearConnectionTimeout = () => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
    };

    const saveSuccessfulConnection = (code: string) => {
        localStorage.setItem('lastConnectionCode', code);
        localStorage.setItem('lastSuccessfulConnection', Date.now().toString());
        setLastSuccessfulConnection(Date.now());

    };

    const connect = useCallback((code: string) => {
        if (statusRef.current === ConnectionStatus.CONNECTING || statusRef.current === ConnectionStatus.CONNECTED) {
            return;
        }

        setStatus(ConnectionStatus.CONNECTING);
        setError(null);
        clearConnectionTimeout();

        connectionTimeoutRef.current = window.setTimeout(() => {
            if (statusRef.current === ConnectionStatus.CONNECTING) {
                console.log("Connection attempt timed out.");
                wsDisconnect(); // Close the WebSocket connection attempt
                setStatus(ConnectionStatus.ERROR);
                setError("Connection timed out. Please check your code and ensure the PC client is running.");
            }
        }, 10000); // 10 seconds

        wsConnect(
            code,
            () => { // onOpen - socket is open, but we wait for partner
                console.log(`WebSocket open. Waiting for partner on code ${code}.`);
                setConnectionCode(code);
                wsSend({ type: 'get_history' });
            },
            (data) => { // onMessage
                if (data.type === 'partner_connected') {
                    console.log("✅ Partner PC client has connected!");
                    if (statusRef.current === ConnectionStatus.CONNECTING) {
                        clearConnectionTimeout();
                        setStatus(ConnectionStatus.CONNECTED);
                        setError(null);

                        saveSuccessfulConnection(code);
                    }
                } else if (data.type === 'partner_disconnected') {
                    console.log("Partner PC client has disconnected.");
                    // Don't change status here - just log it
                } else if (data.type === 'waiting_for_client') {
                    console.log("Waiting for PC client to connect...");
                    // This is a status update from the relay server
                } else if (data.type === 'screenshot_batch') {
                    console.log("📸 Screenshot batch received from enhanced connector");
                    // Let the main handler process this
                } else if (data.type === 'screenshot') {
                    console.log("📸 Individual screenshot received from PC client");
                    console.log("📸 Screenshot details:", {
                        index: data.index,
                        total: data.total,
                        processImmediate: data.processImmediate,
                        timestamp: data.timestamp,
                        dataUrlLength: data.dataUrl?.length || 0
                    });
                    // Let the main handler process this
                } else if (data.type === 'connection_test') {
                    console.log("✅ Connection test received from PC client");
                    // Let the main handler process this
                }
                
                // Always forward all messages to the main handler
                onMessageRef.current(data);
            },
            (err) => { // onError - This is usually called for unclean disconnects.
                clearConnectionTimeout();
                setStatus(ConnectionStatus.ERROR);
                setError(err);
            },
            () => { // onClose
                clearConnectionTimeout();
                // If an error has already been set (e.g., by timeout or onError), don't overwrite it.
                // Only set the generic error if we were connecting and no specific error was provided.
                if (statusRef.current === ConnectionStatus.CONNECTING) {
                    setStatus(ConnectionStatus.ERROR);
                    setError(prev => prev || "Connection failed. Please check the code and ensure the PC client is running.");
                } else if (statusRef.current !== ConnectionStatus.ERROR) {
                    setStatus(ConnectionStatus.DISCONNECTED);
                }
            }
        );
    }, []);

    const disconnect = useCallback(() => {
        clearConnectionTimeout();

        wsDisconnect();
        setStatus(ConnectionStatus.DISCONNECTED);
        setError(null);
        setConnectionCode(null);

        localStorage.removeItem('lastConnectionCode');
        localStorage.removeItem('lastSuccessfulConnection');
    }, []);

    const forceReconnect = useCallback(() => {
        const savedCode = localStorage.getItem('lastConnectionCode');
        if (savedCode) {
            disconnect();
            // Small delay to ensure cleanup is complete
            setTimeout(() => {
                connect(savedCode);
            }, 100);
        }
    }, [connect, disconnect]);

    // Auto-reconnect when app starts or comes into focus
    useEffect(() => {
        const savedCode = localStorage.getItem('lastConnectionCode');
        
        // Only auto-reconnect if we're not already connected and have a saved code
        if (savedCode && status === ConnectionStatus.DISCONNECTED) {
            console.log("🔗 Auto-connecting with saved code on app start:", savedCode);
            // Small delay to ensure app is fully initialized
            const autoConnectDelay = setTimeout(() => {
                // Double-check we're still disconnected before attempting connection
                if (status === ConnectionStatus.DISCONNECTED) {
                    connect(savedCode);
                }
            }, 1000);
            
            return () => clearTimeout(autoConnectDelay);
        }
    }, [connect, status]);

    // Auto-reconnect when app comes into focus
    useEffect(() => {
        const handleVisibilityChange = () => {
            // Only reconnect if we're not already connected and have a saved code
            if (!document.hidden && status === ConnectionStatus.DISCONNECTED) {
                const savedCode = localStorage.getItem('lastConnectionCode');
                if (savedCode) {
                    console.log("🔗 Auto-reconnecting on app focus:", savedCode);
                    // Double-check we're still disconnected before attempting connection
                    if (status === ConnectionStatus.DISCONNECTED) {
                        connect(savedCode);
                    }
                }
            }
        };

        const handleFocus = () => {
            // Only reconnect if we're not already connected and have a saved code
            if (status === ConnectionStatus.DISCONNECTED) {
                const savedCode = localStorage.getItem('lastConnectionCode');
                if (savedCode) {
                    console.log("🔗 Auto-reconnecting on window focus:", savedCode);
                    // Double-check we're still disconnected before attempting connection
                    if (status === ConnectionStatus.DISCONNECTED) {
                        connect(savedCode);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [connect, status]);

    const send = useCallback((data: object) => {
        wsSend(data);
    }, []);

    return { 
        status, 
        error, 
        connect, 
        disconnect, 
        connectionCode, 
        send,
        lastSuccessfulConnection,
        forceReconnect
    };
};