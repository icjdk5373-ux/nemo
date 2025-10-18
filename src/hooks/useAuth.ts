import { useState, useEffect } from 'react';
import { globalDatabase } from '../services/globalDatabase';

interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  deviceType?: 'desktop' | 'mobile';
}

// Функция для генерации ТОЛЬКО числового ID
const generateNumericId = (): string => {
  return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{username: string, password: string, isRegister: boolean} | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('messenger_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Загружаем аватар и отображаемое имя
      const avatar = localStorage.getItem(`messenger_avatar_${userData.id}`);
      const displayName = localStorage.getItem(`messenger_display_name_${userData.id}`);
      
      setUser({
        ...userData,
        displayName: displayName || userData.username,
        avatar: avatar || undefined
      });
    }
    setIsLoading(false);
  }, []);

  const handleDeviceSelection = async (deviceType: 'desktop' | 'mobile') => {
    if (!pendingAuth) return;

    const { username, password, isRegister } = pendingAuth;
    
    if (isRegister) {
      await completeRegistration(username, password, deviceType);
    } else {
      await completeLogin(username, password, deviceType);
    }
    
    setShowDeviceSelection(false);
    setPendingAuth(null);
  };

  const completeLogin = async (username: string, password: string, deviceType: 'desktop' | 'mobile'): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const existingUser = users.find((u: any) => u.username === username && u.password === password && !u.isDeleted);
    
    if (existingUser) {
      // Обновляем тип устройства
      existingUser.deviceType = deviceType;
      existingUser.lastLoginDevice = deviceType;
      existingUser.lastLogin = new Date().toISOString();
      
      // Сохраняем обновленные данные
      const userIndex = users.findIndex((u: any) => u.id === existingUser.id);
      users[userIndex] = existingUser;
      localStorage.setItem('messenger_users', JSON.stringify(users));
      
      // Загружаем дополнительные данные пользователя
      const avatar = localStorage.getItem(`messenger_avatar_${existingUser.id}`);
      const displayName = localStorage.getItem(`messenger_display_name_${existingUser.id}`);
      
      const authUser = { 
        id: existingUser.id, 
        username: existingUser.username,
        displayName: displayName || existingUser.username,
        avatar: avatar || undefined,
        deviceType
      };
      
      setUser(authUser);
      localStorage.setItem('messenger_user', JSON.stringify(authUser));
      
      // Подключаемся к глобальной базе данных
      try {
        await globalDatabase.connect({
          userId: existingUser.id,
          username: existingUser.username,
          deviceType
        });
        console.log('✅ Подключен к глобальной БД при входе');
      } catch (error) {
        console.error('Ошибка подключения к глобальной БД:', error);
      }
      
      return true;
    }
    return false;
  };

  const completeRegistration = async (username: string, password: string, deviceType: 'desktop' | 'mobile'): Promise<boolean> => {
    if (username.trim().length < 3 || password.trim().length < 6) {
      return false;
    }

    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const existingUser = users.find((u: any) => u.username === username && !u.isDeleted);
    
    if (existingUser) {
      return false;
    }

    // Генерируем уникальный ЧИСЛОВОЙ ID
    let newId: string;
    do {
      newId = generateNumericId();
    } while (users.find((u: any) => u.id === newId));

    const newUser = {
      id: newId,
      username: username.trim(),
      password,
      deviceType,
      createdAt: new Date().toISOString(),
      lastLoginDevice: deviceType,
      isDeleted: false
    };
    
    users.push(newUser);
    
    // Сохраняем с принудительной записью
    try {
      localStorage.setItem('messenger_users', JSON.stringify(users));
      
      // Проверяем, что данные действительно сохранились
      const savedCheck = localStorage.getItem('messenger_users');
      const parsedCheck = JSON.parse(savedCheck || '[]');
      
      if (!parsedCheck.find((u: any) => u.id === newId)) {
        console.error('Ошибка сохранения пользователя');
        return false;
      }
      
      console.log('✅ Пользователь успешно зарегистрирован:', newUser);
      
    } catch (error) {
      console.error('Ошибка при сохранении в localStorage:', error);
      return false;
    }
    
    // Триггерим событие для синхронизации между вкладками
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_users',
      newValue: JSON.stringify(users)
    }));
    
    const authUser = { 
      id: newUser.id, 
      username: newUser.username,
      displayName: newUser.username,
      deviceType
    };
    
    setUser(authUser);
    localStorage.setItem('messenger_user', JSON.stringify(authUser));
    
    // Подключаемся к глобальной базе данных
    try {
      await globalDatabase.connect({
        userId: newUser.id,
        username: newUser.username,
        deviceType
      });
      console.log('✅ Подключен к глобальной БД при регистрации');
    } catch (error) {
      console.error('Ошибка подключения к глобальной БД:', error);
    }
    
    return true;
  };

  const login = (username: string, password: string): boolean => {
    // Сначала проверяем, существует ли пользователь
    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const existingUser = users.find((u: any) => u.username === username && u.password === password && !u.isDeleted);
    
    if (existingUser) {
      // Если у пользователя уже есть сохраненный тип устройства, используем его
      if (existingUser.deviceType) {
        completeLogin(username, password, existingUser.deviceType);
        return true;
      } else {
        // Показываем выбор устройства
        setPendingAuth({ username, password, isRegister: false });
        setShowDeviceSelection(true);
        return true;
      }
    }
    return false;
  };

  const register = (username: string, password: string): boolean => {
    if (username.trim().length < 3 || password.trim().length < 6) {
      return false;
    }

    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const existingUser = users.find((u: any) => u.username === username && !u.isDeleted);
    
    if (existingUser) {
      return false;
    }

    // Показываем выбор устройства для нового пользователя
    setPendingAuth({ username, password, isRegister: true });
    setShowDeviceSelection(true);
    return true;
  };

  const updateProfile = (newDisplayName: string, currentPassword: string, newPassword?: string, avatar?: string): boolean => {
    if (!user) return false;

    if (newDisplayName.trim().length < 1) {
      return false;
    }

    if (newPassword && newPassword.trim().length < 6) {
      return false;
    }

    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    
    if (userIndex === -1) return false;
    
    // Проверяем текущий пароль
    if (users[userIndex].password !== currentPassword) {
      return false;
    }

    // Обновляем пароль если указан новый
    if (newPassword) {
      users[userIndex].password = newPassword;
      localStorage.setItem('messenger_users', JSON.stringify(users));
    }

    // Сохраняем отображаемое имя отдельно
    localStorage.setItem(`messenger_display_name_${user.id}`, newDisplayName.trim());
    
    // Сохраняем аватар если указан
    if (avatar) {
      localStorage.setItem(`messenger_avatar_${user.id}`, avatar);
    }

    // Триггерим событие для синхронизации
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_users',
      newValue: JSON.stringify(users)
    }));

    // Обновляем текущего пользователя
    const updatedUser = { 
      id: user.id, 
      username: user.username, // Логин остается неизменным
      displayName: newDisplayName.trim(),
      avatar: avatar || user.avatar,
      deviceType: user.deviceType
    };
    setUser(updatedUser);
    localStorage.setItem('messenger_user', JSON.stringify(updatedUser));

    return true;
  };

  // ПОЛНОЕ УДАЛЕНИЕ АККАУНТА С ОСВОБОЖДЕНИЕМ ИМЕНИ И ЗАМЕНОЙ НА "[Удаленный аккаунт]"
  const deleteAccount = (username: string, password: string): boolean => {
    if (!user) return false;

    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    
    if (userIndex === -1) return false;
    
    // Проверяем логин и пароль
    if (users[userIndex].username !== username || users[userIndex].password !== password) {
      return false;
    }

    console.log('🗑️ НАЧИНАЕМ ПОЛНОЕ УДАЛЕНИЕ АККАУНТА С ОСВОБОЖДЕНИЕМ ИМЕНИ:', user.username);

    // 1. ЗАМЕНЯЕМ ПОЛЬЗОВАТЕЛЯ НА "[Удаленный аккаунт]" В СООБЩЕНИЯХ
    const messages = JSON.parse(localStorage.getItem('messenger_messages') || '[]');
    const updatedMessages = messages.map((msg: any) => {
      if (msg.senderId === user.id) {
        return {
          ...msg,
          senderId: 'deleted_user_' + user.id,
          senderUsername: '[Удаленный аккаунт]'
        };
      }
      if (msg.receiverId === user.id) {
        return {
          ...msg,
          receiverId: 'deleted_user_' + user.id,
          receiverUsername: '[Удаленный аккаунт]'
        };
      }
      return msg;
    });
    localStorage.setItem('messenger_messages', JSON.stringify(updatedMessages));
    console.log('✅ Сообщения обновлены - пользователь заменен на "[Удаленный аккаунт]"');

    // 2. СОЗДАЕМ ЗАПИСЬ УДАЛЕННОГО ПОЛЬЗОВАТЕЛЯ ДЛЯ ОТОБРАЖЕНИЯ В ЧАТАХ
    const deletedUserRecord = {
      id: 'deleted_user_' + user.id,
      username: '[Удаленный аккаунт]',
      isDeleted: true,
      originalId: user.id,
      originalUsername: user.username,
      deletedAt: new Date().toISOString(),
      password: '', // Пустой пароль, чтобы нельзя было войти
      deviceType: user.deviceType
    };
    users.push(deletedUserRecord);
    console.log('✅ Создана запись удаленного пользователя для отображения в чатах');

    // 3. ПОЛНОСТЬЮ УДАЛЯЕМ ОРИГИНАЛЬНОГО ПОЛЬЗОВАТЕЛЯ (ОСВОБОЖДАЕМ ИМЯ)
    users.splice(userIndex, 1);
    localStorage.setItem('messenger_users', JSON.stringify(users));
    console.log('✅ Оригинальный пользователь удален, имя освобождено для новой регистрации');

    // 4. УДАЛЯЕМ ВСЕ ПЕРСОНАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
    localStorage.removeItem(`messenger_avatar_${user.id}`);
    localStorage.removeItem(`messenger_display_name_${user.id}`);
    console.log('✅ Персональные данные удалены');

    // 5. ОБНОВЛЯЕМ ЗАБЛОКИРОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
    const blockedUsers = JSON.parse(localStorage.getItem('messenger_blocked_users') || '[]');
    const updatedBlockedUsers = blockedUsers.map((id: string) => 
      id === user.id ? 'deleted_user_' + user.id : id
    );
    localStorage.setItem('messenger_blocked_users', JSON.stringify(updatedBlockedUsers));
    console.log('✅ Обновлен список заблокированных пользователей');

    // 6. ОБНОВЛЯЕМ ИСТОРИЮ ПОИСКА
    const searchHistory = JSON.parse(localStorage.getItem('messenger_search_history') || '[]');
    const updatedSearchHistory = searchHistory.map((u: any) => 
      u.id === user.id ? { ...u, id: 'deleted_user_' + user.id, username: '[Удаленный аккаунт]', isDeleted: true } : u
    );
    localStorage.setItem('messenger_search_history', JSON.stringify(updatedSearchHistory));
    console.log('✅ Обновлена история поиска');

    // 7. ОЧИЩАЕМ АКТИВНЫЕ ЧАТЫ И ПЕРСИСТЕНТНОСТЬ
    localStorage.removeItem('nemo_active_chat');
    localStorage.removeItem('nemo_active_chat_protection');
    localStorage.removeItem('nemo_chat_minimized');
    console.log('✅ Очищены активные чаты');

    // 8. УДАЛЯЕМ ВСЕ КЭШИРОВАННЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
    Object.keys(localStorage).forEach(key => {
      if (key.includes(user.id) && !key.includes('deleted_user_')) {
        localStorage.removeItem(key);
        console.log(`✅ Удален кэш: ${key}`);
      }
    });

    // 9. ОТКЛЮЧАЕМСЯ ОТ ГЛОБАЛЬНОЙ БД
    globalDatabase.disconnect();
    console.log('✅ Отключен от глобальной БД');

    // 10. ТРИГГЕРИМ СОБЫТИЯ ДЛЯ СИНХРОНИЗАЦИИ МЕЖДУ ВКЛАДКАМИ
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_users',
      newValue: JSON.stringify(users)
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_messages',
      newValue: JSON.stringify(updatedMessages)
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_blocked_users',
      newValue: JSON.stringify(updatedBlockedUsers)
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'messenger_search_history',
      newValue: JSON.stringify(updatedSearchHistory)
    }));

    // 11. МГНОВЕННО ВЫХОДИМ ИЗ АККАУНТА
    setUser(null);
    localStorage.removeItem('messenger_user');
    console.log('✅ Выход из аккаунта выполнен');

    // 12. ПОКАЗЫВАЕМ УВЕДОМЛЕНИЕ О ПОЛНОМ УДАЛЕНИИ
    alert(`🗑️ АККАУНТ "${username}" ПОЛНОСТЬЮ УДАЛЕН!\n\n✅ Имя пользователя освобождено\n✅ У собеседников отображается "[Удаленный аккаунт]"\n✅ Вас нельзя найти по логину или ID\n\n🎉 Теперь имя "${username}" можно зарегистрировать заново!`);

    // 13. ЗАКРЫВАЕМ ПРИЛОЖЕНИЕ ИЛИ ПЕРЕЗАГРУЖАЕМ
    try {
      if (window.electronAPI) {
        // Если это Electron приложение, закрываем окно
        window.close();
      } else {
        // Если это веб-приложение, перезагружаем страницу для полной очистки
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      // Если не удается закрыть, просто перезагружаем
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }

    console.log('🎉 ПОЛНОЕ УДАЛЕНИЕ АККАУНТА ЗАВЕРШЕНО! ИМЯ ОСВОБОЖДЕНО!');
    return true;
  };

  const logout = () => {
    if (user) {
      globalDatabase.disconnect();
    }
    setUser(null);
    localStorage.removeItem('messenger_user');
  };

  const clearAllData = () => {
    globalDatabase.disconnect();
    localStorage.removeItem('messenger_user');
    localStorage.removeItem('messenger_users');
    localStorage.removeItem('messenger_messages');
    localStorage.removeItem('messenger_blocked_users');
    
    // Очищаем все аватары и отображаемые имена
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('messenger_avatar_') || key.startsWith('messenger_display_name_')) {
        localStorage.removeItem(key);
      }
    });
    
    setUser(null);
  };

  const exportData = () => {
    const data = {
      users: JSON.parse(localStorage.getItem('messenger_users') || '[]'),
      messages: JSON.parse(localStorage.getItem('messenger_messages') || '[]'),
      blockedUsers: JSON.parse(localStorage.getItem('messenger_blocked_users') || '[]'),
      currentUser: JSON.parse(localStorage.getItem('messenger_user') || 'null'),
      exportDate: new Date().toISOString()
    };

    // Добавляем аватары и отображаемые имена
    const avatars: Record<string, string> = {};
    const displayNames: Record<string, string> = {};
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('messenger_avatar_')) {
        const userId = key.replace('messenger_avatar_', '');
        avatars[userId] = localStorage.getItem(key) || '';
      }
      if (key.startsWith('messenger_display_name_')) {
        const userId = key.replace('messenger_display_name_', '');
        displayNames[userId] = localStorage.getItem(key) || '';
      }
    });

    data.avatars = avatars;
    data.displayNames = displayNames;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nemo-messenger-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { 
    user, 
    isLoading, 
    showDeviceSelection,
    login, 
    register, 
    updateProfile, 
    deleteAccount,
    logout, 
    clearAllData, 
    exportData,
    handleDeviceSelection
  };
};