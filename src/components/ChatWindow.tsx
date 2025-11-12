import React, { useState, useRef, useEffect } from 'react';
import { Send, Circle, MoreVertical, Mic, MicOff, Play, Pause, Trash2, UserX, UserCheck, Volume2, X, Check, CheckCheck, Skull, Wifi, WifiOff, ArrowLeft, MessageCircle, Shield, Smile, Paperclip, Image, Camera } from 'lucide-react';
import { Message, User } from '../types';

interface ChatWindowProps {
  selectedUser: User | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, type?: 'text' | 'voice') => void;
  onBlockUser?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  onDeleteChat?: (userId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isUserBlocked?: boolean;
  isCloudConnected?: boolean;
  isMobile?: boolean;
  onBack?: () => void;
  chatPersistence?: {
    isActive: boolean;
    userId: string | null;
    timestamp: number;
    stabilityScore: number;
  };
}

// Компонент плавающих сообщений с исправленной анимацией
const FloatingMessages: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % 6);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="space-y-4 w-80 max-w-full px-4">
        <div className={`flex justify-start transition-all duration-700 ease-out ${step >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 px-4 py-3 rounded-2xl text-sm max-w-[70%] shadow-xl border border-slate-500/30 animate-scale-in" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <span className="break-words whitespace-pre-wrap">Я знаю когда Nemo выйдет как приложение.</span>
            <div className="text-xs text-slate-300 mt-1 opacity-70">12:34</div>
          </div>
        </div>

        {step === 2 && (
          <div className="flex justify-end animate-fade-in">
            <div className="bg-gradient-to-r from-blue-700 to-slate-700 px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-xl border border-blue-500/30">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-300">печатает...</span>
            </div>
          </div>
        )}

        <div className={`flex justify-end transition-all duration-700 ease-out ${step >= 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-2xl text-sm max-w-[70%] shadow-xl border border-blue-400/30 animate-scale-in" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <span className="break-words whitespace-pre-wrap">когда?</span>
            <div className="flex items-center justify-end mt-1 space-x-1">
              <span className="text-xs text-blue-100 opacity-70">12:35</span>
              <CheckCheck className="w-3 h-3 text-blue-200" />
            </div>
          </div>
        </div>

        {step === 4 && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-xl border border-slate-500/30">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-300">печатает...</span>
            </div>
          </div>
        )}

        <div className={`flex justify-start transition-all duration-700 ease-out ${step >= 5 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 px-4 py-3 rounded-2xl text-sm max-w-[70%] shadow-xl border border-slate-500/30 animate-scale-in" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <span className="break-words whitespace-pre-wrap">Никто не знает.</span>
            <div className="text-xs text-slate-300 mt-1 opacity-70">12:36</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedUser,
  messages,
  currentUserId,
  onSendMessage,
  onBlockUser,
  onUnblockUser,
  onDeleteChat,
  onDeleteMessage,
  isUserBlocked = false,
  isCloudConnected = false,
  isMobile = false,
  onBack,
  chatPersistence
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());
  const [chatStability, setChatStability] = useState({
    isStable: false,
    lastActivity: Date.now(),
    protectionLevel: 0
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const stabilityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      });
      if (stabilityIntervalRef.current) {
        clearInterval(stabilityIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [audioElements]);

  // ОБРАБОТЧИК ESC И КРЕСТИКА ДЛЯ ВЫХОДА ИЗ ЧАТА
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedUser && onBack) {
        e.preventDefault();
        onBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, onBack]);

  // УПРОЩЕННАЯ система стабилизации чата (БЕЗ БЛОКИРОВКИ ВВОДА)
  useEffect(() => {
    if (!selectedUser) {
      setChatStability({
        isStable: false,
        lastActivity: Date.now(),
        protectionLevel: 0
      });
      
      if (stabilityIntervalRef.current) {
        clearInterval(stabilityIntervalRef.current);
        stabilityIntervalRef.current = null;
      }
      return;
    }

    // Активируем стабилизацию чата
    setChatStability({
      isStable: true,
      lastActivity: Date.now(),
      protectionLevel: 100
    });

    // Простая система защиты от закрытия (БЕЗ ВМЕШАТЕЛЬСТВА В DOM)
    const protectChat = () => {
      if (selectedUser) {
        // Только обновляем состояние, НЕ ТРОГАЕМ DOM
        setChatStability(prev => ({
          ...prev,
          lastActivity: Date.now(),
          protectionLevel: Math.min(prev.protectionLevel + 5, 100)
        }));

        // Сохраняем состояние чата в localStorage
        localStorage.setItem('nemo_active_chat_protection', JSON.stringify({
          userId: selectedUser.id,
          timestamp: Date.now(),
          protectionLevel: 100,
          isMobile: isMobile
        }));
      }
    };

    // Защита каждые 10 секунд (реже, чтобы не мешать)
    stabilityIntervalRef.current = setInterval(protectChat, 10000);

    // Начальная защита
    protectChat();

    return () => {
      if (stabilityIntervalRef.current) {
        clearInterval(stabilityIntervalRef.current);
        stabilityIntervalRef.current = null;
      }
    };
  }, [selectedUser, isMobile]);

  // Автофокус на поле ввода при открытии чата (только для десктопа)
  useEffect(() => {
    if (selectedUser && inputRef.current && !isMobile) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [selectedUser, isMobile]);

  const isCurrentUserDeleted = () => {
    const savedUsers = localStorage.getItem('messenger_users');
    if (!savedUsers) return false;
    
    const allUsers = JSON.parse(savedUsers);
    const currentUser = allUsers.find((u: any) => u.id === currentUserId);
    return currentUser ? currentUser.isDeleted : false;
  };

  // ПРОВЕРКА: нельзя писать самому себе
  const isSelfChat = selectedUser?.id === currentUserId;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCurrentUserDeleted()) {
      alert('Удаленные аккаунты не могут отправлять сообщения');
      return;
    }

    // ПРОВЕРКА: нельзя писать самому себе
    if (isSelfChat) {
      alert('Нельзя отправлять сообщения самому себе');
      return;
    }
    
    if (newMessage.trim() && !isUserBlocked) {
      onSendMessage(newMessage.trim(), 'text');
      setNewMessage('');
      setIsTyping(false);
      
      // Обновляем активность чата
      setChatStability(prev => ({
        ...prev,
        lastActivity: Date.now(),
        protectionLevel: 100
      }));
      
      // Сохраняем фокус (только для десктопа)
      if (!isMobile && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // ИСПРАВЛЕННЫЙ индикатор печати - только для других пользователей
    if (!isSelfChat) {
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  const startRecording = async () => {
    if (isCurrentUserDeleted()) {
      alert('Удаленные аккаунты не могут отправлять сообщения');
      return;
    }

    // ПРОВЕРКА: нельзя записывать голосовые самому себе
    if (isSelfChat) {
      alert('Нельзя отправлять голосовые сообщения самому себе');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        // Check if the audio blob is empty or too small
        if (audioBlob.size === 0 || audioBlob.size < 1000) {
          alert('Запись слишком короткая или пустая. Попробуйте записать еще раз.');
          stream.getTracks().forEach(track => track.stop());
          setRecordingTime(0);
          return;
        }
        
        // Check if recording time is too short
        if (recordingTime < 1) {
          alert('Запись слишком короткая. Минимальная длительность записи - 1 секунда.');
          stream.getTracks().forEach(track => track.stop());
          setRecordingTime(0);
          return;
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Test if the audio URL is valid before sending
        const testAudio = new Audio(audioUrl);
        testAudio.onerror = () => {
          alert('Ошибка при создании голосового сообщения. Попробуйте еще раз.');
          URL.revokeObjectURL(audioUrl);
        };
        
        testAudio.oncanplaythrough = () => {
          onSendMessage(`voice:${audioUrl}:${recordingTime}`, 'voice');
          testAudio.remove();
        };
        
        // Load the audio to trigger the event
        testAudio.load();
        
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      alert('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playAudio = async (audioUrl: string, messageId: string) => {
    if (playingAudio) {
      const currentAudio = audioElements.get(playingAudio);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      setPlayingAudio(null);
    }

    if (playingAudio === messageId) {
      return;
    }

    try {
      let audio = audioElements.get(messageId);
      
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.preload = 'auto';
        
        audio.onended = () => {
          setPlayingAudio(null);
        };
        
        audio.onerror = (e) => {
          console.error('Ошибка воспроизведения аудио:', e);
          setPlayingAudio(null);
          alert('Не удалось воспроизвести голосовое сообщение. Файл может быть поврежден.');
        };
        
        // Add load event listener to ensure audio is ready
        audio.onloadeddata = () => {
          console.log('Audio loaded successfully');
        };
        
        audio.onloadstart = () => {
          console.log('Audio loading started');
        };
        
        setAudioElements(prev => new Map(prev).set(messageId, audio!));
      }
      
      // Check if audio source is valid before playing
      if (!audioUrl || audioUrl === 'undefined' || audioUrl === 'null') {
        throw new Error('Invalid audio URL');
      }
      
      setPlayingAudio(messageId);
      await audio.play();
      
    } catch (error) {
      console.error('Ошибка воспроизведения:', error);
      setPlayingAudio(null);
      alert('Не удалось воспроизвести голосовое сообщение. Попробуйте еще раз.');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Удалить это сообщение?')) {
      onDeleteMessage?.(messageId);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMenuAction = (action: string) => {
    if (!selectedUser) return;

    switch (action) {
      case 'block':
        onBlockUser?.(selectedUser.id);
        break;
      case 'unblock':
        onUnblockUser?.(selectedUser.id);
        break;
      case 'delete':
        if (confirm('Вы уверены, что хотите удалить этот чат? Все сообщения будут удалены.')) {
          onDeleteChat?.(selectedUser.id);
        }
        break;
    }
    setShowMenu(false);
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== currentUserId) return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-400" title="Прочитано" />;
    } else if (message.delivered) {
      return <CheckCheck className="w-4 h-4 text-gray-400" title="Доставлено" />;
    } else {
      return <Check className="w-4 h-4 text-gray-500" title="Отправлено" />;
    }
  };

  const getUserAvatar = (user: User) => {
    if (user.username === '[Удаленный аккаунт]') {
      return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 border-2 border-gray-600 relative animate-pulse">
          <div className="relative">
            <Skull className="w-5 h-5 text-gray-500 opacity-70" />
            <div className="absolute top-1 left-2 w-2 h-2">
              <X className="w-2 h-2 text-red-500 stroke-[3]" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gray-900/50 rounded-full"></div>
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
        {user.username.charAt(0).toUpperCase()}
      </div>
    );
  };

  const isDeletedUser = selectedUser?.username === '[Удаленный аккаунт]';
  const isCurrentDeleted = isCurrentUserDeleted();

  // Эмодзи для быстрого доступа
  const quickEmojis = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉'];

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 bg-transparent flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <FloatingMessages />
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-3">Выберите чат</h2>
          <p className="text-gray-400 text-lg">Выберите разговор, чтобы начать общение</p>
          
          <div className="mt-8 flex justify-center space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-transparent flex flex-col overflow-hidden relative h-full">
      {/* Индикатор стабильности чата */}
      {chatStability.isStable && (
        <div className="absolute top-2 right-2 z-10 bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-full p-2 animate-pulse">
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-300 font-medium">{chatStability.protectionLevel}%</span>
          </div>
        </div>
      )}

      {/* Chat Header - фиксированный */}
      <div className="flex-shrink-0 p-4 border-b border-gray-600/30 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Back button for mobile + ESC hint for desktop */}
            {isMobile && onBack ? (
              <button
                onClick={onBack}
                className="p-2 mr-2 hover:bg-gray-700/50 rounded-lg transition-all duration-300 transform hover:scale-105"
                title="Назад к чатам"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            ) : onBack && (
              <button
                onClick={onBack}
                className="p-2 mr-2 hover:bg-gray-700/50 rounded-lg transition-all duration-300 transform hover:scale-105 group"
                title="Назад к чатам (ESC)"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </button>
            )}
            
            <div className="relative">
              {getUserAvatar(selectedUser)}
              <Circle 
                className={`absolute -bottom-1 -right-1 w-3 h-3 ${
                  selectedUser.isOnline ? 'text-gray-300 fill-current' : 'text-gray-600 fill-current'
                }`} 
              />
            </div>
            <div className="ml-3">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-white">{selectedUser.username}</h2>
                {selectedUser.deviceType && (
                  <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded">
                    {selectedUser.deviceType === 'desktop' ? 'ПК' : 'Моб'}
                  </span>
                )}
                {isCloudConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" title="Подключено к облаку" />
                ) : (
                  <WifiOff className="w-4 h-4 text-yellow-400" title="Локальный режим" />
                )}
              </div>
              <p className="text-sm text-gray-400">
                {isUserBlocked ? 'Заблокирован' : 
                 isDeletedUser ? 'Удаленный аккаунт' :
                 isSelfChat ? 'Это вы' :
                 isTyping ? 'печатает...' :
                 selectedUser.isOnline ? 'В сети' : 'Был недавно'}
              </p>
            </div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-300"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-12 bg-gray-800/90 backdrop-blur-sm border border-gray-600/30 rounded-lg shadow-xl z-10 min-w-[180px] animate-scale-in">
                <div className="py-2">
                  {!isUserBlocked ? (
                    <button
                      onClick={() => handleMenuAction('block')}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/50 transition-colors duration-300 flex items-center"
                    >
                      <UserX className="w-4 h-4 mr-3" />
                      Заблокировать
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMenuAction('unblock')}
                      className="w-full px-4 py-2 text-left text-green-400 hover:bg-gray-700/50 transition-colors duration-300 flex items-center"
                    >
                      <UserCheck className="w-4 h-4 mr-3" />
                      Разблокировать
                    </button>
                  )}
                  <button
                    onClick={() => handleMenuAction('delete')}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/50 transition-colors duration-300 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Удалить чат
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages - растягивается на всю доступную высоту */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 pb-24" style={{ scrollBehavior: 'smooth' }}>
        {/* ПРЕДУПРЕЖДЕНИЕ О ЧАТЕ С САМИМ СОБОЙ */}
        {isSelfChat && (
          <div className="text-center py-4">
            <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-4 mx-auto max-w-md animate-pulse">
              <MessageCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-300 text-sm font-medium">Это ваш собственный профиль</p>
              <p className="text-yellow-400/70 text-xs mt-1">Вы не можете отправлять сообщения самому себе</p>
            </div>
          </div>
        )}

        {isUserBlocked && (
          <div className="text-center py-4">
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-4 mx-auto max-w-md">
              <UserX className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-300 text-sm">Пользователь заблокирован</p>
              <p className="text-red-400/70 text-xs mt-1">Разблокируйте для отправки сообщений</p>
            </div>
          </div>
        )}

        {isDeletedUser && (
          <div className="text-center py-4">
            <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 mx-auto max-w-md">
              <Skull className="w-8 h-8 mx-auto mb-2 text-gray-500 opacity-70" />
              <p className="text-gray-400 text-sm">Аккаунт пользователя удален</p>
              <p className="text-gray-500 text-xs mt-1">Сообщения сохранены, но пользователь больше не активен</p>
            </div>
          </div>
        )}

        {isCurrentDeleted && (
          <div className="text-center py-4">
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-4 mx-auto max-w-md animate-pulse">
              <Skull className="w-8 h-8 mx-auto mb-2 text-red-400 opacity-70" />
              <p className="text-red-300 text-sm">Ваш аккаунт удален</p>
              <p className="text-red-400/70 text-xs mt-1">Удаленные аккаунты не могут отправлять сообщения</p>
            </div>
          </div>
        )}

        {!isCloudConnected && !isDeletedUser && !isCurrentDeleted && !isSelfChat && (
          <div className="text-center py-2">
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mx-auto max-w-md">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <WifiOff className="w-4 h-4 text-yellow-400" />
                <p className="text-yellow-300 text-sm font-medium">Локальный режим</p>
              </div>
              <p className="text-yellow-400/70 text-xs">
                Сообщения работают только на этом устройстве
              </p>
            </div>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <MessageCircle className="w-8 h-8 text-gray-500 animate-pulse" />
            </div>
            <p className="text-gray-400">Пока нет сообщений</p>
            <p className="text-sm text-gray-500">
              {isSelfChat ? 'Вы не можете отправлять сообщения самому себе' : 'Отправьте сообщение, чтобы начать разговор!'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const showTime = index === 0 || 
              new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000;

            const isVoiceMessage = message.content.startsWith('voice:');
            let audioUrl = '';
            let duration = 0;
            
            if (isVoiceMessage) {
              const parts = message.content.split(':');
              audioUrl = parts[1];
              duration = parseInt(parts[2]) || 0;
            }

            return (
              <div key={message.id} className="animate-fade-in">
                {showTime && (
                  <div className="text-center text-xs text-gray-500 mb-2">
                    {formatTime(message.timestamp)}
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className="relative group">
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-white'
                          : 'bg-gray-800/80 text-white border border-gray-600/30'
                      } shadow-lg transform transition-all duration-300 hover:scale-105 backdrop-blur-sm`}
                    >
                      {isVoiceMessage ? (
                        <div className="flex items-center space-x-3 min-w-[120px]">
                          <button
                            onClick={() => playAudio(audioUrl, message.id)}
                            className="p-2 bg-gray-600/50 hover:bg-gray-500/50 rounded-full transition-colors duration-300 flex-shrink-0"
                          >
                            {playingAudio === message.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex items-center space-x-2 flex-1">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <div className="flex-1 h-1 bg-gray-600/50 rounded-full">
                              <div className="h-1 bg-gray-400 rounded-full w-1/3"></div>
                            </div>
                            <span className="text-xs text-gray-300 font-mono">
                              {formatRecordingTime(duration)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{message.content}</p>
                      )}
                      
                      {isOwn && (
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                          {getMessageStatus(message)}
                        </div>
                      )}
                    </div>
                    
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600/80 hover:bg-red-700/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
                        title="Удалить сообщение"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* КОМПАКТНАЯ СЕРАЯ КЛАВИАТУРА - ФИКСИРОВАННАЯ ВНИЗУ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-800/98 via-gray-700/95 to-gray-600/85 backdrop-blur-xl border-t border-gray-500/30">
        {/* Запись голосового сообщения - КОМПАКТНАЯ */}
        {isRecording && (
          <div className="p-2 border-b border-gray-500/30">
            <div className="bg-gradient-to-r from-red-900/40 to-pink-900/40 border border-red-500/30 rounded-xl p-3 flex items-center justify-between animate-pulse backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-red-300 text-sm font-medium">Запись</span>
                <span className="text-red-400 font-mono text-sm font-bold">
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              <button
                onClick={stopRecording}
                className="p-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <MicOff className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Эмодзи панель - КОМПАКТНАЯ */}
        {showEmojiPicker && (
          <div className="p-2 border-b border-gray-500/30">
            <div className="bg-gray-700/50 rounded-xl p-3 backdrop-blur-sm border border-gray-500/30">
              <div className="grid grid-cols-6 gap-2">
                {quickEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="p-2 text-xl hover:bg-gray-600/50 rounded-lg transition-all duration-300 transform hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Основная панель ввода - КОМПАКТНАЯ И СЕРАЯ */}
        <div className="p-3">
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            {/* Кнопка эмодзи - КОМПАКТНАЯ */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                showEmojiPicker 
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' 
                  : 'bg-gray-600/50 hover:bg-gray-500/50 text-gray-300'
              }`}
              title="Эмодзи"
              disabled={isUserBlocked || isDeletedUser || isCurrentDeleted || isSelfChat}
            >
              <Smile className="w-4 h-4" />
            </button>
            
            {/* Поле ввода - КОМПАКТНОЕ И СЕРОЕ */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={
                  isCurrentDeleted ? "Удаленные аккаунты не могут писать" :
                  isUserBlocked ? "Пользователь заблокирован" : 
                  isDeletedUser ? "Аккаунт пользователя удален" :
                  isSelfChat ? "Нельзя писать самому себе" :
                  "Сообщение..."
                }
                disabled={isUserBlocked || isRecording || isDeletedUser || isCurrentDeleted || isSelfChat}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-700/80 to-gray-600/80 border border-gray-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 disabled:opacity-50 backdrop-blur-sm shadow-lg text-sm"
                autoComplete="off"
              />
              
              {/* Индикатор печати - КОМПАКТНЫЙ */}
              {isTyping && !isSelfChat && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопка микрофона - КОМПАКТНАЯ */}
            {!isUserBlocked && !isDeletedUser && !isCurrentDeleted && !isSelfChat && (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white animate-pulse shadow-lg shadow-red-500/25' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white shadow-lg'
                }`}
                title={isRecording ? 'Остановить запись' : 'Голосовое сообщение'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Кнопка отправки - КОМПАКТНАЯ И СЕРАЯ */}
            <button
              type="submit"
              disabled={!newMessage.trim() || isRecording || isUserBlocked || isDeletedUser || isCurrentDeleted || isSelfChat}
              className="p-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 disabled:from-gray-800 disabled:to-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};