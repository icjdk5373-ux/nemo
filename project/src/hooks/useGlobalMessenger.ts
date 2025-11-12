import { useState, useEffect } from 'react';
import { globalServer } from '../services/globalServer';
import { Message, User } from '../types';

export const useGlobalMessenger = (currentUser: { id: string; username: string } | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const connectToServer = async () => {
      setIsConnecting(true);
      setConnectionError(null);

      try {
        const connected = await globalServer.connect({
          userId: currentUser.id,
          username: currentUser.username
        });

        if (connected) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Ошибка подключения:', error);
        setConnectionError('Работаем в локальном режиме');
      } finally {
        setIsConnecting(false);
      }
    };

    connectToServer();

    // Слушаем изменения подключения
    globalServer.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setConnectionError('Соединение потеряно');
      } else {
        setConnectionError(null);
      }
    });

    // Слушаем обновления списка пользователей
    globalServer.onUserListUpdate((users) => {
      setOnlineUsers(users);
    });

    return () => {
      globalServer.disconnect();
    };
  }, [currentUser]);

  const sendGlobalMessage = (message: Message): boolean => {
    return globalServer.sendMessage(message);
  };

  const searchGlobalUser = async (query: string): Promise<User | null> => {
    return await globalServer.searchUser(query);
  };

  const getGlobalOnlineUsers = (): User[] => {
    return globalServer.getOnlineUsers();
  };

  const onGlobalMessage = (callback: (message: Message) => void) => {
    globalServer.onMessage(callback);
  };

  return {
    isConnected,
    isConnecting,
    connectionError,
    onlineUsers,
    sendGlobalMessage,
    searchGlobalUser,
    getGlobalOnlineUsers,
    onGlobalMessage
  };
};