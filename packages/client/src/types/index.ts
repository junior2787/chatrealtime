export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  ownerId: string;
  memberCount: number;
  members?: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  replyToId?: string | null;
  replyTo?: Message;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isOwn: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export interface SocketState {
  socket: import('socket.io-client').Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (data: { roomId: string; content: string; type?: 'text' | 'image' | 'file'; replyToId?: string | null }) => void;
  editMessage: (data: { roomId: string; messageId: string; content: string }) => void;
  deleteMessage: (data: { roomId: string; messageId: string }) => void;
  typingStart: (roomId: string) => void;
  typingStop: (roomId: string) => void;
  readMessages: (roomId: string) => void;
}

export interface ChatState {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  onlineUsers: string[];
  isLoading: boolean;
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string, page?: number) => Promise<void>;
  createRoom: (data: { name: string; description?: string; isPrivate?: boolean }) => Promise<Room>;
  setCurrentRoom: (room: Room | null) => void;
  addMessage: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, message: Message) => void;
  removeMessage: (roomId: string, messageId: string) => void;
  setTyping: (roomId: string, userId: string, userName: string, isTyping: boolean) => void;
  setUserStatus: (userId: string, status: 'online' | 'offline') => void;
}