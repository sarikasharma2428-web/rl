import { useState, useEffect, useCallback, useRef } from 'react';
import type { CurrentPipeline, LogEntry, DeploymentInfo } from './useMetrics';

// WebSocket URL - configurable
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export interface WebSocketMessage {
  type: string;
  timestamp: string;
  data: {
    pipeline?: CurrentPipeline;
    kubernetes?: DeploymentInfo;
    logs?: LogEntry[];
    log?: LogEntry;
    build?: any;
    stage?: string;
    status?: string;
    message?: string;
    image_tag?: string;
    event_type?: string;
  };
}

export interface WebSocketState {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  currentPipeline: CurrentPipeline | null;
  kubernetes: DeploymentInfo | null;
  recentLogs: LogEntry[];
  connectionError: string | null;
}

export function useAutoDeployWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    currentPipeline: null,
    kubernetes: null,
    recentLogs: [],
    connectionError: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      console.log('[WS] Connecting to', WS_URL);
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected');
        reconnectAttempts.current = 0;
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionError: null,
        }));

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WS] Received:', message.type);

          setState(prev => {
            const newState = { ...prev, lastMessage: message };

            switch (message.type) {
              case 'connected':
                // Initial state from server
                if (message.data.pipeline) {
                  newState.currentPipeline = message.data.pipeline;
                }
                if (message.data.kubernetes) {
                  newState.kubernetes = message.data.kubernetes;
                }
                break;

              case 'state_update':
                if (message.data.pipeline) {
                  newState.currentPipeline = message.data.pipeline;
                }
                if (message.data.kubernetes) {
                  newState.kubernetes = message.data.kubernetes;
                }
                if (message.data.logs) {
                  newState.recentLogs = message.data.logs;
                }
                break;

              case 'pipeline_status':
              case 'pipeline_triggered':
                if (message.data.pipeline) {
                  newState.currentPipeline = message.data.pipeline;
                }
                if (message.data.log) {
                  newState.recentLogs = [message.data.log, ...prev.recentLogs].slice(0, 50);
                }
                break;

              case 'stage_update':
                if (message.data.pipeline) {
                  newState.currentPipeline = message.data.pipeline;
                }
                if (message.data.log) {
                  newState.recentLogs = [message.data.log, ...prev.recentLogs].slice(0, 50);
                }
                break;

              case 'deployment_event':
              case 'manual_deployment':
              case 'deployment_complete':
                if (message.data.kubernetes) {
                  newState.kubernetes = message.data.kubernetes;
                }
                if (message.data.log) {
                  newState.recentLogs = [message.data.log, ...prev.recentLogs].slice(0, 50);
                }
                break;

              case 'pods_update':
              case 'rollback':
                if (message.data.kubernetes) {
                  newState.kubernetes = message.data.kubernetes;
                }
                break;

              case 'pong':
                // Heartbeat response - ignore
                break;

              default:
                console.log('[WS] Unknown message type:', message.type);
            }

            return newState;
          });
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        setState(prev => ({
          ...prev,
          connectionError: 'WebSocket connection error',
        }));
      };

      ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        setState(prev => ({
          ...prev,
          isConnected: false,
        }));

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setState(prev => ({
            ...prev,
            connectionError: 'Max reconnection attempts reached',
          }));
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setState(prev => ({
        ...prev,
        connectionError: 'Failed to create WebSocket connection',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const requestRefresh = useCallback(() => {
    sendMessage({ type: 'refresh' });
  }, [sendMessage]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    requestRefresh,
  };
}

// Hook for triggering manual deployment via WebSocket
export function useManualDeploy() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const deployImage = useCallback(async (imageTag: string, namespace: string = 'default') => {
    setIsDeploying(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/deployments/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_tag: imageTag, namespace }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger manual deployment');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deployment failed';
      setError(message);
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, [API_BASE_URL]);

  return { deployImage, isDeploying, error };
}
