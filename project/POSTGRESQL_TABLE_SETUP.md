# 🐘 Правильная настройка таблицы PostgreSQL

## ✅ Исправленная структура таблицы `users`:

### Основная таблица:
- **Table name:** `users`

### Колонки (добавляйте по одной):

**Колонка 1 (уже есть):**
- ✅ `id` - `serial` - `Primary Key`

**Колонка 2:**
- **Column name:** `user_id`
- **Type:** `text` (или `character varying(50)`)
- **Constraints:** `UNIQUE NOT NULL`

**Колонка 3:**
- **Column name:** `username`
- **Type:** `text` (или `character varying(50)`)
- **Constraints:** `UNIQUE NOT NULL`

**Колонка 4:**
- **Column name:** `password_hash`
- **Type:** `text` (или `character varying(255)`)
- **Constraints:** `NOT NULL`

**Колонка 5:**
- **Column name:** `display_name`
- **Type:** `text` (или `character varying(100)`)
- **Default:** `NULL`

**Колонка 6:**
- **Column name:** `device_type`
- **Type:** `text` (или `character varying(20)`)
- **Default:** `'desktop'`

**Колонка 7:**
- **Column name:** `is_online`
- **Type:** `boolean`
- **Default:** `false`

**Колонка 8:**
- **Column name:** `last_seen`
- **Type:** `timestamp with time zone`
- **Default:** `NOW()`

**Колонка 9:**
- **Column name:** `created_at`
- **Type:** `timestamp with time zone`
- **Default:** `NOW()`

**Колонка 10:**
- **Column name:** `is_deleted`
- **Type:** `boolean`
- **Default:** `false`

## 🔧 Альтернативный способ - SQL команда:

Если интерфейс не работает, используйте SQL консоль:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    device_type TEXT DEFAULT 'desktop',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);
```

## 📊 Дополнительные таблицы:

### Таблица сообщений:
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    is_delivered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Таблица сессий:
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    socket_id TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Индексы для оптимизации:
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
```

## ✅ Проверка создания:
После создания таблиц выполните:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

Должны увидеть: `users`, `messages`, `user_sessions`

---

**🎯 Используйте `text` вместо `varchar(50)` в PostgreSQL!**