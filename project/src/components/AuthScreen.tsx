import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Lock, Waves } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (username: string, password: string) => boolean;
  onRegister: (username: string, password: string) => boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fullText = 'Добро пожаловать в Nemo';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setTimeout(() => setShowSubtitle(true), 500);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Функция для проверки английских символов
  const isEnglishOnly = (text: string) => {
    return /^[a-zA-Z0-9]*$/.test(text);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isEnglishOnly(value)) {
      setUsername(value);
      setError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isEnglishOnly(value)) {
      setPassword(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
      setIsLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      setIsLoading(false);
      return;
    }

    if (password.trim().length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    if (!isEnglishOnly(username) || !isEnglishOnly(password)) {
      setError('Используйте только английские буквы и цифры');
      setIsLoading(false);
      return;
    }

    // Плавная анимация перехода
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Сначала пробуем войти
    const loginSuccess = onLogin(username, password);
    
    if (!loginSuccess) {
      // Если вход не удался, пробуем зарегистрировать
      console.log('Попытка регистрации пользователя:', username);
      const registerSuccess = onRegister(username, password);
      if (!registerSuccess) {
        setError('Ошибка регистрации. Имя пользователя уже существует или данные некорректны.');
        setIsLoading(false);
        setIsTransitioning(false);
      } else {
        console.log('Пользователь успешно зарегистрирован');
      }
    } else {
      console.log('Пользователь успешно вошел в систему');
    }
    
    if (!loginSuccess && !onRegister(username, password)) {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  };

  return (
    <div className={`min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden transition-all duration-1000 ${isTransitioning ? 'animate-smooth-transition' : ''}`}>
      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 ${isTransitioning ? 'animate-form-fade-out' : ''}`}>
        {/* Welcome Animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative mb-6">
            {/* Белая рыбка Nemo */}
            <img 
              src="/image.png" 
              alt="Nemo" 
              className={`w-32 h-32 mx-auto rounded-full shadow-2xl filter brightness-110 contrast-110 transition-all duration-1000 ${isTransitioning ? 'animate-gentle-swim' : 'animate-fish-swim'}`}
            />
            
            {/* Floating bubbles around fish */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-8 w-2 h-2 bg-blue-300/40 rounded-full animate-bubble-1"></div>
              <div className="absolute top-6 right-6 w-3 h-3 bg-cyan-300/30 rounded-full animate-bubble-2"></div>
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bubble-3"></div>
              <div className="absolute bottom-8 right-8 w-2.5 h-2.5 bg-cyan-400/35 rounded-full animate-bubble-4"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 min-h-[3rem] flex items-center justify-center">
            {typedText}
          </h1>
          <p className={`text-gray-300 transition-all duration-500 ${showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Анонимность? Не вопрос.
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-600/50 animate-scale-in">
          <div className="flex items-center justify-center mb-6">
            <MessageCircle className="w-8 h-8 text-gray-300 mr-3 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">
              Мессенджер
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Имя пользователя"
                value={username}
                onChange={handleUsernameChange}
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/70 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/70 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="text-red-300 text-sm text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                isTransitioning 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 animate-pulse' 
                  : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-blue-600 hover:to-cyan-600'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="animate-pulse">
                    {isTransitioning ? 'Вход в систему...' : 'Загрузка...'}
                  </span>
                </div>
              ) : (
                <>
                  <Waves className="w-5 h-5 mr-2 animate-bounce" />
                  Нырнуть под воду
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-400">
              Введите имя пользователя и пароль.<br />
              Если аккаунт не существует, он будет создан автоматически.<br />
              Используйте только английские буквы и цифры.
            </p>
            
            <div className="pt-4 border-t border-gray-700/50">
              <p className="text-xs text-gray-500">
                Приложение было создано замерзающим и canya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};