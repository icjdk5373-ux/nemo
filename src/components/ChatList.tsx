import React, { useState } from 'react';
import { Search, Plus, MessageCircle, Circle, User, Hash, ArrowRight, HelpCircle, Fish, Grid3X3, List, ArrowLeft, Wifi, WifiOff, X, Globe, Sparkles, Menu, LogOut, Settings, History, Trash2 } from 'lucide-react';
import { User as UserType } from '../types';
import { Sidebar } from './Sidebar';

interface ChatListProps {
  chats: any[];
  users: UserType[];
  onlineUsers: UserType[];
  currentUserId: string;
  onSelectChat: (userId: string) => void;
  selectedChatId?: string;
  searchUser: (query: string) => Promise<UserType | null>;
  addUserToList: (user: UserType) => void;
  isCloudConnected: boolean;
  isMobile?: boolean;
  user?: { id: string; username: string; displayName?: string; avatar?: string };
  onLogout?: () => void;
  onUpdateProfile?: (newDisplayName: string, currentPassword: string, newPassword?: string, avatar?: string) => boolean;
  onClearData?: () => void;
  onExportData?: () => void;
  onDeleteAccount?: (username: string, password: string) => boolean;
}

// Генератор красивых аватарок (упрощенная версия)
const generateMiniAvatar = (username: string) => {
  const colors = [
    ['#FF6B6B', '#4ECDC4'],
    ['#96CEB4', '#FFEAA7'],
    ['#74B9FF', '#A29BFE'],
    ['#FDCB6E', '#E17055'],
    ['#6C5CE7', '#FD79A8'],
    ['#00CEC9', '#55A3FF']
  ];
  
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorSet = colors[Math.abs(hash) % colors.length];
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorSet[0]};stop-opacity:1" />
          <stop offset="" style="stop-color:${colorSet[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#grad${hash})"/>
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <text x="24" y="30" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial, sans-serif">${username.charAt(0).toUpperCase()}</text>
    </svg>
  `)}`;
};

export const ChatList: React.FC<ChatListProps> = ({ 
  chats, 
  users, 
  onlineUsers,
  currentUserId, 
  onSelectChat, 
  selectedChatId,
  searchUser,
  addUserToList,
  isCloudConnected,
  isMobile = false,
  user,
  onLogout,
  onUpdateProfile,
  onClearData,
  onExportData,
  onDeleteAccount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // Получаем историю поиска из localStorage
  const getSearchHistory = (): UserType[] => {
    try {
      const history = localStorage.getItem('messenger_search_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  };

  const searchHistory = getSearchHistory();

  // Поиск среди уже известных пользователей
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return false;
    
    return (
      user.username.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    );
  });

  // Глобальный поиск нового пользователя
  const handleGlobalSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const foundUser = await searchUser(query);
      if (foundUser) {
        const alreadyKnown = users.find(u => u.id === foundUser.id);
        if (!alreadyKnown) {
          setSearchResults([foundUser]);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Выполняем поиск при изменении запроса
  React.useEffect(() => {
    if (showUserSearch && searchQuery.trim()) {
      const timeoutId = setTimeout(handleGlobalSearch, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, showUserSearch]);

  const filteredChats = chats.filter(chat =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const handleUserSelect = (user: UserType) => {
    // ПРОВЕРКА: нельзя выбрать самого себя
    if (user.id === currentUserId) {
      alert('Нельзя добавить самого себя в чаты');
      return;
    }

    const alreadyKnown = users.find(u => u.id === user.id);
    if (!alreadyKnown) {
      addUserToList(user);
    }
    
    onSelectChat(user.id);
    setShowUserSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchHistory(false);
  };

  const handleIdSearch = async () => {
    const trimmedId = idInput.trim();
    if (!trimmedId) return;

    setIsSearching(true);
    try {
      const foundUser = await searchUser(trimmedId);
      if (foundUser) {
        handleUserSelect(foundUser);
        setShowIdSearch(false);
        setIdInput('');
      } else {
        alert('Пользователь с таким ID не найден');
      }
    } catch (error) {
      alert('Ошибка поиска пользователя');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBackToChats = () => {
    setShowUserSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowIdSearch(false);
    setIdInput('');
    setShowSearchHistory(false);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('messenger_search_history');
    setShowSearchHistory(false);
  };

  const removeFromHistory = (userId: string) => {
    const history = getSearchHistory();
    const newHistory = history.filter(u => u.id !== userId);
    localStorage.setItem('messenger_search_history', JSON.stringify(newHistory));
  };

  const isSearchActive = searchQuery.trim().length > 0;
  const hasResults = filteredUsers.length > 0 || searchResults.length > 0;

  // Функция для получения аватарки пользователя
  const getUserAvatar = (user: UserType) => {
    if (user.username === '[Удаленный аккаунт]') {
      return (
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-800 border-2 border-gray-600 relative animate-pulse">
          <div className="relative">
            <img 
              src="/image copy copy copy.png" 
              alt="Deleted Nemo" 
              className="w-8 h-8 object-contain filter grayscale brightness-50 opacity-70"
            />
            <div className="absolute top-1 left-2 w-2 h-2">
              <X className="w-2 h-2 text-red-500 stroke-[3]" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gray-900/50 rounded-full"></div>
        </div>
      );
    }
    
    const savedAvatar = localStorage.getItem(`messenger_avatar_${user.id}`);
    if (savedAvatar) {
      return (
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-110 border-2 border-gray-500">
          <img 
            src={savedAvatar} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    const generatedAvatar = generateMiniAvatar(user.username);
    return (
      <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-110 border-2 border-gray-500/30">
        <img 
          src={generatedAvatar} 
          alt="Generated Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  // Проверяем, онлайн ли пользователь
  const isUserOnline = (user: UserType) => {
    if (isCloudConnected) {
      return onlineUsers.some(ou => ou.id === user.id);
    }
    return user.isOnline;
  };

  // Компонент чата в сетке
  const ChatGridItem = ({ chat }: { chat: any }) => (
    <div
      onClick={() => onSelectChat(chat.user.id)}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
        selectedChatId === chat.user.id 
          ? 'bg-gradient-to-br from-gray-700/80 to-gray-600/80 border-2 border-gray-500/50 shadow-xl' 
          : 'bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/30'
      } backdrop-blur-sm animate-fade-in`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
          {getUserAvatar(chat.user)}
          <Circle 
            className={`absolute -bottom-1 -right-1 w-4 h-4 ${
              isUserOnline(chat.user) ? 'text-green-400 fill-current' : 'text-gray-600 fill-current'
            }`} 
          />
          {chat.unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
              {chat.unreadCount}
            </div>
          )}
        </div>
        
        <div className="w-full">
          <h3 className="font-semibold text-white truncate text-sm mb-1">{chat.user.username}</h3>
          <p className="text-xs text-gray-400 truncate">
            {chat.lastMessage?.type === 'voice' ? 'Голосовое' : chat.lastMessage?.content || 'Нет сообщений'}
          </p>
          {chat.lastMessage && (
            <span className="text-xs text-gray-500 mt-1 block">
              {formatTime(chat.lastMessage.timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${isMobile ? 'w-full' : 'w-80'} bg-black/30 backdrop-blur-sm border-r border-gray-600/30 flex flex-col animate-slide-in-left`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-600/30 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {showUserSearch && (
              <button
                onClick={handleBackToChats}
                className="p-2 mr-2 hover:bg-gray-700/50 rounded-lg transition-all duration-300 transform hover:scale-105"
                title="Назад к чатам"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h1 className="text-xl font-bold text-white flex items-center">
              <MessageCircle className="w-6 h-6 mr-2 text-blue-400 animate-pulse" />
              {showUserSearch ? 'Поиск друзей' : 'Чаты'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* Cloud status indicator */}
            <div className="flex items-center">
              {isCloudConnected ? (
                <div className="relative">
                  <Globe className="w-4 h-4 text-green-400 animate-pulse" title="Подключено к глобальному серверу" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                </div>
              ) : (
                <WifiOff className="w-4 h-4 text-yellow-400" title="Локальный режим" />
              )}
            </div>
            
            {/* Mobile menu button */}
            {isMobile && user && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg transition-all duration-300 transform hover:scale-105 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
                title="Меню"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* View Mode Toggle */}
            {!showUserSearch && filteredChats.length > 0 && !isMobile && (
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gray-600/50 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Список"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gray-600/50 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Сетка"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                showUserSearch 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
              }`}
              title="Найти пользователя"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          {showUserSearch ? (
            <div className="relative">
              <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400 animate-pulse" />
              <input
                type="text"
                placeholder="Поиск по имени или ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 shadow-lg backdrop-blur-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {searchHistory.length > 0 && (
                  <button
                    onClick={() => setShowSearchHistory(!showSearchHistory)}
                    className="p-1 hover:bg-gray-600/50 rounded transition-all duration-300"
                    title="История поиска"
                  >
                    <History className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                  </button>
                )}
                {isCloudConnected && (
                  <Globe className="w-4 h-4 text-green-400 animate-pulse" title="Глобальный поиск" />
                )}
              </div>
            </div>
          ) : (
            <>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск чатов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
            </>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && showMobileMenu && user && (
        <div className="absolute top-full left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-b border-gray-600/30 z-50 animate-slide-down">
          <Sidebar 
            user={user} 
            onLogout={() => {
              setShowMobileMenu(false);
              onLogout?.();
            }}
            onUpdateProfile={(newDisplayName, currentPassword, newPassword, avatar) => {
              const result = onUpdateProfile?.(newDisplayName, currentPassword, newPassword, avatar) || false;
              if (result) setShowMobileMenu(false);
              return result;
            }}
            onClearData={() => {
              setShowMobileMenu(false);
              onClearData?.();
            }}
            onExportData={() => {
              setShowMobileMenu(false);
              onExportData?.();
            }}
            onDeleteAccount={(username, password) => {
              const result = onDeleteAccount?.(username, password) || false;
              if (result) setShowMobileMenu(false);
              return result;
            }}
            isMobile={true}
          />
        </div>
      )}

      {/* Chat/User List */}
      <div className="flex-1 overflow-y-auto">
        {showUserSearch ? (
          <div className="p-2">
            {/* История поиска */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30 animate-scale-in backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    История поиска
                  </h3>
                  <button
                    onClick={clearSearchHistory}
                    className="p-1 hover:bg-gray-600/50 rounded transition-all duration-300"
                    title="Очистить историю"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchHistory.map((historyUser) => (
                    <div
                      key={historyUser.id}
                      onClick={() => handleUserSelect(historyUser)}
                      className="flex items-center p-2 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-gray-600/30 animate-fade-in backdrop-blur-sm"
                    >
                      <div className="relative">
                        {getUserAvatar(historyUser)}
                        <Circle 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 ${
                            isUserOnline(historyUser) ? 'text-green-400 fill-current' : 'text-gray-600 fill-current'
                          }`} 
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-white text-sm">{historyUser.username}</h3>
                          <span className="text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded">История</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          <span>{isUserOnline(historyUser) ? 'В сети' : 'Не в сети'}</span>
                          <span className="flex items-center">
                            <Hash className="w-3 h-3 mr-1" />
                            {historyUser.id}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(historyUser.id);
                        }}
                        className="p-1 hover:bg-red-600/50 rounded transition-all duration-300"
                        title="Удалить из истории"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ID Search Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowIdSearch(!showIdSearch)}
                className="w-full p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-between border border-gray-600/30 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center">
                  <Hash className="w-5 h-5 mr-3 text-blue-400" />
                  <span className="text-white">Найти по ID</span>
                </div>
                <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showIdSearch ? 'rotate-90' : ''}`} />
              </button>
              
              {showIdSearch && (
                <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30 animate-scale-in backdrop-blur-sm">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Введите ID пользователя..."
                      value={idInput}
                      onChange={(e) => setIdInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm backdrop-blur-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleIdSearch()}
                    />
                    <button
                      onClick={handleIdSearch}
                      disabled={!idInput.trim() || isSearching}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-600 disabled:opacity-50 text-white rounded transition-all duration-300 text-sm transform hover:scale-105 flex items-center shadow-lg"
                    >
                      {isSearching ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Найти'
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Введите точный ID пользователя для начала чата
                  </p>
                </div>
              )}
            </div>

            {/* Search status */}
            <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-sm">
                {isCloudConnected ? (
                  <>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-green-400" />
                      <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-green-300 animate-ping" />
                    </div>
                    <span className="text-green-300 font-medium">Глобальный поиск активен</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300">Только локальный поиск</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {isCloudConnected 
                  ? 'Найдите любого пользователя в мире по имени или ID'
                  : 'Поиск среди зарегистрированных пользователей на этом устройстве'
                }
              </div>
            </div>

            {!isSearchActive && !showSearchHistory ? (
              <div className="text-center py-8">
                <div className="relative mb-4">
                  <HelpCircle className="w-12 h-12 text-gray-600 mx-auto animate-bounce" />
                  {isCloudConnected && (
                    <div className="absolute -top-1 -right-1">
                      <Globe className="w-4 h-4 text-green-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <p className="text-gray-400 mb-2 font-medium">
                  {isCloudConnected ? 'Глобальный поиск пользователей' : 'Локальный поиск пользователей'}
                </p>
                <p className="text-sm text-gray-500 px-4 mb-4">
                  {isCloudConnected 
                    ? 'Найдите любого пользователя онлайн по имени или ID'
                    : 'Найдите зарегистрированных пользователей на этом устройстве'
                  }
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <User className="w-3 h-3" />
                    <span>По имени: pepe</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Hash className="w-3 h-3" />
                    <span>По ID: 1234567890</span>
                  </div>
                </div>
              </div>
            ) : !hasResults && !isSearching && !showSearchHistory ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">Пользователь не найден</p>
                <p className="text-sm text-gray-500 px-4">
                  {isCloudConnected 
                    ? 'Попробуйте другое имя или ID. Возможно, пользователь не в сети.'
                    : 'Попробуйте другое имя или ID'
                  }
                </p>
              </div>
            ) : isSearching ? (
              <div className="text-center py-8">
                <div className="relative mb-3">
                  <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  {isCloudConnected && (
                    <Globe className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-400 animate-pulse" />
                  )}
                </div>
                <p className="text-blue-400 mb-2 font-medium">Поиск пользователей...</p>
                <p className="text-sm text-gray-500">
                  {isCloudConnected ? 'Ищем по всему миру' : 'Ищем локально'}
                </p>
              </div>
            ) : (
              <>
                {/* Результаты среди известных пользователей */}
                {filteredUsers.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 px-2 flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ваши чаты ({filteredUsers.length})
                    </h3>
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center p-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-gray-600/30 mb-2 animate-fade-in backdrop-blur-sm"
                      >
                        <div className="relative">
                          {getUserAvatar(user)}
                          <Circle 
                            className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                              isUserOnline(user) ? 'text-green-400 fill-current' : 'text-gray-600 fill-current'
                            }`} 
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-white">{user.username}</h3>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-400">
                            <span>{isUserOnline(user) ? 'В сети' : 'Не в сети'}</span>
                            <span className="flex items-center">
                              <Hash className="w-3 h-3 mr-1" />
                              {user.id}
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-500">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Новые найденные пользователи */}
                {searchResults.length > 0 && (
                  <>
                    {filteredUsers.length > 0 && <div className="border-t border-gray-700/30 my-4"></div>}
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 px-2 flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      {isCloudConnected ? 'Найдены в мире' : 'Найденные пользователи'} ({searchResults.length})
                    </h3>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center p-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 border border-green-600/30 hover:border-green-500/50 mb-2 bg-gradient-to-r from-green-900/10 to-blue-900/10 animate-scale-in backdrop-blur-sm"
                      >
                        <div className="relative">
                          {getUserAvatar(user)}
                          <Circle 
                            className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                              isUserOnline(user) ? 'text-green-400 fill-current' : 'text-gray-600 fill-current'
                            }`} 
                          />
                          {isCloudConnected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-white">{user.username}</h3>
                            <span className="text-xs bg-gradient-to-r from-green-600 to-blue-600 text-white px-2 py-1 rounded animate-pulse">
                              {isCloudConnected ? 'Онлайн' : 'Найден'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-400">
                            <span>{isUserOnline(user) ? 'В сети' : 'Не в сети'}</span>
                            <span className="flex items-center">
                              <Hash className="w-3 h-3 mr-1" />
                              {user.id}
                            </span>
                          </div>
                        </div>
                        <div className="text-green-400">
                          <Plus className="w-5 h-5 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                  <Fish className="w-6 h-6 text-gray-500 animate-fish-swim" />
                </div>
                <p className="text-gray-400">Пока нет чатов</p>
                <p className="text-sm text-gray-500">Найдите пользователя и начните разговор!</p>
              </div>
            ) : viewMode === 'grid' && !isMobile ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredChats.map((chat) => (
                  <ChatGridItem key={chat.user.id} chat={chat} />
                ))}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.user.id}
                  onClick={() => onSelectChat(chat.user.id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 mb-2 animate-fade-in backdrop-blur-sm ${
                    selectedChatId === chat.user.id 
                      ? 'bg-gray-700/50 border border-gray-500/50 shadow-lg' 
                      : 'hover:bg-gray-800/50 border border-transparent hover:border-gray-600/30'
                  }`}
                >
                  <div className="relative">
                    {getUserAvatar(chat.user)}
                    <Circle 
                      className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                        isUserOnline(chat.user) ? 'text-green-400 fill-current' : 'text-gray-600 fill-current'
                      }`} 
                    />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">{chat.user.username}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-400">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {/* ИСПРАВЛЕННОЕ отображение статуса для удаленных аккаунтов */}
                        {chat.user.username === '[Удаленный аккаунт]' ? 
                          'Удаленный аккаунт' : 
                          chat.lastMessage?.type === 'voice' ? 'Голосовое сообщение' : 
                          chat.lastMessage?.content || 'Нет сообщений'
                        }
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse shadow-lg">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};