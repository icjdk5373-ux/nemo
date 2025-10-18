import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DeviceSelection } from './components/DeviceSelection';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { Sidebar } from './components/Sidebar';
import { WaterEffect } from './components/WaterEffect';
import { CloudStatus } from './components/CloudStatus';
import { useAuth } from './hooks/useAuth';
import { useMessages } from './hooks/useMessages';

function App() {
  const { 
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
  } = useAuth();
  const { 
    users, 
    onlineUsers,
    isCloudConnected,
    isConnecting,
    connectionError,
    sendMessage, 
    deleteMessage,
    getConversation, 
    getChats, 
    blockUser, 
    unblockUser, 
    deleteChat, 
    isUserBlocked,
    searchUser,
    addUserToList
  } = useMessages(user?.id || '', user);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [chatPersistence, setChatPersistence] = useState<{
    isActive: boolean;
    userId: string | null;
    timestamp: number;
    stabilityScore: number;
  }>({
    isActive: false,
    userId: null,
    timestamp: 0,
    stabilityScore: 0
  });

  // Определяем размер экрана
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && selectedUserId) {
        setShowChatList(false);
      } else if (!mobile) {
        setShowChatList(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedUserId]);

  // УЛУЧШЕННАЯ система персистентности чата
  useEffect(() => {
    if (selectedUserId) {
      // Активируем персистентность чата
      setChatPersistence({
        isActive: true,
        userId: selectedUserId,
        timestamp: Date.now(),
        stabilityScore: 100
      });

      // Сохраняем в localStorage для восстановления после перезагрузки
      localStorage.setItem('nemo_active_chat', JSON.stringify({
        userId: selectedUserId,
        timestamp: Date.now(),
        stabilityScore: 100
      }));

      // Устанавливаем интервал "сердцебиения" чата
      const heartbeat = setInterval(() => {
        if (selectedUserId) {
          // Обновляем timestamp активности и увеличиваем стабильность
          setChatPersistence(prev => ({
            ...prev,
            timestamp: Date.now(),
            stabilityScore: Math.min(prev.stabilityScore + 5, 100)
          }));
          
          // Обновляем localStorage
          localStorage.setItem('nemo_active_chat', JSON.stringify({
            userId: selectedUserId,
            timestamp: Date.now(),
            stabilityScore: 100
          }));
        }
      }, 3000); // Каждые 3 секунды

      // Дополнительная стабилизация каждые 10 секунд
      const stabilizer = setInterval(() => {
        if (selectedUserId) {
          // Мягкое "касание" для поддержания активности
          const event = new CustomEvent('chatStabilize', {
            detail: { userId: selectedUserId, timestamp: Date.now() }
          });
          window.dispatchEvent(event);
        }
      }, 10000);

      return () => {
        clearInterval(heartbeat);
        clearInterval(stabilizer);
      };
    } else {
      // Деактивируем персистентность
      setChatPersistence({
        isActive: false,
        userId: null,
        timestamp: 0,
        stabilityScore: 0
      });
      localStorage.removeItem('nemo_active_chat');
    }
  }, [selectedUserId]);

  // УБИРАЕМ автовосстановление чата при загрузке - чаты не должны свапаться
  // useEffect(() => {
  //   if (user && users.length > 0) {
  //     const savedChat = localStorage.getItem('nemo_active_chat');
  //     if (savedChat) {
  //       try {
  //         const { userId, timestamp } = JSON.parse(savedChat);
  //         // Восстанавливаем чат если он был активен менее 1 часа назад
  //         if (Date.now() - timestamp < 3600000) {
  //           const userExists = users.find(u => u.id === userId);
  //           if (userExists) {
  //             setSelectedUserId(userId);
  //             if (isMobile) {
  //               setShowChatList(false);
  //             }
  //           }
  //         }
  //       } catch (error) {
  //         console.log('Ошибка восстановления чата:', error);
  //       }
  //     }
  //   }
  // }, [user, users, isMobile]);

  // Предотвращение случайного закрытия чата
  useEffect(() => {
    if (!chatPersistence.isActive) return;

    const preventAccidentalClose = (e: BeforeUnloadEvent) => {
      // Предупреждаем о закрытии если чат активен
      if (chatPersistence.isActive && selectedUserId) {
        e.preventDefault();
        e.returnValue = 'У вас открыт активный чат. Вы уверены, что хотите закрыть приложение?';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && chatPersistence.isActive) {
        // Сохраняем состояние при сворачивании
        localStorage.setItem('nemo_chat_minimized', JSON.stringify({
          userId: selectedUserId,
          timestamp: Date.now()
        }));
      } else if (!document.hidden && chatPersistence.isActive) {
        // Восстанавливаем при разворачивании
        const minimized = localStorage.getItem('nemo_chat_minimized');
        if (minimized) {
          try {
            const { userId } = JSON.parse(minimized);
            if (userId && !selectedUserId) {
              setSelectedUserId(userId);
              if (isMobile) {
                setShowChatList(false);
              }
            }
          } catch (error) {
            console.log('Ошибка восстановления свернутого чата:', error);
          }
        }
      }
    };

    // Обработчик стабилизации
    const handleChatStabilize = (e: CustomEvent) => {
      setChatPersistence(prev => ({
        ...prev,
        timestamp: e.detail.timestamp,
        stabilityScore: Math.min(prev.stabilityScore + 10, 100)
      }));
    };

    window.addEventListener('beforeunload', preventAccidentalClose);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('chatStabilize', handleChatStabilize as EventListener);

    return () => {
      window.removeEventListener('beforeunload', preventAccidentalClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('chatStabilize', handleChatStabilize as EventListener);
    };
  }, [chatPersistence.isActive, selectedUserId, isMobile]);

  // Обработка URL параметров для прямых ссылок на аккаунты
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUser = urlParams.get('user');
    const targetId = urlParams.get('id');
    
    if (targetUser && targetId && user) {
      searchUser(targetUser).then(foundUser => {
        if (foundUser && foundUser.id === targetId) {
          const alreadyKnown = users.find(u => u.id === foundUser.id);
          if (!alreadyKnown) {
            addUserToList(foundUser);
          }
          setSelectedUserId(foundUser.id);
          if (isMobile) {
            setShowChatList(false);
          }
          
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, [user, searchUser, addUserToList, users, isMobile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative">
        <WaterEffect />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white animate-pulse">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (showDeviceSelection) {
    return (
      <div className="relative min-h-screen bg-transparent">
        <WaterEffect />
        <DeviceSelection onDeviceSelect={handleDeviceSelection} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-transparent">
        <WaterEffect />
        <AuthScreen onLogin={login} onRegister={register} />
      </div>
    );
  }

  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;
  const conversation = selectedUserId ? getConversation(selectedUserId) : [];
  const chats = getChats();

  const handleSendMessage = (content: string, type: 'text' | 'voice' = 'text') => {
    if (selectedUserId) {
      sendMessage(selectedUserId, content, type);
      
      // Обновляем активность чата при отправке сообщения
      setChatPersistence(prev => ({
        ...prev,
        timestamp: Date.now(),
        stabilityScore: 100
      }));
    }
  };

  const handleDeleteChat = (userId: string) => {
    deleteChat(userId);
    if (selectedUserId === userId) {
      // Очищаем персистентность при удалении чата
      setChatPersistence({
        isActive: false,
        userId: null,
        timestamp: 0,
        stabilityScore: 0
      });
      localStorage.removeItem('nemo_active_chat');
      
      setSelectedUserId(null);
      if (isMobile) {
        setShowChatList(true);
      }
    }
  };

  const handleSelectChat = (userId: string) => {
    // ПРОВЕРКА: нельзя выбрать чат с самим собой
    if (userId === user.id) {
      alert('Нельзя открыть чат с самим собой');
      return;
    }

    setSelectedUserId(userId);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToChats = () => {
    // НЕ очищаем персистентность при возврате к списку чатов
    // Чат остается "активным" в фоне
    setSelectedUserId(null);
    setShowChatList(true);
  };

  return (
    <div className="h-screen bg-transparent flex overflow-hidden relative animate-messenger-entrance">
      <WaterEffect />
      
      {/* Статус облачного подключения - УБРАН */}
      
      <div className="flex w-full relative z-10">
        {/* Sidebar - скрыт на мобильных */}
        {!isMobile && (
          <Sidebar 
            user={user} 
            onLogout={logout}
            onUpdateProfile={updateProfile}
            onClearData={clearAllData}
            onExportData={exportData}
            onDeleteAccount={deleteAccount}
          />
        )}
        
        {/* Chat List - адаптивная ширина */}
        <div className={`${
          isMobile 
            ? (showChatList ? 'w-full' : 'hidden') 
            : 'w-80'
        } transition-all duration-300`}>
          <ChatList
            chats={chats}
            users={users}
            onlineUsers={onlineUsers}
            currentUserId={user.id}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedUserId || undefined}
            searchUser={searchUser}
            addUserToList={addUserToList}
            isCloudConnected={isCloudConnected}
            isMobile={isMobile}
            user={user}
            onLogout={logout}
            onUpdateProfile={updateProfile}
            onClearData={clearAllData}
            onExportData={exportData}
            onDeleteAccount={deleteAccount}
          />
        </div>
        
        {/* Chat Window - адаптивная ширина */}
        <div className={`${
          isMobile 
            ? (showChatList ? 'hidden' : 'w-full') 
            : 'flex-1'
        } transition-all duration-300`}>
          <ChatWindow
            selectedUser={selectedUser}
            messages={conversation}
            currentUserId={user.id}
            onSendMessage={handleSendMessage}
            onBlockUser={blockUser}
            onUnblockUser={unblockUser}
            onDeleteChat={handleDeleteChat}
            onDeleteMessage={deleteMessage}
            isUserBlocked={selectedUserId ? isUserBlocked(selectedUserId) : false}
            isCloudConnected={isCloudConnected}
            isMobile={isMobile}
            onBack={handleBackToChats}
            chatPersistence={chatPersistence}
          />
        </div>
      </div>
      
      {/* Индикатор активного чата - ПОДНЯТ ВЫШЕ */}
      {chatPersistence.isActive && selectedUserId && (
        <div className="fixed bottom-20 left-6 z-50 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm animate-pulse shadow-lg border border-blue-500/30">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            <span className="font-medium">💬 Чат активен</span>
            <div className="text-xs opacity-75">
              {Math.round(chatPersistence.stabilityScore)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;