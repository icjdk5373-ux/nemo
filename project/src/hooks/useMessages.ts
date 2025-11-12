import { useState, useEffect } from 'react';
import { Message, User } from '../types';
import { globalDatabase } from '../services/globalDatabase';

// Функция для воспроизведения звука уведомления
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Не удалось воспроизвести звук уведомления');
  }
};

export const useMessages = (currentUserId: string, currentUser: { id: string; username: string; deviceType?: 'desktop' | 'mobile' } | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<User[]>([]);

  // Подключаем к глобальной базе данных
  useEffect(() => {
    if (!currentUser) return;

    const connectToDatabase = async () => {
      setIsConnecting(true);
      setConnectionError(null);

      try {
        const connected = await globalDatabase.connect({
          userId: currentUser.id,
          username: currentUser.username,
          deviceType: currentUser.deviceType || 'desktop'
        });

        if (connected) {
          setIsCloudConnected(true);
        }
      } catch (error) {
        console.error('Ошибка подключения к глобальной БД:', error);
        setConnectionError('Работаем в локальном режиме');
      } finally {
        setIsConnecting(false);
      }
    };

    connectToDatabase();

    // Слушаем изменения подключения
    globalDatabase.onConnectionChange((connected) => {
      setIsCloudConnected(connected);
      if (!connected) {
        setConnectionError('Соединение потеряно');
      } else {
        setConnectionError(null);
      }
    });

    // Слушаем новые сообщения
    globalDatabase.onMessage((message: Message) => {
      const savedMessages = localStorage.getItem('messenger_messages');
      const currentMessages = savedMessages ? JSON.parse(savedMessages) : [];
      
      // Проверяем, не получали ли мы это сообщение ранее
      const exists = currentMessages.find((m: Message) => m.id === message.id);
      if (!exists) {
        const updatedMessages = [...currentMessages, message];
        
        setMessages(updatedMessages);
        localStorage.setItem('messenger_messages', JSON.stringify(updatedMessages));
        
        if (message.receiverId === currentUserId) {
          playNotificationSound();
        }
      }
    });

    // Слушаем обновления списка пользователей
    globalDatabase.onUserListUpdate((users) => {
      setOnlineUsers(users);
    });

    return () => {
      globalDatabase.disconnect();
    };
  }, [currentUser, currentUserId]);

  // Загружаем историю поиска из localStorage
  useEffect(() => {
    const savedSearchHistory = localStorage.getItem('messenger_search_history');
    if (savedSearchHistory) {
      try {
        const history = JSON.parse(savedSearchHistory);
        setSearchHistory(history);
      } catch (error) {
        console.error('Ошибка загрузки истории поиска:', error);
      }
    }
  }, []);

  // Функция для получения пользователей, с которыми текущий пользователь взаимодействовал
  const getInteractedUsers = () => {
    const savedMessages = localStorage.getItem('messenger_messages');
    const allMessages: Message[] = savedMessages ? JSON.parse(savedMessages) : [];
    
    const interactedUserIds = new Set<string>();
    
    allMessages.forEach(msg => {
      if (msg.senderId === currentUserId) {
        interactedUserIds.add(msg.receiverId);
      } else if (msg.receiverId === currentUserId) {
        interactedUserIds.add(msg.senderId);
      }
    });

    const savedUsers = localStorage.getItem('messenger_users');
    const allKnownUsers = [...searchHistory]; // Начинаем с истории поиска
    
    if (savedUsers) {
      const localUsers = JSON.parse(savedUsers);
      const relevantUsers = localUsers.filter((u: any) => 
        interactedUserIds.has(u.id) && u.id !== currentUserId
      );
      
      // Добавляем пользователей с которыми есть переписка
      relevantUsers.forEach((u: any) => {
        if (!allKnownUsers.find(existing => existing.id === u.id)) {
          allKnownUsers.push({
            id: u.id,
            username: u.username, // Может быть "[Удаленный аккаунт]" для удаленных пользователей
            isOnline: u.isDeleted ? false : onlineUsers.some(ou => ou.id === u.id),
            lastSeen: new Date(),
            deviceType: u.deviceType
          });
        }
      });
    }
    
    setUsers(allKnownUsers);
  };

  // Функция для поиска пользователя (исключаем удаленных пользователей)
  const searchUser = async (query: string): Promise<User | null> => {
    // Сначала пробуем найти в глобальной базе данных
    if (isCloudConnected) {
      try {
        const globalUser = await globalDatabase.searchUser(query);
        if (globalUser) {
          return globalUser;
        }
      } catch (error) {
        console.log('Ошибка поиска в глобальной БД:', error);
      }
    }

    // Локальный поиск (исключаем удаленных пользователей)
    const savedUsers = localStorage.getItem('messenger_users');
    if (!savedUsers) {
      return null;
    }

    const allUsers = JSON.parse(savedUsers);
    const foundUser = allUsers.find((u: any) => {
      const matchesUsername = u.username.toLowerCase() === query.toLowerCase();
      const matchesId = u.id === query;
      const isNotCurrentUser = u.id !== currentUserId;
      const isNotDeleted = !u.isDeleted && u.username !== '[Удаленный аккаунт]'; // Исключаем удаленных
      
      return (matchesUsername || matchesId) && isNotCurrentUser && isNotDeleted;
    });

    if (foundUser) {
      return {
        id: foundUser.id,
        username: foundUser.username,
        isOnline: onlineUsers.some(ou => ou.id === foundUser.id),
        lastSeen: new Date(),
        deviceType: foundUser.deviceType
      };
    }

    return null;
  };

  // Функция для добавления пользователя в список
  const addUserToList = (user: User) => {
    // Добавляем в основной список пользователей
    setUsers(prevUsers => {
      const exists = prevUsers.find(u => u.id === user.id);
      if (!exists) {
        return [...prevUsers, user];
      }
      return prevUsers;
    });

    // Добавляем в историю поиска
    setSearchHistory(prevHistory => {
      const exists = prevHistory.find(u => u.id === user.id);
      if (!exists) {
        const newHistory = [user, ...prevHistory].slice(0, 20); // Ограничиваем до 20 пользователей
        
        // Сохраняем в localStorage
        localStorage.setItem('messenger_search_history', JSON.stringify(newHistory));
        
        return newHistory;
      }
      return prevHistory;
    });
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem('messenger_messages');
    const currentMessages = savedMessages ? JSON.parse(savedMessages) : [];
    
    if (messages.length > 0 && currentMessages.length > messages.length) {
      const newMessages = currentMessages.slice(messages.length);
      const hasNewIncomingMessage = newMessages.some((msg: Message) => 
        msg.receiverId === currentUserId && msg.senderId !== currentUserId
      );
      
      if (hasNewIncomingMessage) {
        playNotificationSound();
      }
    }
    
    setMessages(currentMessages);
    getInteractedUsers();

    const savedBlockedUsers = localStorage.getItem('messenger_blocked_users');
    if (savedBlockedUsers) {
      setBlockedUsers(JSON.parse(savedBlockedUsers));
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'messenger_messages') {
        if (e.newValue) {
          const newMessages = JSON.parse(e.newValue);
          
          if (messages.length > 0 && newMessages.length > messages.length) {
            const addedMessages = newMessages.slice(messages.length);
            const hasNewIncoming = addedMessages.some((msg: Message) => 
              msg.receiverId === currentUserId && msg.senderId !== currentUserId
            );
            
            if (hasNewIncoming) {
              playNotificationSound();
            }
          }
          
          setMessages(newMessages);
          getInteractedUsers();
        }
      } else if (e.key === 'messenger_blocked_users') {
        if (e.newValue) {
          setBlockedUsers(JSON.parse(e.newValue));
        }
      } else if (e.key === 'messenger_users') {
        getInteractedUsers();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUserId, messages.length, onlineUsers]);

  const sendMessage = async (receiverId: string, content: string, type: 'text' | 'voice' = 'text') => {
    // Проверяем, есть ли пользователь в списке, если нет - добавляем
    const existingUser = users.find(u => u.id === receiverId);
    if (!existingUser) {
      const foundUser = await searchUser(receiverId);
      if (foundUser) {
        addUserToList(foundUser);
      }
    }

    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId: currentUserId,
      receiverId,
      content,
      timestamp: new Date(),
      isRead: false,
      delivered: true,
      type
    };

    // Сохраняем локально
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('messenger_messages', JSON.stringify(updatedMessages));
    
    // Отправляем в глобальную базу данных
    if (isCloudConnected) {
      const sent = await globalDatabase.sendMessage(newMessage);
      if (!sent) {
        console.log('Не удалось отправить сообщение в глобальную БД');
      }
    }
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_messages',
      newValue: JSON.stringify(updatedMessages)
    }));
  };

  const markAsRead = (messageIds: string[]) => {
    const updatedMessages = messages.map(msg => 
      messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
    );
    setMessages(updatedMessages);
    localStorage.setItem('messenger_messages', JSON.stringify(updatedMessages));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_messages',
      newValue: JSON.stringify(updatedMessages)
    }));
  };

  const deleteMessage = (messageId: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    localStorage.setItem('messenger_messages', JSON.stringify(updatedMessages));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_messages',
      newValue: JSON.stringify(updatedMessages)
    }));
  };

  const getConversation = (userId: string) => {
    const conversation = messages.filter(
      msg => 
        (msg.senderId === currentUserId && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === currentUserId)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const unreadIncoming = conversation.filter(msg => 
      msg.senderId === userId && msg.receiverId === currentUserId && !msg.isRead
    );
    
    if (unreadIncoming.length > 0) {
      markAsRead(unreadIncoming.map(msg => msg.id));
    }

    return conversation;
  };

  const getChats = () => {
    const chatMap = new Map();
    
    messages.forEach(msg => {
      const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      if (!chatMap.has(otherUserId)) {
        chatMap.set(otherUserId, []);
      }
      chatMap.get(otherUserId).push(msg);
    });

    return Array.from(chatMap.entries()).map(([userId, msgs]) => {
      const user = users.find(u => u.id === userId);
      const lastMessage = msgs[msgs.length - 1];
      const unreadCount = msgs.filter((msg: Message) => 
        msg.receiverId === currentUserId && !msg.isRead
      ).length;

      return {
        user,
        lastMessage,
        unreadCount
      };
    }).filter(chat => chat.user);
  };

  const blockUser = (userId: string) => {
    const updatedBlockedUsers = [...blockedUsers, userId];
    setBlockedUsers(updatedBlockedUsers);
    localStorage.setItem('messenger_blocked_users', JSON.stringify(updatedBlockedUsers));
  };

  const unblockUser = (userId: string) => {
    const updatedBlockedUsers = blockedUsers.filter(id => id !== userId);
    setBlockedUsers(updatedBlockedUsers);
    localStorage.setItem('messenger_blocked_users', JSON.stringify(updatedBlockedUsers));
  };

  const deleteChat = (userId: string) => {
    const updatedMessages = messages.filter(
      msg => !(
        (msg.senderId === currentUserId && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === currentUserId)
      )
    );
    setMessages(updatedMessages);
    localStorage.setItem('messenger_messages', JSON.stringify(updatedMessages));
    
    // НЕ удаляем пользователя из общего списка, только из чатов
    // setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_messages',
      newValue: JSON.stringify(updatedMessages)
    }));
  };

  const isUserBlocked = (userId: string) => {
    return blockedUsers.includes(userId);
  };

  // Функция для очистки истории поиска
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('messenger_search_history');
  };

  // Функция для удаления пользователя из истории поиска
  const removeFromSearchHistory = (userId: string) => {
    const newHistory = searchHistory.filter(u => u.id !== userId);
    setSearchHistory(newHistory);
    localStorage.setItem('messenger_search_history', JSON.stringify(newHistory));
  };

  return { 
    messages, 
    users, 
    onlineUsers,
    isCloudConnected,
    isConnecting,
    connectionError,
    searchHistory,
    sendMessage, 
    deleteMessage,
    getConversation, 
    getChats, 
    blockUser, 
    unblockUser, 
    deleteChat, 
    isUserBlocked,
    searchUser,
    addUserToList,
    clearSearchHistory,
    removeFromSearchHistory
  };
};