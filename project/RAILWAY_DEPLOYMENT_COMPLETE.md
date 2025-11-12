# 🚄 Полная настройка Nemo Messenger на Railway

## 🎯 У вас уже есть аккаунт Railway - отлично!

### Шаг 1: Создание нового проекта
1. **На главной странице Railway нажмите "New Project"**
2. **Выберите "Empty Project"** (пустой проект)
3. **Назовите проект:** `nemo-messenger-global`

### Шаг 2: Добавление сервиса
1. **В созданном проекте нажмите "Add Service"**
2. **Выберите "GitHub Repo"**
3. **Если у вас нет репозитория, создайте его:**
   - Перейдите на [github.com](https://github.com)
   - Нажмите "New repository"
   - Назовите: `nemo-messenger-server`
   - Сделайте публичным
   - Создайте репозиторий

### Шаг 3: Загрузка файлов сервера
Создайте эти файлы в вашем GitHub репозитории:

**📄 package.json:**
```json
{
  "name": "nemo-messenger-global-server",
  "version": "2.0.0",
  "description": "Глобальный сервер для Nemo Messenger",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.4",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  },
  "keywords": ["messenger", "socket.io", "realtime", "chat", "nemo"],
  "author": "Nemo Messenger Team",
  "license": "MIT"
}
```

**📄 server.js:** (основной файл сервера)
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const server = http.createServer(app);

// Настройка безопасности
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());

// Настройка CORS для глобального доступа
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Слишком много запросов' }
});
app.use(limiter);

// Хранилище данных
const users = new Map();
const messages = [];
const userSearchIndex = new Map();

// Статистика
let totalConnections = 0;
let totalMessages = 0;
let serverStartTime = Date.now();

// API endpoints
app.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  res.json({
    name: 'Nemo Messenger Global Server',
    version: '2.0.0',
    status: 'online',
    onlineUsers: users.size,
    totalConnections,
    totalMessages,
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    serverTime: new Date().toISOString()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    onlineUsers: users.size,
    totalConnections,
    totalMessages,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO обработчики
io.on('connection', (socket) => {
  totalConnections++;
  console.log(`🟢 Новое подключение: ${socket.id} (Всего: ${users.size + 1})`);

  socket.emit('server:info', {
    serverName: 'Nemo Global Messenger',
    version: '2.0.0',
    onlineUsers: users.size,
    totalMessages
  });

  // Регистрация пользователя
  socket.on('user:register', (userData) => {
    try {
      const user = {
        ...userData,
        socketId: socket.id,
        isOnline: true,
        joinedAt: new Date(),
        lastActivity: Date.now()
      };
      
      // Удаляем старую запись если пользователь переподключился
      for (const [oldSocketId, oldUser] of users.entries()) {
        if (oldUser.id === userData.id) {
          users.delete(oldSocketId);
          break;
        }
      }
      
      users.set(socket.id, user);
      userSearchIndex.set(userData.username.toLowerCase(), user);
      userSearchIndex.set(userData.id, user);
      
      console.log(`👤 Пользователь зарегистрирован: ${userData.username}`);
      
      socket.broadcast.emit('user:online', {
        id: user.id,
        username: user.username,
        isOnline: true,
        lastSeen: user.lastActivity,
        deviceType: user.deviceType
      });
      
      const onlineUsers = Array.from(users.values()).map(u => ({
        id: u.id,
        username: u.username,
        isOnline: true,
        lastSeen: u.lastActivity,
        deviceType: u.deviceType
      }));
      
      socket.emit('users:list', onlineUsers);
      
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      socket.emit('error', { message: 'Ошибка регистрации' });
    }
  });

  // Отправка сообщения
  socket.on('message:send', (message) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      const enrichedMessage = {
        ...message,
        serverTimestamp: Date.now(),
        serverId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      messages.push(enrichedMessage);
      if (messages.length > 10000) messages.shift();
      
      totalMessages++;
      user.lastActivity = Date.now();
      
      console.log(`📨 Сообщение от ${user.username}`);
      
      // Находим получателя
      let recipientSocket = null;
      for (const [socketId, u] of users.entries()) {
        if (u.id === enrichedMessage.receiverId) {
          recipientSocket = socketId;
          break;
        }
      }
      
      if (recipientSocket) {
        io.to(recipientSocket).emit('message:new', enrichedMessage);
        socket.emit('message:delivered', {
          messageId: message.id,
          serverTimestamp: enrichedMessage.serverTimestamp,
          delivered: true
        });
      } else {
        socket.emit('message:delivered', {
          messageId: message.id,
          delivered: false,
          reason: 'Получатель не в сети'
        });
      }
      
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  });

  // Поиск пользователя
  socket.on('user:search', ({ query, requestId }) => {
    try {
      const searchQuery = query.toLowerCase().trim();
      let foundUser = null;
      
      if (userSearchIndex.has(searchQuery)) {
        const user = userSearchIndex.get(searchQuery);
        if (user && user.socketId !== socket.id) {
          foundUser = {
            id: user.id,
            username: user.username,
            isOnline: true,
            lastSeen: user.lastActivity,
            deviceType: user.deviceType
          };
        }
      }
      
      if (!foundUser && userSearchIndex.has(query)) {
        const user = userSearchIndex.get(query);
        if (user && user.socketId !== socket.id) {
          foundUser = {
            id: user.id,
            username: user.username,
            isOnline: true,
            lastSeen: user.lastActivity,
            deviceType: user.deviceType
          };
        }
      }
      
      socket.emit('user:found', { user: foundUser, requestId });
      console.log(`🔍 Поиск "${query}": ${foundUser ? 'найден' : 'не найден'}`);
      
    } catch (error) {
      console.error('Ошибка поиска:', error);
      socket.emit('user:found', { user: null, requestId });
    }
  });

  // Получение списка онлайн пользователей
  socket.on('users:get_online', () => {
    const onlineUsers = Array.from(users.values())
      .filter(u => u.socketId !== socket.id)
      .map(u => ({
        id: u.id,
        username: u.username,
        isOnline: true,
        lastSeen: u.lastActivity,
        deviceType: u.deviceType
      }));
    
    socket.emit('users:online_list', onlineUsers);
  });

  // Отключение пользователя
  socket.on('disconnect', (reason) => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`🔴 Пользователь отключился: ${user.username}`);
      
      userSearchIndex.delete(user.username.toLowerCase());
      userSearchIndex.delete(user.id);
      users.delete(socket.id);
      
      socket.broadcast.emit('user:offline', user.id);
      
      const onlineUsers = Array.from(users.values()).map(u => ({
        id: u.id,
        username: u.username,
        isOnline: true,
        lastSeen: u.lastActivity,
        deviceType: u.deviceType
      }));
      
      socket.broadcast.emit('users:list', onlineUsers);
    }
  });
});

// Очистка старых сообщений каждые 6 часов
setInterval(() => {
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  const oldCount = messages.length;
  
  const filtered = messages.filter(msg => msg.serverTimestamp > sixHoursAgo);
  messages.length = 0;
  messages.push(...filtered);
  
  const removed = oldCount - messages.length;
  if (removed > 0) {
    console.log(`🧹 Очищено ${removed} старых сообщений`);
  }
}, 6 * 60 * 60 * 1000);

// Статистика каждые 10 минут
setInterval(() => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  console.log(`📊 Статистика: ${users.size} онлайн, ${totalMessages} сообщений, ${Math.floor(uptime/60)}м работы`);
}, 10 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Nemo Messenger Global Server запущен на порту ${PORT}`);
  console.log(`🌐 Сервер доступен для всех пользователей мира`);
});
```

### Шаг 4: Развертывание на Railway
1. **Вернитесь в Railway**
2. **Подключите ваш GitHub репозиторий**
3. **Railway автоматически определит Node.js проект**
4. **Дождитесь завершения развертывания (2-3 минуты)**

### Шаг 5: Получение URL
1. **В разделе "Deployments" скопируйте URL**
2. **Он будет вида:** `https://your-project.up.railway.app`

### Шаг 6: Обновление клиента
Обновите URL в мессенджере:

```javascript
// В src/services/globalDatabase.ts
private databaseUrl = 'https://your-project.up.railway.app';
```

## ✅ Проверка работы

Откройте ваш URL в браузере - должен показать JSON с информацией о сервере:

```json
{
  "name": "Nemo Messenger Global Server",
  "version": "2.0.0",
  "status": "online",
  "onlineUsers": 0,
  "totalConnections": 0,
  "totalMessages": 0
}
```

## 🎉 Готово!

Теперь у вас есть глобальный сервер, и все пользователи мессенджера смогут:
- 🌍 Находить друг друга по всему миру
- 💬 Обмениваться сообщениями в реальном времени
- 👥 Видеть кто онлайн
- 🔍 Использовать быстрый поиск

## 🚀 Преимущества Railway:
- ✅ Не засыпает приложение (в отличие от Heroku)
- ✅ Быстрое развертывание
- ✅ Автоматические обновления при изменениях в GitHub
- ✅ Бесплатный план без ограничений по времени
- ✅ Встроенный мониторинг

---

**🎯 Начните с создания нового проекта в Railway!**