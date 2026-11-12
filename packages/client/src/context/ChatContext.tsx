import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { roomsApi, messagesApi } from '../lib/api';
import { Room, Message, ChatState } from '../types';

const ChatContext = createContext<ChatState | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { socket, joinRoom, leaveRoom, readMessages } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;
    socket.on('new-message', (msg: Message) => {
      setMessages(prev => ({ ...prev, [msg.roomId]: [...(prev[msg.roomId] || []), msg] }));
      setRooms(prev => prev.map(r => r.id === msg.roomId ? { ...r, lastMessage: msg, unreadCount: (r.unreadCount || 0) + 1 } : r));
    });
    socket.on('message-edited', ({ roomId, message }) => {
      setMessages(prev => ({ ...prev, [roomId]: prev[roomId]?.map(m => m.id === message.id ? message : m) || [] }));
    });
    socket.on('message-deleted', ({ roomId, messageId }) => {
      setMessages(prev => ({ ...prev, [roomId]: prev[roomId]?.filter(m => m.id !== messageId) || [] }));
    });
    socket.on('user-joined', ({ roomId, userId, userName }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, memberCount: r.memberCount + 1 } : r));
    });
    socket.on('user-left', ({ roomId, userId, userName }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, memberCount: r.memberCount - 1 } : r));
    });
    socket.on('user-typing', ({ roomId, userId, userName }) => {
      setTypingUsers(prev => ({ ...prev, [roomId]: [...new Set([...(prev[roomId] || []), `${userId}:${userName}`])] }));
    });
    socket.on('user-stopped-typing', ({ roomId, userId }) => {
      setTypingUsers(prev => ({ ...prev, [roomId]: (prev[roomId] || []).filter(u => !u.startsWith(`${userId}:`)) }));
    });
    socket.on('user-status', ({ userId, status }) => {
      setOnlineUsers(prev => status === 'online' ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId));
    });
    socket.on('messages-read', ({ roomId, userId }) => {
      // Handle read receipts if needed
    });
    return () => {
      socket.off('new-message');
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('user-status');
      socket.off('messages-read');
    };
  }, [socket]);

  const fetchRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await roomsApi.list();
      setRooms(data.rooms);
    } catch (err) { console.error('Erro ao buscar salas:', err); }
  }, [isAuthenticated]);

  const fetchMessages = useCallback(async (roomId: string, page = 1) => {
    try {
      const { data } = await messagesApi.list(roomId, { page });
      const formatted = data.messages.map((m: Message) => ({
        ...m,
        isOwn: false, // será atualizado no componente
      }));
      setMessages(prev => ({ ...prev, [roomId]: page === 1 ? formatted : [...formatted, ...(prev[roomId] || [])] }));
    } catch (err) { console.error('Erro ao buscar mensagens:', err); }
  }, []);

  const createRoom = useCallback(async (roomData: { name: string; description?: string; isPrivate?: boolean }) => {
    const { data } = await roomsApi.create(roomData);
    setRooms(prev => [...prev, data.room]);
    return data.room;
  }, []);

  const setCurrentRoomWithJoin = useCallback((room: Room | null) => {
    if (currentRoom) leaveRoom(currentRoom.id);
    if (room) {
      joinRoom(room.id);
      readMessages(room.id);
      fetchMessages(room.id);
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r));
    }
    setCurrentRoom(room);
  }, [currentRoom, joinRoom, leaveRoom, readMessages, fetchMessages]);

  const addMessage = useCallback((roomId: string, message: Message) => {
    setMessages(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), message] }));
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, lastMessage: message } : r));
  }, []);

  const updateMessage = useCallback((roomId: string, message: Message) => {
    setMessages(prev => ({ ...prev, [roomId]: prev[roomId]?.map(m => m.id === message.id ? message : m) || [] }));
  }, []);

  const removeMessage = useCallback((roomId: string, messageId: string) => {
    setMessages(prev => ({ ...prev, [roomId]: prev[roomId]?.filter(m => m.id !== messageId) || [] }));
  }, []);

  const setTyping = useCallback((roomId: string, userId: string, userName: string, isTyping: boolean) => {
    setTypingUsers(prev => {
      const current = prev[roomId] || [];
      if (isTyping) return { ...prev, [roomId]: [...new Set([...current, `${userId}:${userName}`])] };
      return { ...prev, [roomId]: current.filter(u => !u.startsWith(`${userId}:`)) };
    });
  }, []);

  const setUserStatus = useCallback((userId: string, status: 'online' | 'offline') => {
    setOnlineUsers(prev => status === 'online' ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId));
  }, []);

  useEffect(() => { if (isAuthenticated) fetchRooms(); }, [isAuthenticated, fetchRooms]);

  return (
    <ChatContext.Provider
      value={{
        rooms, currentRoom, messages, typingUsers, onlineUsers, isLoading,
        fetchRooms, fetchMessages, createRoom, setCurrentRoom: setCurrentRoomWithJoin,
        addMessage, updateMessage, removeMessage, setTyping, setUserStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};