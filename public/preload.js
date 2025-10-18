const { contextBridge, ipcRenderer } = require('electron');

// Безопасно предоставляем API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app-version'),
  getPlatform: () => ipcRenderer.invoke('platform'),
  
  // Методы для работы с файловой системой (если понадобятся)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Уведомления
  showNotification: (title, body) => {
    new Notification(title, { body });
  }
});

// Предотвращаем доступ к Node.js API
delete window.require;
delete window.exports;
delete window.module;