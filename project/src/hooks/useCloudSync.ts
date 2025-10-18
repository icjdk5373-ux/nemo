import { useState, useEffect } from 'react';
import { cloudSync } from '../services/cloudSync';
import { Message, User } from '../types';

export const useCloudSync = (currentUser: { id: string; username: string } | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const connectToCloud = async () => {
      setIsConnecting(true);
      setConnectionError(null);

      try {
        // Пробуем подключиться к облачному серверу
        const connected = await cloudSync.connect({
          serverUrl: 'wss://nemo-messenger-server.herokuapp.com', // Замените на ваш сервер
          userId: currentUser.id,
          username: currentUser.username
        });

        if (connected) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Ошибка подключения к облаку:', error);
        setConnectionError('Не удалось подключиться к серверу. Работаем в локальном режиме.');
      } finally {
        setIsConnecting(false);
      }
    };

    connectToCloud();

    // Слушаем изменения подключения
    cloudSync.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setConnectionError('Соединение потеряно. Пытаемся переподключиться...');
      } else {
        setConnectionError(null);
      }
    });

    return () => {
      cloudSync.disconnect();
    };
  }, [currentUser]);

  const sendCloudMessage = (message: Message): boolean => {
    return cloudSync.sendMessage(message);
  };

  const searchCloudUser = async (query: string): Promise<User | null> => {
    return await cloudSync.searchUser(query);
  };

  const getOnlineUsers = async (): Promise<User[]> => {
    return await cloudSync.getOnlineUsers();
  };

  const onCloudMessage = (callback: (message: Message) => void) => {
    cloudSync.onMessage(callback);
  };

  const onUserListUpdate = (callback: (users: User[]) => void) => {
    cloudSync.onUserListUpdate(callback);
  };

  return {
    isConnected,
    isConnecting,
    connectionError,
    sendCloudMessage,
    searchCloudUser,
    getOnlineUsers,
    onCloudMessage,
    onUserListUpdate
  };
};