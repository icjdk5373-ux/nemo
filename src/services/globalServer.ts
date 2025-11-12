import { io, Socket } from 'socket.io-client';
import { Message, User } from '../types';

interface ServerConfig {
  userId: string;
  username: string;
}

class GlobalServerService {
  private socket: Socket | null = null;
  private config: ServerConfig | null = null;
  private isConnected = false;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private userCallbacks: ((users: User[]) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private onlineUsers: User[] = [];

  // Используем бесплатный Socket.IO сервер
  private serverUrl = 'https://nemo-global-server.onrender.com';

  async connect(config: ServerConfig): Promise<boolean> {
    this.config = config;
    
    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('Подключение к серверу не удалось, работаем локально');
          this.setupLocalMode();
          resolve(true);
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.setupSocketListeners();
          this.notifyConnectionChange(true);
          
          // Регистрируем пользователя
          this.socket!.emit('user:register', {
            id: config.userId,
            username: config.username,
            timestamp: Date.now()
          });
          
          console.log('✅ Подключен к глобальному серверу');
          resolve(true);
        });

        this.socket!.on('connect_error', () => {
          clearTimeout(timeout);
          console.log('Ошибка подключения, работаем локально');
          this.setupLocalMode();
          resolve(true);
        });
      });
    } catch (error) {
      console.log('Ошибка подключения, работаем локально');
      this.setupLocalMode();
      return true;
    }
  }

  private setupLocalMode() {
    // Локальный режим через BroadcastChannel
    const channel = new BroadcastChannel('nemo-messenger-local');
    
    channel.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'message':
          this.messageCallbacks.forEach(callback => callback(data));
          break;
        case 'user_list':
          this.userCallbacks.forEach(callback => callback(data));
          break;
      }
    };

    this.isConnected = true;
    this.notifyConnectionChange(true);
    
    // Объявляем о присутствии
    channel.postMessage({
      type: 'user_online',
      data: {
        id: this.config!.userId,
        username: this.config!.username,
        timestamp: Date.now()
      }
    });
    
    (this as any).localChannel = channel;
    console.log('🔄 Работаем в локальном режиме');
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifyConnectionChange(false);
      console.log('❌ Соединение потеряно');
    });

    this.socket.on('message:new', (message: Message) => {
      console.log('📨 Получено сообщение:', message);
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('users:list', (users: User[]) => {
      this.onlineUsers = users;
      this.userCallbacks.forEach(callback => callback(users));
    });

    this.socket.on('user:found', (response: { user: User | null }) => {
      if (response.user) {
        console.log('🔍 Найден пользователь:', response.user);
      }
    });
  }

  sendMessage(message: Message): boolean {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:send', {
        ...message,
        timestamp: new Date(),
        serverTimestamp: Date.now()
      });
      return true;
    } else if ((this as any).localChannel) {
      (this as any).localChannel.postMessage({
        type: 'message',
        data: {
          ...message,
          timestamp: new Date()
        }
      });
      return true;
    }
    return false;
  }

  searchUser(query: string): Promise<User | null> {
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        this.socket.emit('user:search', { 
          query, 
          requestId: Date.now().toString() 
        });
        
        const timeout = setTimeout(() => {
          resolve(null);
        }, 5000);
        
        this.socket.once('user:found', (response: { user: User | null }) => {
          clearTimeout(timeout);
          resolve(response.user);
        });
      } else {
        // Локальный поиск
        const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
        const foundUser = users.find((u: any) => 
          (u.username.toLowerCase() === query.toLowerCase() || u.id === query) && 
          !u.isDeleted && u.id !== this.config?.userId
        );
        
        if (foundUser) {
          resolve({
            id: foundUser.id,
            username: foundUser.username,
            isOnline: true,
            lastSeen: new Date()
          });
        } else {
          resolve(null);
        }
      }
    });
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
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if ((this as any).localChannel) {
      (this as any).localChannel.close();
    }
    this.isConnected = false;
    this.notifyConnectionChange(false);
  }

  isOnline(): boolean {
    return this.isConnected;
  }
}

export const globalServer = new GlobalServerService();