import { Message, User } from '../types';

interface DatabaseConfig {
  userId: string;
  username: string;
  deviceType: 'desktop' | 'mobile';
}

class GlobalDatabaseService {
  private config: DatabaseConfig | null = null;
  private isConnected = false;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private userCallbacks: ((users: User[]) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private onlineUsers: User[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private localChannel: BroadcastChannel | null = null;
  private isLocalMode = false;
  private socket: any = null;

  // 🚄 ВАШ RAILWAY СЕРВЕР!
  private databaseUrl = 'https://nemo-messenger-server-production.up.railway.app';

  async connect(config: DatabaseConfig): Promise<boolean> {
    this.config = config;
    
    try {
      // Проверяем доступность вашего Railway сервера
      console.log('🚄 Подключаемся к вашему Railway серверу...');
      
      const testResponse = await fetch(`${this.databaseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error(`Railway сервер недоступен: HTTP ${testResponse.status}`);
      }

      const healthData = await testResponse.json();
      console.log('✅ Ваш Railway сервер работает отлично:', healthData);

      // 🔥 ПОДКЛЮЧАЕМСЯ К SOCKET.IO НА ВАШЕМ RAILWAY СЕРВЕРЕ!
      await this.connectToSocketIO();
      
      this.isConnected = true;
      this.isLocalMode = false;
      this.notifyConnectionChange(true);
      
      console.log('🎉 Успешно подключен к вашему Railway серверу!');
      return true;
    } catch (error) {
      console.warn('⚠️ Railway сервер временно недоступен, переключаемся в локальный режим:', error);
      this.setupLocalMode();
      return true;
    }
  }

  private async connectToSocketIO(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Динамически импортируем socket.io-client
      import('socket.io-client').then(({ io }) => {
        console.log('🔌 Подключаемся к Socket.IO на вашем Railway сервере...');
        
        this.socket = io(this.databaseUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        });

        const timeout = setTimeout(() => {
          console.log('⏰ Таймаут подключения к Socket.IO');
          this.socket?.disconnect();
          reject(new Error('Socket.IO connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Подключен к Socket.IO на вашем Railway сервере!');
          
          // Регистрируем пользователя на сервере
          this.socket.emit('user:register', {
            id: this.config!.userId,
            username: this.config!.username,
            deviceType: this.config!.deviceType,
            timestamp: Date.now()
          });
          
          this.setupSocketListeners();
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Ошибка подключения к Socket.IO:', error);
          this.socket?.disconnect();
          reject(error);
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('🔌 Отключен от Socket.IO:', reason);
          this.isConnected = false;
          this.notifyConnectionChange(false);
        });

      }).catch((error) => {
        console.error('❌ Ошибка импорта socket.io-client:', error);
        reject(error);
      });
    });
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Слушаем информацию о сервере
    this.socket.on('server:info', (info: any) => {
      console.log('ℹ️ Информация о Railway сервере:', info);
    });

    // Слушаем новые сообщения
    this.socket.on('message:new', (message: Message) => {
      console.log('📨 Получено новое сообщение через Socket.IO:', message);
      this.messageCallbacks.forEach(callback => callback(message));
      
      // Сохраняем локально
      const localMessages = JSON.parse(localStorage.getItem('messenger_messages') || '[]');
      const exists = localMessages.find((m: Message) => m.id === message.id);
      if (!exists) {
        localMessages.push(message);
        localStorage.setItem('messenger_messages', JSON.stringify(localMessages));
      }
    });

    // Слушаем подтверждения доставки
    this.socket.on('message:delivered', (data: any) => {
      console.log('✅ Сообщение доставлено:', data);
    });

    // Слушаем список пользователей
    this.socket.on('users:list', (users: User[]) => {
      console.log('👥 Обновлен список пользователей:', users.length);
      this.onlineUsers = users;
      this.userCallbacks.forEach(callback => callback(users));
    });

    // Слушаем результаты поиска
    this.socket.on('user:found', (response: { user: User | null, requestId: string }) => {
      console.log('🔍 Результат поиска:', response.user);
      // Сохраняем результат для обработки в searchUser
      (this as any).lastSearchResult = response;
    });

    // Слушаем пользователей онлайн/оффлайн
    this.socket.on('user:online', (user: User) => {
      console.log(`🟢 Пользователь ${user.username} в сети`);
      const existingIndex = this.onlineUsers.findIndex(u => u.id === user.id);
      if (existingIndex === -1) {
        this.onlineUsers.push(user);
        this.userCallbacks.forEach(callback => callback(this.onlineUsers));
      }
    });

    this.socket.on('user:offline', (userId: string) => {
      console.log(`🔴 Пользователь ${userId} не в сети`);
      this.onlineUsers = this.onlineUsers.filter(u => u.id !== userId);
      this.userCallbacks.forEach(callback => callback(this.onlineUsers));
    });

    // Обработка ошибок
    this.socket.on('error', (error: any) => {
      console.error('❌ Ошибка Socket.IO:', error);
    });
  }

  private setupLocalMode() {
    // Останавливаем Socket.IO если подключен
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isLocalMode = true;
    
    // Локальный режим через BroadcastChannel для синхронизации между вкладками
    this.localChannel = new BroadcastChannel('nemo-messenger-global-fallback');
    
    this.localChannel.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'message':
          this.messageCallbacks.forEach(callback => callback(data));
          break;
        case 'user_list':
          this.userCallbacks.forEach(callback => callback(data));
          break;
        case 'user_register':
          // Добавляем нового пользователя в локальный список
          const existingIndex = this.onlineUsers.findIndex(u => u.id === data.id);
          if (existingIndex === -1) {
            this.onlineUsers.push(data);
            this.userCallbacks.forEach(callback => callback(this.onlineUsers));
          }
          break;
        case 'user_activity':
          // Обновляем активность пользователя
          const userIndex = this.onlineUsers.findIndex(u => u.id === data.userId);
          if (userIndex !== -1) {
            this.onlineUsers[userIndex].lastSeen = new Date(data.lastSeen);
            this.userCallbacks.forEach(callback => callback(this.onlineUsers));
          }
          break;
      }
    };

    this.isConnected = true;
    this.notifyConnectionChange(true);
    
    // Объявляем о своем присутствии
    if (this.config) {
      this.localChannel.postMessage({
        type: 'user_register',
        data: {
          id: this.config.userId,
          username: this.config.username,
          isOnline: true,
          lastSeen: new Date(),
          deviceType: this.config.deviceType
        }
      });

      // Запускаем локальную синхронизацию
      this.startLocalSync();
    }
    
    console.log('🔄 Работаем в локальном режиме с BroadcastChannel синхронизацией');
  }

  private startLocalSync() {
    // Локальная синхронизация каждые 5 секунд
    this.syncInterval = setInterval(() => {
      if (this.config && this.localChannel) {
        // Транслируем нашу активность
        this.localChannel.postMessage({
          type: 'user_activity',
          data: {
            userId: this.config.userId,
            lastSeen: Date.now()
          }
        });

        // Очищаем неактивных пользователей (нет активности более 30 секунд в локальном режиме)
        this.onlineUsers = this.onlineUsers.filter(user => {
          const timeSinceLastSeen = Date.now() - user.lastSeen.getTime();
          return timeSinceLastSeen < 30000;
        });
        
        this.userCallbacks.forEach(callback => callback(this.onlineUsers));
      }
    }, 5000);
  }

  async sendMessage(message: Message): Promise<boolean> {
    if (!this.config) return false;

    if (!this.isLocalMode && this.socket && this.socket.connected) {
      try {
        // Отправляем через Socket.IO на ваш Railway сервер
        console.log('📤 Отправляем сообщение через Socket.IO на ваш Railway сервер...');
        
        this.socket.emit('message:send', {
          ...message,
          timestamp: Date.now(),
          serverTimestamp: Date.now(),
          senderDevice: this.config.deviceType,
          version: '3.0.0'
        });

        console.log('✅ Сообщение отправлено на ваш Railway сервер через Socket.IO');
        return true;
      } catch (error) {
        console.error('❌ Ошибка отправки через Socket.IO:', error);
        console.warn('⚠️ Переключаемся в локальный режим для отправки сообщения');
        this.setupLocalMode();
      }
    }
    
    // Fallback на локальный режим или если уже в локальном режиме
    if (this.localChannel) {
      this.localChannel.postMessage({
        type: 'message',
        data: message
      });
      console.log('📤 Сообщение отправлено через локальный канал');
      return true;
    }
    
    return false;
  }

  async searchUser(query: string): Promise<User | null> {
    if (!this.isLocalMode && this.socket && this.socket.connected) {
      try {
        console.log(`🔍 Поиск пользователя на вашем Railway сервере через Socket.IO: "${query}"`);
        
        return new Promise((resolve) => {
          const requestId = Date.now().toString();
          
          // Устанавливаем таймаут
          const timeout = setTimeout(() => {
            resolve(null);
          }, 5000);
          
          // Слушаем результат поиска
          const handleSearchResult = (response: { user: User | null, requestId: string }) => {
            if (response.requestId === requestId) {
              clearTimeout(timeout);
              this.socket.off('user:found', handleSearchResult);
              
              if (response.user && response.user.id !== this.config?.userId) {
                console.log(`✅ Найден пользователь на вашем Railway сервере: ${response.user.username} (${response.user.id})`);
                resolve(response.user);
              } else {
                resolve(null);
              }
            }
          };
          
          this.socket.on('user:found', handleSearchResult);
          
          // Отправляем запрос поиска
          this.socket.emit('user:search', { 
            query, 
            requestId 
          });
        });
      } catch (error) {
        console.error('❌ Ошибка поиска пользователя через Socket.IO:', error);
        console.warn('⚠️ Переключаемся в локальный режим для поиска');
        this.setupLocalMode();
      }
    }

    // Локальный поиск как fallback или если в локальном режиме
    console.log(`🔍 Локальный поиск пользователя: "${query}"`);
    
    // Поиск среди текущих онлайн пользователей
    const onlineUser = this.onlineUsers.find(u => 
      u.username.toLowerCase() === query.toLowerCase() || u.id === query
    );
    
    if (onlineUser) {
      console.log(`✅ Найден онлайн пользователь: ${onlineUser.username} (${onlineUser.id})`);
      return onlineUser;
    }

    // Поиск в локальном хранилище
    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const foundUser = users.find((u: any) => 
      (u.username.toLowerCase() === query.toLowerCase() || u.id === query) && 
      !u.isDeleted && u.id !== this.config?.userId
    );
    
    if (foundUser) {
      console.log(`✅ Найден пользователь локально: ${foundUser.username} (${foundUser.id})`);
      return {
        id: foundUser.id,
        username: foundUser.username,
        isOnline: false, // Предполагаем оффлайн для локальных пользователей
        lastSeen: new Date(),
        deviceType: foundUser.deviceType || 'desktop'
      };
    }
    
    console.log(`❌ Пользователь "${query}" не найден`);
    return null;
  }

  getOnlineUsers(): User[] {
    return this.onlineUsers;
  }

  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
  }

  onUserListUpdate(callback: (users: User[]) => void) {
    this.userCallbacks.push(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  disconnect() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }

    this.isConnected = false;
    this.isLocalMode = false;
    this.notifyConnectionChange(false);
    console.log('🔌 Отключен от вашего Railway сервера');
  }

  isOnline(): boolean {
    return this.isConnected;
  }

  isInLocalMode(): boolean {
    return this.isLocalMode;
  }

  // Получение статистики
  async getGlobalStats(): Promise<any> {
    if (this.isLocalMode) {
      return {
        totalUsers: this.onlineUsers.length + 1, // +1 для текущего пользователя
        onlineUsers: this.onlineUsers.length + 1,
        desktopUsers: this.onlineUsers.filter(u => u.deviceType === 'desktop').length + (this.config?.deviceType === 'desktop' ? 1 : 0),
        mobileUsers: this.onlineUsers.filter(u => u.deviceType === 'mobile').length + (this.config?.deviceType === 'mobile' ? 1 : 0),
        localMode: true
      };
    }

    try {
      const response = await fetch(`${this.databaseUrl}/api/stats`);
      
      if (response.ok) {
        const stats = await response.json();
        
        return {
          totalUsers: stats.totalConnections || 0,
          onlineUsers: stats.onlineUsers || 0,
          desktopUsers: Math.floor((stats.onlineUsers || 0) * 0.7), // Примерная оценка
          mobileUsers: Math.floor((stats.onlineUsers || 0) * 0.3),
          totalMessages: stats.totalMessages || 0,
          uptime: stats.uptime || '0h 0m 0s',
          localMode: false
        };
      }
      
      return {
        totalUsers: 0,
        onlineUsers: 0,
        desktopUsers: 0,
        mobileUsers: 0,
        totalMessages: 0,
        localMode: false
      };
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
      return {
        totalUsers: 0,
        onlineUsers: 0,
        desktopUsers: 0,
        mobileUsers: 0,
        totalMessages: 0,
        localMode: false
      };
    }
  }
}

export const globalDatabase = new GlobalDatabaseService();