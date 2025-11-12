import React, { useState } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';

interface SidebarProps {
  user: { id: string; username: string; displayName?: string; avatar?: string };
  onLogout: () => void;
  onUpdateProfile: (newDisplayName: string, currentPassword: string, newPassword?: string, avatar?: string) => boolean;
  onClearData: () => void;
  onExportData: () => void;
  onDeleteAccount: (username: string, password: string) => boolean;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onLogout, 
  onUpdateProfile,
  onClearData,
  onExportData,
  onDeleteAccount,
  isMobile = false
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Функция для получения аватарки пользователя
  const getUserAvatar = () => {
    if (user.avatar) {
      return (
        <img 
          src={user.avatar} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full object-cover shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl border-2 border-gray-500"
        />
      );
    }
    
    return (
      <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl">
        {(user.displayName || user.username).charAt(0).toUpperCase()}
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg backdrop-blur-sm">
            {getUserAvatar()}
            <div>
              <h3 className="text-white font-semibold">{user.displayName || user.username}</h3>
              <p className="text-gray-400 text-sm">@{user.username}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button 
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300"
            >
              <User className="w-5 h-5" />
              <span>Профиль</span>
            </button>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300"
            >
              <Settings className="w-5 h-5" />
              <span>Настройки</span>
            </button>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 p-3 text-red-400 hover:text-red-300 hover:bg-gray-800/50 rounded-lg transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>

        {/* Modals */}
        <ProfileModal
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          user={user}
          onUpdateProfile={onUpdateProfile}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onClearData={onClearData}
          onExportData={onExportData}
          onDeleteAccount={onDeleteAccount}
          currentUser={user}
        />
      </>
    );
  }

  return (
    <>
      <div className="w-16 bg-black/30 backdrop-blur-sm border-r border-gray-600/30 flex flex-col items-center py-4">
        {/* User Avatar */}
        <button
          onClick={() => setShowProfile(true)}
          className="mb-6 transform transition-all duration-300 hover:scale-110 relative group"
          title={`${user.displayName || user.username} - Профиль`}
        >
          {getUserAvatar()}
          {/* Индикатор при наведении */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* Navigation */}
        <div className="flex-1 flex flex-col space-y-4">
          <button 
            onClick={() => setShowProfile(true)}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300 transform hover:scale-110 relative group"
            title="Профиль"
          >
            <User className="w-5 h-5" />
            <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300 transform hover:scale-110 relative group"
            title="Настройки"
          >
            <Settings className="w-5 h-5" />
            <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-3 text-gray-400 hover:text-red-400 hover:bg-gray-800/50 rounded-lg transition-all duration-300 transform hover:scale-110 relative group"
          title="Выйти"
        >
          <LogOut className="w-5 h-5" />
          <div className="absolute inset-0 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUpdateProfile={onUpdateProfile}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onClearData={onClearData}
        onExportData={onExportData}
        onDeleteAccount={onDeleteAccount}
        currentUser={user}
      />
    </>
  );
};