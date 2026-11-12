import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { ArrowLeft, Users, Lock, Hash } from 'lucide-react';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { createRoom } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setIsLoading(true);
    try {
      const room = await createRoom({ name: name.trim(), description: description.trim() || undefined, isPrivate });
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError('Erro ao criar sala');
      console.error(err);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="btn-ghost mb-4"><ArrowLeft className="h-5 w-5" /> Voltar</button>
        <div className="card p-6">
          <div className="text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Criar nova sala</h1>
            <p className="text-gray-600 mt-1">Configure sua sala de conversa</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Nome da sala *</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ex: Geral, Projetos, Dev..." required maxLength={100} autoFocus />
            </div>
            <div>
              <label htmlFor="description" className="label">Descrição (opcional)</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px] resize-y" placeholder="Sobre o que é esta sala?" maxLength={500} />
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <div>
                  <p className="font-medium text-gray-900">Sala privada</p>
                  <p className="text-sm text-gray-500">Apenas membros convidados podem entrar</p>
                </div>
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => navigate('/')} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={isLoading || !name.trim()} className="btn-primary flex-1">{isLoading ? 'Criando...' : 'Criar sala'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}