import { Message, User } from '../types';

interface DatabaseConfig {
  userId: string;
  username: string;
}

class RealTimeDatabaseService {
  private config: DatabaseConfig | null = null;
  private isConnected = false;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private userCallbacks: ((users: User[]) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private onlineUsers: User[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  // Используем Firebase Realtime Database REST API
  private databaseUrl = 'https://nemo-messenger-db-default-rtdb.firebaseio.com';

  async connect(config: DatabaseConfig): Promise<boolean> {
    this.config = config;
    
    try {
      // Регистрируем пользователя в базе данных
      await this.registerUser(config);
      
      // Запускаем синхронизацию
      this.startSync();
      
      this.isConnected = true;
      this.notifyConnectionChange(true);
      
      console.log('✅ Подключен к глобальной базе данных');
      return true;
    } catch (error) {
      console.error('Ошибка подключения к БД:', error);
      this.setupLocalMode();
      return true;
    }
  }

  private async registerUser(config: DatabaseConfig) {
    const userData = {
      id: config.userId,
      username: config.username,
      isOnline: true,
      lastSeen: Date.now(),
      registeredAt: Date.now()
    };

    try {
      const response = await fetch(`${this.databaseUrl}/users/${config.userId}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Ошибка регистрации пользователя');
      }

      console.log('👤 Пользователь зарегистрирован в БД');
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  private startSync() {
    // Синхронизация каждые 2 секунды
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncMessages();
        await this.syncUsers();
        await this.updateUserActivity();
      } catch (error) {
        console.error('Ошибка синхронизации:', error);
      }
    }, 2000);
  }

  private async syncMessages() {
    if (!this.config) return;

    try {
      // Получаем новые сообщения для текущего пользователя
      const response = await fetch(`${this.databaseUrl}/messages.json?orderBy="receiverId"&equalTo="${this.config.userId}"`);
      
      if (response.ok) {
        const messages = await response.json();
        
        if (messages) {
          Object.values(messages).forEach((message: any) => {
            // Проверяем, не получали ли мы это сообщение ранее
            const localMessages = JSON.parse(localStorage.getItem('messenger_messages') || '[]');
            const exists = localMessages.find((m: Message) => m.id === message.id);
            
            if (!exists) {
              // Новое сообщение
              this.messageCallbacks.forEach(callback => callback(message));
              
              // Сохраняем локально
              localMessages.push(message);
              localStorage.setItem('messenger_messages', JSON.stringify(localMessages));
            }
          });
        }
      }
    } catch (error) {
      console.error('Ошибка синхронизации сообщений:', error);
    }
  }

  private async syncUsers() {
    try {
      const response = await fetch(`${this.databaseUrl}/users.json`);
      
      if (response.ok) {
        const users = await response.json();
        
        if (users) {
          const onlineUsers: User[] = Object.values(users)
            .filter((user: any) => user.isOnline && user.id !== this.config?.userId)
            .map((user: any) => ({
              id: user.id,
              username: user.username,
              isOnline: true,
              lastSeen: new Date(user.lastSeen)
            }));
          
          this.onlineUsers = onlineUsers;
          this.userCallbacks.forEach(callback => callback(onlineUsers));
        }
      }
    } catch (error) {
      console.error('Ошибка синхронизации пользователей:', error);
    }
  }

  private async updateUserActivity() {
    if (!this.config) return;

    try {
      await fetch(`${this.databaseUrl}/users/${this.config.userId}/lastSeen.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Date.now())
      });
    } catch (error) {
      console.error('Ошибка обновления активности:', error);
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
    
    (this as any).localChannel = channel;
    console.log('🔄 Работаем в локальном режиме');
  }

  async sendMessage(message: Message): Promise<boolean> {
    if (!this.config) return false;

    try {
      // Отправляем в базу данных
      const response = await fetch(`${this.databaseUrl}/messages/${message.id}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...message,
          timestamp: Date.now(),
          serverTimestamp: Date.now()
        })
      });

      if (response.ok) {
        console.log('📤 Сообщение отправлено в БД');
        return true;
      } else {
        throw new Error('Ошибка отправки сообщения');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      
      // Fallback на локальный режим
      if ((this as any).localChannel) {
        (this as any).localChannel.postMessage({
          type: 'message',
          data: message
        });
        return true;
      }
      
      return false;
    }
  }

  async searchUser(query: string): Promise<User | null> {
    try {
      // Поиск по имени пользователя
      const response = await fetch(`${this.databaseUrl}/users.json?orderBy="username"&equalTo="${query}"`);
      
      if (response.ok) {
        const users = await response.json();
        
        if (users) {
          const foundUser = Object.values(users)[0] as any;
          if (foundUser && foundUser.id !== this.config?.userId) {
            return {
              id: foundUser.id,
              username: foundUser.username,
              isOnline: foundUser.isOnline || false,
              lastSeen: new Date(foundUser.lastSeen || Date.now())
            };
          }
        }
      }

      // Поиск по ID
      const idResponse = await fetch(`${this.databaseUrl}/users/${query}.json`);
      
      if (idResponse.ok) {
        const user = await idResponse.json();
        
        if (user && user.id !== this.config?.userId) {
          return {
            id: user.id,
            username: user.username,
            isOnline: user.isOnline || false,
            lastSeen: new Date(user.lastSeen || Date.now())
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Ошибка поиска пользователя:', error);
      
      // Локальный поиск
      const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
      const foundUser = users.find((u: any) => 
        (u.username.toLowerCase() === query.toLowerCase() || u.id === query) && 
        !u.isDeleted && u.id !== this.config?.userId
      );
      
      if (foundUser) {
        return {
          id: foundUser.id,
          username: foundUser.username,
          isOnline: true,
          lastSeen: new Date()
        };
      }
      
      return null;
    }
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

    if ((this as any).localChannel) {
      (this as any).localChannel.close();
    }

    // Помечаем пользователя как оффлайн
    if (this.config) {
      fetch(`${this.databaseUrl}/users/${this.config.userId}/isOnline.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(false)
      }).catch(() => {});
    }

    this.isConnected = false;
    this.notifyConnectionChange(false);
    console.log('🔌 Отключен от БД');
  }

  isOnline(): boolean {
    return this.isConnected;
  }
}

export const realTimeDatabase = new RealTimeDatabaseService();