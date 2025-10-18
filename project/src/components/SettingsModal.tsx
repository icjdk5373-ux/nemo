import React, { useState } from 'react';
import { X, Moon, Sun, Bell, Shield, Info, Trash2, UserX, AlertTriangle, Globe, Zap, Sparkles, Settings, Database, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
  onExportData: () => void;
  onDeleteAccount: (username: string, password: string) => boolean;
  currentUser: { id: string; username: string };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearData,
  onDeleteAccount,
  currentUser
}) => {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionStep, setDeletionStep] = useState(0);

  if (!isOpen) return null;

  const handleClearData = () => {
    if (showConfirmClear) {
      onClearData();
      setShowConfirmClear(false);
      onClose();
    } else {
      setShowConfirmClear(true);
    }
  };

  const handleDeleteAccountStep1 = () => {
    setShowDeleteAccount(true);
    setDeleteError('');
    setDeleteUsername('');
    setDeletePassword('');
  };

  const handleDeleteAccountStep2 = () => {
    setDeleteError('');

    if (!deleteUsername.trim() || !deletePassword.trim()) {
      setDeleteError('Введите логин и пароль');
      return;
    }

    if (deletePassword.length < 6) {
      setDeleteError('Пароль должен содержать минимум 6 символов');
      return;
    }

    const users = JSON.parse(localStorage.getItem('messenger_users') || '[]');
    const user = users.find((u: any) => u.id === currentUser.id);
    
    if (!user || user.username !== deleteUsername || user.password !== deletePassword) {
      setDeleteError('Неверный логин или пароль');
      return;
    }

    setShowFinalConfirm(true);
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    setDeletionStep(0);
    
    const steps = [
      'Инициализация удаления...',
      'Очистка данных пользователя...',
      'Удаление сообщений...',
      'Освобождение ресурсов...',
      'Завершение процесса...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setDeletionStep(i);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    const success = onDeleteAccount(deleteUsername, deletePassword);
    
    if (!success) {
      setDeleteError('Ошибка удаления аккаунта');
      setIsDeleting(false);
      setShowFinalConfirm(false);
      setDeletionStep(0);
    }
  };

  const resetDeleteForm = () => {
    setShowDeleteAccount(false);
    setShowFinalConfirm(false);
    setDeleteUsername('');
    setDeletePassword('');
    setDeleteError('');
    setIsDeleting(false);
    setDeletionStep(0);
  };

  const getDeletionStepText = () => {
    const steps = [
      'Инициализация удаления...',
      'Очистка данных пользователя...',
      'Удаление сообщений...',
      'Освобождение ресурсов...',
      'Завершение процесса...'
    ];
    return steps[deletionStep] || 'Удаление...';
  };

  const getDeletionIcon = () => {
    switch (deletionStep) {
      case 0:
        return <Settings className="w-12 h-12 text-blue-400 animate-spin" />;
      case 1:
        return <UserX className="w-12 h-12 text-orange-500 animate-pulse" />;
      case 2:
        return <Database className="w-12 h-12 text-red-500 animate-bounce" />;
      case 3:
        return <Cpu className="w-12 h-12 text-purple-500 animate-ping" />;
      case 4:
        return <Sparkles className="w-12 h-12 text-green-500 animate-pulse" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-red-400 animate-pulse" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-600 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-600 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Настройки</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-300"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(showDeleteAccount || showFinalConfirm || isDeleting) && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-red-600/50 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {isDeleting ? (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center">
                        {getDeletionIcon()}
                        <div className="absolute -bottom-4 left-0 right-0">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-600 via-orange-500 to-green-500 h-2 rounded-full transition-all duration-600 animate-pulse" 
                              style={{ width: `${((deletionStep + 1) / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 animate-pulse">Удаление аккаунта...</h3>
                      <p className="text-red-300 text-sm mb-4 animate-fade-in">{getDeletionStepText()}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i <= deletionStep ? 'bg-red-500 animate-pulse' : 'bg-gray-600'
                              }`}
                            ></div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 animate-pulse">
                          Процесс необратим. Пожалуйста, подождите...
                        </p>
                      </div>
                    </div>
                  ) : showFinalConfirm ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <AlertTriangle className="w-16 h-16 text-red-400 animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 bg-red-400/20 rounded-full animate-ping"></div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">Последнее предупреждение!</h3>
                      <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-4 mb-6 animate-pulse">
                        <p className="text-red-300 text-sm mb-2 font-semibold">ЭТО ДЕЙСТВИЕ НЕЛЬЗЯ ОТМЕНИТЬ!</p>
                        <ul className="text-xs text-red-400 space-y-1 text-left">
                          <li className="flex items-center">
                            <UserX className="w-3 h-3 mr-2 flex-shrink-0" />
                            Аккаунт будет полностью удален
                          </li>
                          <li className="flex items-center">
                            <Trash2 className="w-3 h-3 mr-2 flex-shrink-0" />
                            Все сообщения будут уничтожены
                          </li>
                          <li className="flex items-center">
                            <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                            Логин будет освобожден
                          </li>
                          <li className="flex items-center">
                            <X className="w-3 h-3 mr-2 flex-shrink-0" />
                            Приложение будет закрыто
                          </li>
                        </ul>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowFinalConfirm(false)}
                          className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 text-sm"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleFinalDelete}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-semibold transform hover:scale-105 animate-pulse text-sm"
                        >
                          УДАЛИТЬ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <UserX className="w-6 h-6 mr-2 text-red-400 animate-pulse" />
                          Удаление аккаунта
                        </h3>
                        <button
                          onClick={resetDeleteForm}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-300"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6 animate-pulse">
                        <p className="text-red-300 text-sm">
                          Для удаления аккаунта введите ваш логин и пароль
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Логин
                          </label>
                          <input
                            type="text"
                            value={deleteUsername}
                            onChange={(e) => setDeleteUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                            placeholder="Введите ваш логин"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Пароль
                          </label>
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                            placeholder="Введите ваш пароль"
                          />
                        </div>

                        {deleteError && (
                          <div className="text-red-300 text-sm animate-shake bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                            {deleteError}
                          </div>
                        )}

                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={resetDeleteForm}
                            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 text-sm"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={handleDeleteAccountStep2}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 text-sm"
                          >
                            Продолжить
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Global Database Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-400 animate-pulse" />
              Глобальная база данных
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative">
                    <Globe className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-blue-300 font-semibold">Firebase Realtime Database</h4>
                    <p className="text-blue-200 text-sm">Синхронизация между всеми устройствами</p>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-blue-300 text-center">
                  Автоматическое подключение при запуске
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Moon className="w-5 h-5 mr-2 text-gray-300" />
              Внешний вид
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  {darkMode ? <Moon className="w-4 h-4 mr-3 text-gray-300" /> : <Sun className="w-4 h-4 mr-3 text-yellow-400" />}
                  <span className="text-white">Темная тема</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                    darkMode ? 'bg-gray-600' : 'bg-gray-400'
                  } relative flex-shrink-0`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${
                      darkMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-gray-300" />
              Уведомления
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-3 text-gray-300" />
                  <span className="text-white">Звуковые уведомления</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                    notifications ? 'bg-gray-600' : 'bg-gray-400'
                  } relative flex-shrink-0`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${
                      notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-gray-300" />
              Конфиденциальность
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-300">
                  Данные синхронизируются через защищенную базу данных Firebase. Локальные данные хранятся в вашем браузере.
                </p>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-gray-300" />
              Управление данными
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleClearData}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  showConfirmClear 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <Trash2 className="w-4 h-4 mr-3 text-red-400" />
                  <span className="text-white">
                    {showConfirmClear ? 'Подтвердить удаление' : 'Очистить все данные'}
                  </span>
                </div>
              </button>
              
              {showConfirmClear && (
                <p className="text-xs text-red-300 px-3 animate-pulse">
                  Это действие нельзя отменить. Все сообщения и настройки будут удалены.
                </p>
              )}
            </div>
          </div>

          {/* Account Management */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <UserX className="w-5 h-5 mr-2 text-red-400 animate-pulse" />
              Управление аккаунтом
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccountStep1}
                className="w-full flex items-center justify-between p-3 bg-red-900/30 hover:bg-red-900/50 border border-red-600/30 rounded-lg transition-all duration-300 transform hover:scale-105 animate-pulse"
              >
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-3 text-red-400" />
                  <span className="text-red-300 font-semibold">Удалить аккаунт</span>
                </div>
              </button>
              
              <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg animate-pulse">
                <p className="text-xs text-red-300">
                  ВНИМАНИЕ: Удаление аккаунта приведет к мгновенному и полному удалению всех данных.
                </p>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-gray-300" />
              О приложении
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Nemo Messenger</h4>
                <p className="text-sm text-gray-300 mb-2">Версия 3.0.0 - Глобальная БД</p>
                <p className="text-xs text-gray-400">
                  Анонимный мессенджер с реальной синхронизацией между устройствами. Приложение было создано замерзающим и canya.
                </p>
              </div>
            </div>
          </div>

          {/* Connection Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Как общаться с другими</h3>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0 animate-pulse"></div>
                  <p><strong>Глобальная БД:</strong> Реальная синхронизация между всеми устройствами через Firebase</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p><strong>Поиск по ID:</strong> Найдите любого пользователя по его уникальному ID</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p><strong>Мгновенные сообщения:</strong> Сообщения доставляются в реальном времени</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p><strong>Локальный режим:</strong> Если нет интернета, работает локальное общение</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};