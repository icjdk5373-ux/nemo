# 🐘 Настройка PostgreSQL для Nemo Messenger

## ✅ Что у вас уже есть:
- PostgreSQL база данных на Railway
- Готовые файлы сервера с поддержкой PostgreSQL

## 🎯 Следующие шаги:

### Шаг 1: Создание таблиц в PostgreSQL

1. **В панели Railway найдите вашу PostgreSQL базу данных**
2. **Нажмите на неё, затем перейдите в раздел "Data"**
3. **Нажмите "Create table" или используйте SQL консоль**

### Шаг 2: Выполните SQL скрипт

Скопируйте и выполните этот SQL код в консоли PostgreSQL:

```sql
-- Создание основных таблиц
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    device_type VARCHAR(20) DEFAULT 'desktop',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(100) UNIQUE NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    is_delivered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    socket_id VARCHAR(100),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
```

### Шаг 3: Обновление сервера

Файлы сервера уже обновлены для работы с PostgreSQL:
- ✅ `package.json` - добавлены зависимости `pg` и `bcrypt`
- ✅ `database.js` - модуль для работы с PostgreSQL
- ✅ `server.js` - обновлен для использования базы данных

### Шаг 4: Развертывание обновленного сервера

1. **Загрузите обновленные файлы в ваш GitHub репозиторий**
2. **Railway автоматически пересоберет и развернет сервер**
3. **Дождитесь завершения развертывания**

### Шаг 5: Проверка работы

Откройте ваш Railway URL в браузере. Вы должны увидеть:

```json
{
  "name": "Nemo Messenger Global Server",
  "version": "3.0.0",
  "status": "online",
  "database": "PostgreSQL",
  "onlineUsers": 0,
  "totalUsers": 0,
  "totalMessages": 0
}
```

## 🔧 Переменные окружения

Railway автоматически предоставляет переменную `DATABASE_URL` для подключения к PostgreSQL.

## ✨ Новые возможности с PostgreSQL:

- 🚀 **Высокая производительность** - быстрые запросы и индексы
- 💾 **Постоянное хранение** - данные не теряются при перезапуске
- 🔍 **Продвинутый поиск** - поиск пользователей по частичному совпадению
- 📊 **Детальная статистика** - количество пользователей, сообщений
- 🧹 **Автоматическая очистка** - удаление старых данных
- 🔒 **Безопасность** - хэширование паролей, защита от SQL инъекций

## 🎯 Что изменилось в клиенте:

Клиент будет автоматически работать с новым сервером без изменений!

## 📊 Мониторинг

В Railway вы можете:
- Просматривать логи сервера
- Мониторить использование базы данных
- Просматривать метрики производительности

## 🆘 Если возникли проблемы:

1. **Проверьте логи в Railway Dashboard**
2. **Убедитесь, что PostgreSQL база данных запущена**
3. **Проверьте, что все таблицы созданы**

---

**🎉 После настройки у вас будет полноценный глобальный мессенджер с PostgreSQL!**