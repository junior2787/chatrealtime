import { useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageSquare, Plus, Users, Hash } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const { rooms, currentRoom, setCurrentRoom, fetchRooms } = useChat();

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  return (
    <div className="h-full flex flex-col">
      {/* Empty state or room list */}
      <div className="flex-1 overflow-y-auto p-6">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma sala ainda</h2>
            <p className="text-gray-500 mb-6 max-w-sm">Crie sua primeira sala ou entre em uma sala pública para começar a conversar</p>
            <button onClick={() => setCurrentRoom(null)} className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Criar sala
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Suas salas</h3>
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setCurrentRoom(room)}
                className={clsx('w-full text-left p-4 rounded-xl border transition-colors', currentRoom?.id === room.id ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {room.isPrivate ? (
                      <Hash className="h-6 w-6 text-primary-600" />
                    ) : (
                      <Users className="h-6 w-6 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{room.name}</p>
                      {room.isPrivate && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Privada</span>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{room.memberCount} membros</p>
                  </div>
                  {(room.unreadCount || 0) > 0 && (
                    <span className="bg-primary-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}