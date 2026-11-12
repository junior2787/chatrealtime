# ChatRealTime - Chat em Tempo Real

![ChatRealTime](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

> Aplicação de chat em tempo real completa, construída com **React + TypeScript** no frontend e **Node.js + Socket.io + TypeScript** no backend. Inclui salas públicas/privadas, mensagens em tempo real, indicadores de digitação, respostas, edição/exclusão de mensagens, status online/offline e interface moderna responsiva.

## 🚀 Funcionalidades

### 💬 Chat em Tempo Real
- **WebSockets** com Socket.io (conexão persistente, reconexão automática)
- **Salas públicas e privadas** (criação, listagem, entrada/saída)
- **Mensagens instantâneas** com entrega em tempo real
- **Tipos de mensagem**: texto, imagem, arquivo
- **Responder mensagens** (quote reply)
- **Editar e excluir** próprias mensagens
- **Indicador de digitação** em tempo real
- **Confirmação de leitura** (read receipts)

### 👥 Gestão de Usuários
- **Registro/Login** com JWT (7 dias expiração)
- **Avatares automáticos** (DiceBear)
- **Busca de usuários** para convites
- **Status online/offline** em tempo real
- **Perfil editável** (nome, avatar)

### 🏠 Salas
- **Criação de salas** (públicas/privadas)
- **Listagem de salas** do usuário
- **Salas públicas** descobríveis
- **Contador de membros** em tempo real
- **Contador de não lidas** por sala
- **Dono da sala** pode editar/deletar

### 🎨 Interface Moderna
- **Design responsivo** (mobile-first, sidebar colapsável)
- **Tema consistente** com Tailwind CSS (verde como cor primária)
- **Scroll virtualizado** para histórico de mensagens
- **Modais** para criar sala
- **Dropdown menus** para ações de mensagem
- **Feedback visual** (loading, empty states, erros)

## 🛠 Stack Técnica

### Backend (`packages/server`)
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20+ | Runtime |
| Express | 4.18 | HTTP server |
| Socket.io | 4.7 | WebSockets |
| TypeScript | 5.3 | Tipagem estática |
| JWT | 9.0 | Autenticação |
| bcryptjs | 2.4 | Hash de senhas |
| Zod | 3.22 | Validação |
| UUID | 9.0 | IDs únicos |
| Vitest | 1.2 | Testes |

### Frontend (`packages/client`)
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.2 | UI Library |
| TypeScript | 5.3 | Tipagem estática |
| Vite | 5.0 | Build tool |
| Tailwind CSS | 3.4 | Estilização |
| React Router | 6.21 | Roteamento |
| Socket.io Client | 4.7 | WebSocket client |
| Zustand | 4.4 | State management |
| date-fns | 3.2 | Datas |
| Lucide React | 0.303 | Ícones |
| Axios | 1.6 | HTTP Client |

## 📦 Estrutura do Projeto

```
chatrealtime/
├── docker-compose.yml          # Orquestração
├── package.json                # Workspace root
├── README.md
├── packages/
│   ├── server/                 # Backend
│   │   ├── src/
│   │   │   ├── index.ts        # Entry + Express + Socket.io
│   │   │   ├── middleware/     # Auth, error handling, validation
│   │   │   ├── routes/         # Auth, rooms, messages, users
│   │   │   ├── socket/         # Handlers WebSocket
│   │   │   └── validators/     # Zod schemas
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   │
│   └── client/                 # Frontend React
│       ├── src/
│       │   ├── components/     # Layout
│       │   ├── context/        # Auth, Socket, Chat contexts
│       │   ├── lib/            # API client (axios)
│       │   ├── pages/          # Login, Register, Home, Room, CreateRoom, Settings
│       │   ├── types/          # TypeScript interfaces
│       │   ├── App.tsx         # Routes + providers
│       │   └── main.tsx        # Entry point
│       ├── Dockerfile
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       └── vite.config.ts
```

## ⚡ Quick Start

### Pré-requisitos
- **Node.js 20+** e **npm 10+**
- **Docker** e **Docker Compose** (opcional)

### 1. Clone e instale
```bash
git clone https://github.com/seu-usuario/chatrealtime.git
cd chatrealtime
npm install
```

### 2. Desenvolvimento (2 terminais)

**Terminal 1 - Backend:**
```bash
npm run dev:server
# Server: http://localhost:3003
# Health: http://localhost:3003/health
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
# Frontend: http://localhost:5173
```

### 3. Ou ambos juntos:
```bash
npm run dev
```

### 4. Docker (Produção)
```bash
docker-compose up -d --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:3003
```

## 📚 API Endpoints (REST)

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Perfil (auth) |

### Salas (Auth)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/rooms` | Minhas salas |
| GET | `/api/rooms/public` | Salas públicas |
| GET | `/api/rooms/:id` | Detalhes da sala |
| POST | `/api/rooms` | Criar sala |
| PUT | `/api/rooms/:id` | Atualizar (dono) |
| POST | `/api/rooms/:id/join` | Entrar na sala |
| POST | `/api/rooms/:id/leave` | Sair da sala |
| DELETE | `/api/rooms/:id` | Deletar (dono) |

### Mensagens (Auth)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/messages/:roomId` | Listar (paginado) |
| POST | `/api/messages/:roomId` | Enviar |
| PUT | `/api/messages/:roomId/:messageId` | Editar (próprio) |
| DELETE | `/api/messages/:roomId/:messageId` | Deletar (próprio) |

### Usuários (Auth)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/users/search?q=` | Buscar usuários |
| GET | `/api/users/online` | Usuários online |
| GET | `/api/users/:id` | Perfil público |
| PUT | `/api/users/me` | Atualizar perfil |

## 🔌 Eventos Socket.io

### Cliente → Servidor
| Evento | Payload | Descrição |
|--------|---------|-----------|
| `join-room` | `{ roomId }` | Entrar na sala |
| `leave-room` | `{ roomId }` | Sair da sala |
| `send-message` | `{ roomId, content, type, replyToId? }` | Enviar mensagem |
| `edit-message` | `{ roomId, messageId, content }` | Editar mensagem |
| `delete-message` | `{ roomId, messageId }` | Deletar mensagem |
| `typing-start` | `roomId` | Iniciou digitação |
| `typing-stop` | `roomId` | Parou digitação |
| `read-messages` | `roomId` | Marcou como lido |

### Servidor → Cliente
| Evento | Payload | Descrição |
|--------|---------|-----------|
| `new-message` | `Message` | Nova mensagem |
| `message-edited` | `{ roomId, message }` | Mensagem editada |
| `message-deleted` | `{ roomId, messageId }` | Mensagem deletada |
| `user-joined` | `{ roomId, userId, userName }` | Usuário entrou |
| `user-left` | `{ roomId, userId, userName }` | Usuário saiu |
| `user-typing` | `{ roomId, userId, userName }` | Digitando |
| `user-stopped-typing` | `{ roomId, userId }` | Parou |
| `user-status` | `{ userId, userName, status }` | Online/offline |
| `messages-read` | `{ roomId, userId, userName }` | Lido |

## 🧪 Testes

```bash
# Backend
cd packages/server
npm run test

# Frontend
cd packages/client
npm run test
```

## 📝 Scripts

```bash
# Root
npm run dev              # Server + Client
npm run dev:server       # Backend apenas
npm run dev:client       # Frontend apenas
npm run build            # Build all
npm run test             # Test all
npm run lint             # Lint all

# Server
npm run dev              # tsx watch
npm run build            # tsc
npm run start            # node dist/index.js

# Client
npm run dev              # vite
npm run build            # tsc && vite build
npm run preview          # vite preview
```

## 🔒 Variáveis de Ambiente

### Server
```env
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
PORT=3003
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

### Client
```env
VITE_SERVER_URL="http://localhost:3003"
```

## 🎯 Roadmap

- [ ] Upload de imagens/arquivos nas mensagens
- [ ] Reações (emojis) nas mensagens
- [ ] Mensagens de voz
- [ ] Notificações push (Service Worker)
- [ ] Modo escuro completo
- [ ] Busca full-text nas mensagens
- [ ] Menções @usuario
- [ ] Canais de voz/vídeo (WebRTC)
- [ ] Testes E2E com Playwright
- [ ] CI/CD GitHub Actions
- [ ] Documentação OpenAPI/Swagger
- [ ] Internacionalização (i18n)

## 📄 Licença

MIT License

## 👨‍💻 Autor

**Junior Moura**
- GitHub: [@junior2787](https://github.com/junior2787)
- Email: juniormoura746@gmail.com

---

⭐ **Se este projeto te ajudou, deixe uma estrela no GitHub!**