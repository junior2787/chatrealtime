import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SocketState, Message, Room } from '../types';

const SocketContext = createContext<SocketState | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback((authToken: string) => {
    if (socketRef.current?.connected) return;

    const newSocket = io(process.env.VITE_SERVER_URL || 'http://localhost:3003', {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('🔌 Connection error:', err.message);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) connect(token);
    else disconnect();
    return () => disconnect();
  }, [isAuthenticated, token, connect, disconnect]);

  const joinRoom = (roomId: string) => socketRef.current?.emit('join-room', roomId);
  const leaveRoom = (roomId: string) => socketRef.current?.emit('leave-room', roomId);
  const sendMessage = (data: { roomId: string; content: string; type?: 'text' | 'image' | 'file'; replyToId?: string | null }) =>
    socketRef.current?.emit('send-message', data);
  const editMessage = (data: { roomId: string; messageId: string; content: string }) =>
    socketRef.current?.emit('edit-message', data);
  const deleteMessage = (data: { roomId: string; messageId: string }) =>
    socketRef.current?.emit('delete-message', data);
  const typingStart = (roomId: string) => socketRef.current?.emit('typing-start', roomId);
  const typingStop = (roomId: string) => socketRef.current?.emit('typing-stop', roomId);
  const readMessages = (roomId: string) => socketRef.current?.emit('read-messages', roomId);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        sendMessage,
        editMessage,
        deleteMessage,
        typingStart,
        typingStop,
        readMessages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};