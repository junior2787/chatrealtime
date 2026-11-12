import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Send, Paperclip, MoreVertical, Smile, Check, CheckCheck, Edit2, Trash2, Reply } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rooms, currentRoom, messages, typingUsers, onlineUsers, setCurrentRoom, fetchMessages, addMessage, updateMessage, removeMessage, setTyping, setUserStatus } = useChat();
  const { socket, joinRoom, leaveRoom, sendMessage, editMessage, deleteMessage, typingStart, typingStop, readMessages } = useSocket();

  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; userName: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    const room = rooms.find(r => r.id === id);
    if (room) {
      setCurrentRoom(room);
      joinRoom(id);
      readMessages(id);
      fetchMessages(id);
    } else {
      navigate('/');
    }
    return () => { leaveRoom(id!); setCurrentRoom(null); };
  }, [id, rooms, setCurrentRoom, joinRoom, leaveRoom, readMessages, fetchMessages, navigate]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages[id || '']]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.on('user-status', ({ userId, status }) => setUserStatus(userId, status));
    return () => { socket.off('user-status'); };
  }, [socket, id, setUserStatus]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !replyingTo) return;
    sendMessage({ roomId: id!, content: message.trim(), replyToId: replyingTo?.id || null });
    setMessage('');
    setReplyingTo(null);
    typingStopRef();
  };

  const typingStartRef = useCallback(() => {
    if (!isTypingRef.current) { isTypingRef.current = true; typingStart(id!); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { isTypingRef.current = false; typingStop(id!); }, 2000);
  }, [id, typingStart, typingStop]);

  const typingStopRef = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) { isTypingRef.current = false; typingStop(id!); }
  }, [id, typingStop]);

  const handleEdit = (msg: { id: string; content: string }) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editContent.trim()) return;
    editMessage({ roomId: id!, messageId: msgId, content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (msgId: string) => {
    if (!window.confirm('Excluir esta mensagem?')) return;
    deleteMessage({ roomId: id!, messageId: msgId });
    setShowMenu(null);
  };

  const handleReply = (msg: { id: string; content: string; userName: string }) => {
    setReplyingTo({ id: msg.id, content: msg.content, userName: msg.userName });
  };

  const roomMessages = messages[id || ''] || [];
  const typing = typingUsers[id || ''] || [];
  const isOnline = (userId: string) => onlineUsers.includes(userId);

  if (!currentRoom) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Room Header */}
      <div className="flex items-center gap-4 h-16 px-4 border-b border-gray-200">
        <button onClick={() => { leaveRoom(id!); setCurrentRoom(null); navigate('/'); }} className="btn-ghost p-2 lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          {currentRoom.isPrivate ? <Hash className="h-5 w-5 text-primary-600" /> : <Users className="h-5 w-5 text-primary-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{currentRoom.name}</h2>
          <p className="text-xs text-gray-500">{currentRoom.memberCount} membros • {typing.length > 0 ? `${typing.map(t => t.split(':')[1]).join(', ')} digitando...` : ''}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={messagesEndRef}>
        {roomMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">Nenhuma mensagem ainda</p>
            <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          roomMessages.map((msg) => {
            const isOwn = msg.userId === user?.id;
            const showTime = !roomMessages[roomMessages.indexOf(msg) - 1] ||
              new Date(msg.createdAt).getTime() - new Date(roomMessages[roomMessages.indexOf(msg) - 1].createdAt).getTime() > 5 * 60 * 1000;
            return (
              <div key={msg.id} className={clsx('flex gap-2 max-w-[80%]', isOwn && 'flex-row-reverse ml-auto')}>
                {!isOwn && (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {msg.userAvatar ? <img src={msg.userAvatar} alt={msg.userName} className="h-8 w-8 rounded-full" /> : <span className="text-xs font-medium text-primary-700">{msg.userName.charAt(0)}</span>}
                  </div>
                )}
                <div className={clsx('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                  {!isOwn && <span className="text-xs text-gray-500 px-1">{msg.userName}</span>}
                  <div className={clsx('relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl', isOwn ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none')}>
                    {replyingTo?.id === msg.id && (
                      <div className="mb-1 p-2 bg-white/20 rounded text-xs opacity-80">
                        <span className="font-medium">{replyingTo.userName}</span>: {replyingTo.content.substring(0, 50)}...
                      </div>
                    )}
                    {msg.replyToId && !isOwn && (
                      <div className="mb-1 p-2 bg-gray-200 rounded text-xs">
                        <span className="font-medium">Respondendo</span>: {msg.content.substring(0, 50)}...
                      </div>
                    )}
                    {editingId === msg.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(msg.id); }} className="flex gap-2">
                        <input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="input flex-1 py-1" autoFocus />
                        <button type="submit" className="btn-primary px-3 py-1 text-sm">Salvar</button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-secondary px-3 py-1 text-sm">Cancelar</button>
                      </form>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <div className={clsx('flex items-center gap-1 mt-1 text-[10px]', isOwn ? 'text-primary-100' : 'text-gray-400')}>
                      {msg.isEdited && <span>editado</span>}
                      <span>{format(parseISO(msg.createdAt), 'HH:mm', { locale: ptBR })}</span>
                      {isOwn && msg.isOwn !== false && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity group">
                    <button onClick={() => handleReply(msg)} className="p-1 text-gray-400 hover:text-gray-600" title="Responder"><Reply className="h-4 w-4" /></button>
                    {isOwn && (
                      <>
                        <button onClick={() => handleEdit(msg)} className="p-1 text-gray-400 hover:text-gray-600" title="Editar"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(msg.id)} className="p-1 text-gray-400 hover:text-red-600" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                </div>
                {isOwn && <div className="h-8 w-8 flex-shrink-0" />}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typing.length > 0 && (
        <div className="px-4 py-1 text-sm text-gray-500 italic">
          {typing.map(t => t.split(':')[1]).join(', ')} {typing.length > 1 ? 'estão' : 'está'} digitando...
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {replyingTo && (
          <div className="mb-2 p-2 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between text-sm">
            <span>Respondendo a <strong>{replyingTo.userName}</strong>: {replyingTo.content.substring(0, 40)}...</span>
            <button onClick={() => setReplyingTo(null)} className="text-primary-600 hover:text-primary-700"><X className="h-4 w-4" /></button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <button type="button" className="btn-ghost p-2"><Paperclip className="h-5 w-5" /></button>
          <button type="button" className="btn-ghost p-2"><Smile className="h-5 w-5" /></button>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); typingStartRef(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder="Digite uma mensagem..."
              className="input pr-10 min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
          </div>
          <button type="submit" disabled={!message.trim() && !replyingTo} className="btn-primary p-2">
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}