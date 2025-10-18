import React, { useState, useRef } from 'react';
import { X, User, Lock, Save, Shuffle, Palette, Sparkles } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; username: string };
  onUpdateProfile: (newUsername: string, currentPassword: string, newPassword?: string, avatar?: string) => boolean;
}

// Генератор красивых аватарок
const generateAvatar = (username: string, style: 'geometric' | 'abstract' | 'gradient' | 'pattern' = 'geometric') => {
  const colors = [
    ['#FF6B6B', '#4ECDC4', '#45B7D1'],
    ['#96CEB4', '#FFEAA7', '#DDA0DD'],
    ['#74B9FF', '#A29BFE', '#FD79A8'],
    ['#FDCB6E', '#E17055', '#00B894'],
    ['#6C5CE7', '#A29BFE', '#FD79A8'],
    ['#00CEC9', '#55A3FF', '#FF7675'],
    ['#FDCB6E', '#E84393', '#00B894'],
    ['#74B9FF', '#FDCB6E', '#55A3FF']
  ];
  
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorSet = colors[Math.abs(hash) % colors.length];
  const size = 200;
  
  if (style === 'geometric') {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorSet[0]};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${colorSet[1]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorSet[2]};stop-opacity:1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#grad1)"/>
        <polygon points="${size/2},30 170,80 170,120 ${size/2},170 30,120 30,80" fill="rgba(255,255,255,0.2)" filter="url(#glow)"/>
        <circle cx="${size/2}" cy="${size/2}" r="40" fill="rgba(255,255,255,0.3)"/>
        <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" fill="white" font-size="48" font-weight="bold" font-family="Arial, sans-serif">${username.charAt(0).toUpperCase()}</text>
      </svg>
    `)}`;
  } else if (style === 'abstract') {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:${colorSet[0]};stop-opacity:1" />
            <stop offset="70%" style="stop-color:${colorSet[1]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorSet[2]};stop-opacity:1" />
          </radialGradient>
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#grad2)"/>
        <path d="M50,50 Q100,80 150,50 T150,150 Q100,120 50,150 T50,50" fill="rgba(255,255,255,0.2)"/>
        <circle cx="70" cy="70" r="20" fill="rgba(255,255,255,0.3)"/>
        <circle cx="130" cy="130" r="15" fill="rgba(255,255,255,0.4)"/>
        <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" fill="white" font-size="42" font-weight="bold" font-family="Arial, sans-serif">${username.charAt(0).toUpperCase()}</text>
      </svg>
    `)}`;
  } else if (style === 'gradient') {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorSet[0]};stop-opacity:1" />
            <stop offset="33%" style="stop-color:${colorSet[1]};stop-opacity:1" />
            <stop offset="66%" style="stop-color:${colorSet[2]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorSet[0]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#grad3)"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 20}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 40}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <text x="${size/2}" y="${size/2 + 12}" text-anchor="middle" fill="white" font-size="52" font-weight="bold" font-family="Arial, sans-serif" text-shadow="2px 2px 4px rgba(0,0,0,0.3)">${username.charAt(0).toUpperCase()}</text>
      </svg>
    `)}`;
  } else {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pattern1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="${colorSet[0]}"/>
            <circle cx="20" cy="20" r="8" fill="${colorSet[1]}"/>
          </pattern>
          <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorSet[1]};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${colorSet[2]};stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#pattern1)"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#grad4)"/>
        <text x="${size/2}" y="${size/2 + 10}" text-anchor="middle" fill="white" font-size="46" font-weight="bold" font-family="Arial, sans-serif">${username.charAt(0).toUpperCase()}</text>
      </svg>
    `)}`;
  }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile
}) => {
  const [displayName, setDisplayName] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<'geometric' | 'abstract' | 'gradient' | 'pattern'>('geometric');

  // Загружаем аватар из localStorage при открытии
  React.useEffect(() => {
    if (isOpen) {
      const savedAvatar = localStorage.getItem(`messenger_avatar_${user.id}`);
      const savedDisplayName = localStorage.getItem(`messenger_display_name_${user.id}`);
      
      if (savedAvatar) {
        setAvatar(savedAvatar);
      } else {
        // Генерируем аватар по умолчанию
        const defaultAvatar = generateAvatar(user.username, avatarStyle);
        setAvatar(defaultAvatar);
      }
      
      setDisplayName(savedDisplayName || user.username);
    }
  }, [isOpen, user.id, user.username, avatarStyle]);

  if (!isOpen) return null;

  const generateNewAvatar = (style: 'geometric' | 'abstract' | 'gradient' | 'pattern') => {
    const newAvatar = generateAvatar(displayName || user.username, style);
    setAvatar(newAvatar);
    setAvatarStyle(style);
    localStorage.setItem(`messenger_avatar_${user.id}`, newAvatar);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!currentPassword.trim()) {
      setError('Введите текущий пароль');
      setIsLoading(false);
      return;
    }

    if (currentPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    if (!displayName.trim()) {
      setError('Имя не может быть пустым');
      setIsLoading(false);
      return;
    }

    const success = onUpdateProfile(
      displayName.trim(),
      currentPassword,
      newPassword.trim() || undefined,
      avatar || undefined
    );

    if (!success) {
      setError('Неверный текущий пароль');
    } else {
      onClose();
    }

    setIsLoading(false);
  };

  const avatarStyles = [
    { key: 'geometric', name: 'Геометрический', icon: '🔷' },
    { key: 'abstract', name: 'Абстрактный', icon: '🎨' },
    { key: 'gradient', name: 'Градиентный', icon: '🌈' },
    { key: 'pattern', name: 'Узорный', icon: '🔮' }
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-600 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-bold text-white">Профиль</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-300"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar Display */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl border-4 border-gray-700 transform transition-all duration-500 hover:scale-110 hover:shadow-3xl">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-gray-600 to-gray-500 flex items-center justify-center text-white font-bold text-2xl">
                    {(displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            </div>
            
            {/* Avatar Style Selector */}
            <div className="w-full">
              <h3 className="text-sm font-medium text-gray-300 mb-3 text-center flex items-center justify-center">
                <Palette className="w-4 h-4 mr-2" />
                Стиль аватарки
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {avatarStyles.map((style) => (
                  <button
                    key={style.key}
                    onClick={() => generateNewAvatar(style.key)}
                    className={`p-3 rounded-lg border transition-all duration-300 transform hover:scale-105 ${
                      avatarStyle === style.key
                        ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-lg mb-1">{style.icon}</div>
                    <div className="text-xs font-medium">{style.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate New Avatar Button */}
            <button
              onClick={() => generateNewAvatar(avatarStyle)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Shuffle className="w-4 h-4 text-white" />
              <span className="text-white font-medium">Новая аватарка</span>
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="mt-6 space-y-3">
            {/* Display Name (editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Отображаемое имя
              </label>
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onBlur={() => setIsEditingName(false)}
                    onKeyPress={(e) => e.key === 'Enter' && setIsEditingName(false)}
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-2 text-green-400 hover:text-green-300 transition-colors duration-300"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors duration-300 group"
                >
                  <span className="text-white font-medium">{displayName}</span>
                  <div className="text-gray-400 group-hover:text-blue-400 transition-colors duration-300">
                    ✏️
                  </div>
                </div>
              )}
            </div>
            
            {/* Username (static) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Логин (неизменяемый)
              </label>
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
                <span className="text-gray-400">@{user.username}</span>
              </div>
            </div>
            
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID пользователя
              </label>
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
                <span className="text-gray-400 font-mono text-sm">{user.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Текущий пароль *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300"
                placeholder="Введите текущий пароль"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Новый пароль (необязательно)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300"
                placeholder="Новый пароль (минимум 6 символов)"
              />
            </div>
          </div>

          {newPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Подтвердите новый пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300"
                  placeholder="Подтвердите новый пароль"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-300 text-sm animate-shake bg-red-900/20 border border-red-600/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-300 flex items-center justify-center disabled:opacity-50 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};