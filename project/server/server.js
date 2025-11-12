const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcrypt');
const DatabaseManager = require('./database');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const db = new DatabaseManager();

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
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов с одного IP
  message: {
    error: 'Слишком много запросов, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Хранилище активных соединений (в памяти для быстрого доступа)
const activeConnections = new Map();

// Статистика сервера
let totalConnections = 0;
let serverStartTime = Date.now();

// API endpoints
app.get('/', async (req, res) => {
  try {
    const stats = await db.getStats();
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    
    res.json({
      name: 'Nemo Messenger Global Server',
      version: '3.0.0',
      status: 'online',
      database: 'PostgreSQL',
      onlineUsers: parseInt(stats.online_users) || 0,
      totalUsers: parseInt(stats.total_users) || 0,
      totalConnections,
      totalMessages: parseInt(stats.total_messages) || 0,
      messagesToday: parseInt(stats.messages_today) || 0,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
      serverTime: new Date().toISOString(),
      features: [
        'PostgreSQL Database',
        'Real-time messaging',
        'Global user search',
        'Auto cleanup',
        'Rate limiting',
        'CORS enabled'
      ]
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    
    res.json({
      ...stats,
      totalConnections,
      uptime,
      memoryUsage: process.memoryUsage(),
      activeConnections: activeConnections.size
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const onlineUsers = await db.getOnlineUsers();
    res.json({
      users: onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// Socket.IO обработчики
io.on('connection', (socket) => {
  totalConnections++;
  console.log(`🟢 Новое подключение: ${socket.id} (Всего активных: ${activeConnections.size + 1})`);

  // Отправляем информацию о сервере
  socket.emit('server:info', {
    serverName: 'Nemo Global Messenger',
    version: '3.0.0',
    database: 'PostgreSQL',
    features: ['postgresql', 'global-search', 'real-time', 'auto-cleanup']
  });

  // Регистрация пользователя
  socket.on('user:register', async (userData) => {
    try {
      // Хэшируем пароль если это новый пользователь
      let passwordHash = userData.password;
      if (userData.password && !userData.password.startsWith('$2b$')) {
        passwordHash = await bcrypt.hash(userData.password, 10);
      }

      const user = await db.registerUser({
        user_id: userData.id,
        username: userData.username,
        password_hash: passwordHash,
        display_name: userData.displayName || userData.username,
        device_type: userData.deviceType || 'desktop'
      });
      
      // Сохраняем соединение
      activeConnections.set(socket.id, {
        userId: userData.id,
        username: userData.username,
        socketId: socket.id,
        joinedAt: new Date(),
        lastActivity: Date.now()
      });

      // Обновляем статус в БД
      await db.updateUserStatus(userData.id, true, socket.id);
      
      console.log(`👤 Пользователь зарегистрирован: ${userData.username} (ID: ${userData.id})`);
      
      // Уведомляем всех о новом пользователе
      socket.broadcast.emit('user:online', {
        id: userData.id,
        username: userData.username,
        isOnline: true,
        lastSeen: Date.now(),
        deviceType: userData.deviceType
      });
      
      // Отправляем список онлайн пользователей
      const onlineUsers = await db.getOnlineUsers();
      socket.emit('users:list', onlineUsers.map(u => ({
        id: u.user_id,
        username: u.username,
        isOnline: true,
        lastSeen: u.last_seen,
        deviceType: u.device_type
      })));
      
    } catch (error) {
      console.error('Ошибка регистрации пользователя:', error);
      socket.emit('error', { message: 'Ошибка регистрации' });
    }
  });

  // Отправка сообщения
  socket.on('message:send', async (message) => {
    try {
      const connection = activeConnections.get(socket.id);
      if (!connection) {
        socket.emit('error', { message: 'Пользователь не найден' });
        return;
      }

      // Сохраняем сообщение в БД
      const savedMessage = await db.saveMessage({
        message_id: message.id,
        sender_id: message.senderId,
        receiver_id: message.receiverId,
        content: message.content,
        message_type: message.type || 'text'
      });

      const enrichedMessage = {
        ...message,
        serverTimestamp: savedMessage.created_at,
        serverId: savedMessage.id,
        senderUsername: connection.username
      };
      
      // Обновляем активность пользователя
      connection.lastActivity = Date.now();
      
      console.log(`📨 Сообщение от ${connection.username} к ${message.receiverId}`);
      
      // Находим получателя среди активных соединений
      let recipientSocket = null;
      for (const [socketId, conn] of activeConnections.entries()) {
        if (conn.userId === message.receiverId) {
          recipientSocket = socketId;
          break;
        }
      }
      
      if (recipientSocket) {
        // Отправляем сообщение получателю
        io.to(recipientSocket).emit('message:new', enrichedMessage);
        
        // Подтверждаем отправителю
        socket.emit('message:delivered', {
          messageId: message.id,
          serverTimestamp: enrichedMessage.serverTimestamp,
          delivered: true
        });
      } else {
        // Получатель не в сети, сообщение сохранено в БД для доставки позже
        socket.emit('message:delivered', {
          messageId: message.id,
          serverTimestamp: enrichedMessage.serverTimestamp,
          delivered: false,
          reason: 'Получатель не в сети'
        });
      }
      
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      socket.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  });

  // Поиск пользователя
  socket.on('user:search', async ({ query, requestId }) => {
    try {
      const foundUser = await db.searchUser(query);
      
      let result = null;
      if (foundUser) {
        result = {
          id: foundUser.user_id,
          username: foundUser.username,
          isOnline: foundUser.is_online,
          lastSeen: foundUser.last_seen,
          deviceType: foundUser.device_type
        };
      }
      
      socket.emit('user:found', { user: result, requestId });
      
      console.log(`🔍 Поиск "${query}": ${result ? 'найден ' + result.username : 'не найден'}`);
      
    } catch (error) {
      console.error('Ошибка поиска пользователя:', error);
      socket.emit('user:found', { user: null, requestId });
    }
  });

  // Получение списка онлайн пользователей
  socket.on('users:get_online', async () => {
    try {
      const onlineUsers = await db.getOnlineUsers();
      const connection = activeConnections.get(socket.id);
      
      // Исключаем текущего пользователя
      const filteredUsers = onlineUsers
        .filter(u => u.user_id !== connection?.userId)
        .map(u => ({
          id: u.user_id,
          username: u.username,
          isOnline: true,
          lastSeen: u.last_seen,
          deviceType: u.device_type
        }));
      
      socket.emit('users:online_list', filteredUsers);
    } catch (error) {
      console.error('Ошибка получения списка пользователей:', error);
      socket.emit('users:online_list', []);
    }
  });

  // Обновление активности
  socket.on('user:activity', () => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  });

  // Ping-pong для поддержания соединения
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Отключение пользователя
  socket.on('disconnect', async (reason) => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      console.log(`🔴 Пользователь отключился: ${connection.username} (причина: ${reason})`);
      
      // Обновляем статус в БД
      await db.updateUserStatus(connection.userId, false);
      
      activeConnections.delete(socket.id);
      socket.broadcast.emit('user:offline', connection.userId);
      
      // Обновляем список онлайн пользователей
      try {
        const onlineUsers = await db.getOnlineUsers();
        socket.broadcast.emit('users:list', onlineUsers.map(u => ({
          id: u.user_id,
          username: u.username,
          isOnline: true,
          lastSeen: u.last_seen,
          deviceType: u.device_type
        })));
      } catch (error) {
        console.error('Ошибка обновления списка пользователей:', error);
      }
    }
    
    console.log(`❌ Соединение закрыто: ${socket.id} (Осталось: ${activeConnections.size})`);
  });

  // Обработка ошибок
  socket.on('error', (error) => {
    console.error(`Ошибка сокета ${socket.id}:`, error);
  });
});

// Периодическая очистка данных (каждые 30 минут)
setInterval(async () => {
  try {
    await db.cleanup();
  } catch (error) {
    console.error('Ошибка очистки данных:', error);
  }
}, 30 * 60 * 1000);

// Логирование статистики каждые 10 минут
setInterval(async () => {
  try {
    const stats = await db.getStats();
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    console.log(`📊 Статистика: ${stats.online_users} онлайн, ${stats.total_messages} сообщений, ${Math.floor(uptime/60)}м работы`);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
  }
}, 10 * 60 * 1000);

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение промиса:', reason);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Nemo Messenger Global Server v3.0.0 запущен на порту ${PORT}`);
  console.log(`🐘 Подключен к PostgreSQL базе данных`);
  console.log(`🌐 Сервер доступен для всех пользователей мира`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔗 HTTP API: http://localhost:${PORT}`);
  console.log(`📊 Статистика: http://localhost:${PORT}/api/stats`);
  console.log(`👥 Пользователи: http://localhost:${PORT}/api/users`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`🛑 Получен сигнал ${signal}, завершаем работу...`);
  
  // Уведомляем всех пользователей об отключении
  io.emit('server:shutdown', {
    message: 'Сервер перезагружается, переподключение через несколько секунд...'
  });
  
  // Закрываем соединения с БД
  try {
    await db.close();
  } catch (error) {
    console.error('Ошибка закрытия БД:', error);
  }
  
  server.close(() => {
    console.log('✅ Сервер успешно остановлен');
    process.exit(0);
  });
  
  // Принудительное завершение через 10 секунд
  setTimeout(() => {
    console.log('⚠️ Принудительное завершение работы');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));