import React from 'react';

export const WaterEffect: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Сбалансированный серо-черный градиент */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-gray-800 via-slate-900 to-black">
        
        {/* Плавные волны */}
        <div className="absolute inset-0">
          {/* Волна 1 */}
          <div className="absolute inset-0">
            <svg
              className="absolute bottom-0 left-0 w-full h-full"
              viewBox="0 0 1200 800"
              preserveAspectRatio="none"
            >
              <path
                d="M0,450 C300,400 600,500 900,450 C1050,425 1200,450 1200,450 L1200,800 L0,800 Z"
                fill="rgba(75, 85, 99, 0.15)"
                className="animate-wave-slow"
              />
            </svg>
          </div>

          {/* Волна 2 */}
          <div className="absolute inset-0">
            <svg
              className="absolute bottom-0 left-0 w-full h-full"
              viewBox="0 0 1200 800"
              preserveAspectRatio="none"
            >
              <path
                d="M0,520 C400,470 800,570 1200,520 L1200,800 L0,800 Z"
                fill="rgba(107, 114, 128, 0.12)"
                className="animate-wave-medium"
              />
            </svg>
          </div>

          {/* Волна 3 */}
          <div className="absolute inset-0">
            <svg
              className="absolute bottom-0 left-0 w-full h-full"
              viewBox="0 0 1200 800"
              preserveAspectRatio="none"
            >
              <path
                d="M0,600 C200,570 400,630 600,600 C800,570 1000,630 1200,600 L1200,800 L0,800 Z"
                fill="rgba(156, 163, 175, 0.1)"
                className="animate-wave-fast"
              />
            </svg>
          </div>
        </div>

        {/* Минимальные плавающие элементы */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-blue-400/20 rounded-full animate-float-1"></div>
          <div className="absolute top-1/3 right-1/5 w-1.5 h-1.5 bg-gray-400/25 rounded-full animate-float-2"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-slate-400/15 rounded-full animate-float-3"></div>
          <div className="absolute bottom-1/3 right-1/6 w-1 h-1 bg-blue-300/20 rounded-full animate-float-1" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>
    </div>
  );
};