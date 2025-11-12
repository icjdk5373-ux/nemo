import React, { useState } from 'react';
import { Monitor, Smartphone, ArrowRight, Waves } from 'lucide-react';

interface DeviceSelectionProps {
  onDeviceSelect: (deviceType: 'desktop' | 'mobile') => void;
}

export const DeviceSelection: React.FC<DeviceSelectionProps> = ({ onDeviceSelect }) => {
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'mobile' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleDeviceSelect = async (deviceType: 'desktop' | 'mobile') => {
    setSelectedDevice(deviceType);
    setIsTransitioning(true);
    
    // Анимация перехода
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onDeviceSelect(deviceType);
  };

  return (
    <div className={`min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden transition-all duration-1000 ${isTransitioning ? 'animate-smooth-transition' : ''}`}>
      <div className={`w-full max-w-2xl relative z-10 transition-all duration-1000 ${isTransitioning ? 'animate-form-fade-out' : ''}`}>
        {/* Welcome Animation */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="relative mb-8">
            <img 
              src="/image.png" 
              alt="Nemo" 
              className={`w-24 h-24 mx-auto rounded-full shadow-2xl filter brightness-110 contrast-110 transition-all duration-1000 ${isTransitioning ? 'animate-gentle-swim' : 'animate-fish-swim'}`}
            />
            
            {/* Floating bubbles around fish */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-8 w-2 h-2 bg-blue-300/40 rounded-full animate-bubble-1"></div>
              <div className="absolute top-6 right-6 w-3 h-3 bg-cyan-300/30 rounded-full animate-bubble-2"></div>
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-blue-400/50 rounded-full animate-bubble-3"></div>
              <div className="absolute bottom-8 right-8 w-2.5 h-2.5 bg-cyan-400/35 rounded-full animate-bubble-4"></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Добро пожаловать в Nemo
          </h1>
          <p className="text-gray-300 text-lg mb-2">
            Выберите тип устройства для оптимального опыта
          </p>
          <p className="text-gray-400 text-sm">
            Интерфейс будет адаптирован под ваше устройство
          </p>
        </div>

        {/* Device Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Desktop Option */}
          <button
            onClick={() => handleDeviceSelect('desktop')}
            disabled={isTransitioning}
            className={`group relative p-8 bg-black/60 backdrop-blur-lg rounded-2xl border-2 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedDevice === 'desktop' 
                ? 'border-blue-500 bg-blue-900/30 shadow-blue-500/25 animate-pulse' 
                : 'border-gray-600/50 hover:border-blue-400/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full transition-all duration-500 ${
                selectedDevice === 'desktop' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 group-hover:bg-blue-600 group-hover:text-white'
              }`}>
                <Monitor className="w-8 h-8" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Компьютер</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Полнофункциональный интерфейс с расширенными возможностями
                </p>
                
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Многоколоночный интерфейс</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Расширенные настройки</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Быстрые клавиши</span>
                  </div>
                </div>
              </div>
              
              {selectedDevice === 'desktop' && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl animate-pulse"></div>
              )}
            </div>
          </button>

          {/* Mobile Option */}
          <button
            onClick={() => handleDeviceSelect('mobile')}
            disabled={isTransitioning}
            className={`group relative p-8 bg-black/60 backdrop-blur-lg rounded-2xl border-2 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedDevice === 'mobile' 
                ? 'border-purple-500 bg-purple-900/30 shadow-purple-500/25 animate-pulse' 
                : 'border-gray-600/50 hover:border-purple-400/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full transition-all duration-500 ${
                selectedDevice === 'mobile' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 group-hover:bg-purple-600 group-hover:text-white'
              }`}>
                <Smartphone className="w-8 h-8" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Мобильное устройство</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Оптимизированный интерфейс для сенсорных экранов
                </p>
                
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Полноэкранные чаты</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Жесты и свайпы</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Экономия батареи</span>
                  </div>
                </div>
              </div>
              
              {selectedDevice === 'mobile' && (
                <div className="absolute inset-0 bg-purple-500/10 rounded-2xl animate-pulse"></div>
              )}
            </div>
          </button>
        </div>

        {/* Continue Button */}
        {selectedDevice && (
          <div className="text-center animate-fade-in">
            <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-lg font-semibold transition-all duration-500 ${
              selectedDevice === 'desktop' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
            } animate-pulse`}>
              <span>
                {selectedDevice === 'desktop' ? 'Настройка для ПК' : 'Настройка для мобильного'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isTransitioning && (
          <div className="text-center mt-8 animate-fade-in">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white animate-pulse">
                Подготовка интерфейса...
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Вы всегда можете изменить тип устройства в настройках
          </p>
        </div>
      </div>
    </div>
  );
};