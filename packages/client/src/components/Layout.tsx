import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Menu, X, LogOut, User, Settings, MessageSquare, Plus, Bell, Search, ChevronDown, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { rooms, currentRoom, fetchRooms, unreadCounts, setCurrentRoom } = useChat();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    if (isAuthenticated) fetchRooms();
  }, [isAuthenticated, fetchRooms]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const { createRoom } = useChat.getState();
      const room = await createRoom({ name: newRoomName.trim() });
      setShowCreateRoom(false);
      setNewRoomName('');
      navigate(`/room/${room.id}`);
    } catch (err) {
      console.error('Erro ao criar sala:', err);
    }
  };

  const totalUnread = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <MessageSquare className="h-8 w-8" />
              ChatRealTime
            </NavLink>
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Buscar salas..." className="input pl-10" />
            </div>
          </div>

          {/* Create room button */}
          <div className="p-4 border-b border-gray-200">
            <button onClick={() => setShowCreateRoom(true)} className="btn-primary w-full">
              <Plus className="h-5 w-5 mr-2" />
              Nova Sala
            </button>
          </div>

          {/* Rooms list */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {rooms.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">Nenhuma sala ainda</p>
            ) : (
              rooms.map((room) => (
                <NavLink
                  key={room.id}
                  to={`/room/${room.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setCurrentRoom(room)}
                >
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{room.name}</p>
                    <p className="text-xs text-gray-500 truncate">{room.memberCount} membros</p>
                  </div>
                  {(room.unreadCount || 0) > 0 && (
                    <span className="bg-primary-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </span>
                  )}
                </NavLink>
              ))
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                ) : (
                  <span className="text-sm font-medium text-primary-700">{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-80 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative ml-4">
              <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-primary-700">{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <NavLink to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setUserMenuOpen(false)}>
                      <Settings className="h-4 w-4" />
                      Configurações
                    </NavLink>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <form onSubmit={handleCreateRoom} className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-semibold">Criar nova sala</h2>
                  <button type="button" onClick={() => setShowCreateRoom(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div>
                  <label htmlFor="roomName" className="label">Nome da sala</label>
                  <input
                    id="roomName"
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="input"
                    placeholder="Ex: Geral, Projetos, Dev..."
                    required
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreateRoom(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" className="btn-primary flex-1">Criar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}