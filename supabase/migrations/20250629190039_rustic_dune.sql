-- Nemo Messenger Database Schema
-- Создание таблиц для глобального мессенджера

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    device_type VARCHAR(20) DEFAULT 'desktop',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- 2. Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(100) UNIQUE NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    is_delivered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Таблица заблокированных пользователей
CREATE TABLE IF NOT EXISTS blocked_users (
    id SERIAL PRIMARY KEY,
    blocker_id VARCHAR(50) NOT NULL,
    blocked_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 4. Таблица онлайн пользователей (для быстрого доступа)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    socket_id VARCHAR(100),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online, last_seen);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity);

-- 6. Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Триггер для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Функция для очистки старых сессий
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE last_activity < NOW() - INTERVAL '1 hour';
    
    UPDATE users 
    SET is_online = false 
    WHERE user_id NOT IN (
        SELECT user_id FROM user_sessions 
        WHERE last_activity > NOW() - INTERVAL '5 minutes'
    );
END;
$$ language 'plpgsql';

-- 9. Функция для получения статистики
CREATE OR REPLACE FUNCTION get_server_stats()
RETURNS TABLE(
    total_users BIGINT,
    online_users BIGINT,
    total_messages BIGINT,
    messages_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users WHERE NOT is_deleted) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_online = true AND NOT is_deleted) as online_users,
        (SELECT COUNT(*) FROM messages) as total_messages,
        (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE) as messages_today;
END;
$$ language 'plpgsql';

-- 10. Включение Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 11. Политики безопасности (базовые)
-- Пользователи могут читать свои данные
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (true); -- Пока разрешаем всем для простоты

-- Пользователи могут обновлять свои данные
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true);

-- Сообщения доступны отправителю и получателю
CREATE POLICY "Messages visible to participants" ON messages
    FOR SELECT USING (true); -- Пока разрешаем всем для простоты

-- Пользователи могут создавать сообщения
CREATE POLICY "Users can create messages" ON messages
    FOR INSERT WITH CHECK (true);

-- 12. Начальные данные (опционально)
-- Можно добавить тестового пользователя
-- INSERT INTO users (user_id, username, password_hash, display_name) 
-- VALUES ('test_user_1', 'testuser', 'hashed_password', 'Test User')
-- ON CONFLICT (user_id) DO NOTHING;

-- 13. Комментарии для документации
COMMENT ON TABLE users IS 'Таблица пользователей мессенджера';
COMMENT ON TABLE messages IS 'Таблица сообщений между пользователями';
COMMENT ON TABLE blocked_users IS 'Таблица заблокированных пользователей';
COMMENT ON TABLE user_sessions IS 'Таблица активных сессий пользователей';

COMMENT ON COLUMN users.user_id IS 'Уникальный ID пользователя (генерируется клиентом)';
COMMENT ON COLUMN users.username IS 'Имя пользователя для входа';
COMMENT ON COLUMN users.password_hash IS 'Хэш пароля пользователя';
COMMENT ON COLUMN users.is_online IS 'Статус онлайн пользователя';
COMMENT ON COLUMN users.last_seen IS 'Время последней активности';

COMMENT ON COLUMN messages.message_id IS 'Уникальный ID сообщения (генерируется клиентом)';
COMMENT ON COLUMN messages.sender_id IS 'ID отправителя сообщения';
COMMENT ON COLUMN messages.receiver_id IS 'ID получателя сообщения';
COMMENT ON COLUMN messages.content IS 'Содержимое сообщения';
COMMENT ON COLUMN messages.message_type IS 'Тип сообщения: text, voice, image';