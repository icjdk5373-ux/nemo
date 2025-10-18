-- 🐘 ПОЛНАЯ СТРУКТУРА БАЗЫ ДАННЫХ NEMO MESSENGER
-- Выполните этот SQL код в консоли PostgreSQL на Railway

-- 1. Основная таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    device_type TEXT DEFAULT 'desktop',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- 2. Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    is_delivered BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Таблица заблокированных пользователей
CREATE TABLE IF NOT EXISTS blocked_users (
    id SERIAL PRIMARY KEY,
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 4. Таблица активных сессий
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    socket_id TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Таблица истории поиска (для аналитики)
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    searcher_id TEXT NOT NULL,
    search_query TEXT NOT NULL,
    found_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ
-- Индексы для таблицы users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online, last_seen);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(is_deleted);

-- Индексы для таблицы messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Индексы для таблицы blocked_users
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Индексы для таблицы user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_socket ON user_sessions(socket_id);

-- Индексы для таблицы search_history
CREATE INDEX IF NOT EXISTS idx_search_history_searcher ON search_history(searcher_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(search_query);
CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(created_at);

-- 7. ФУНКЦИИ ДЛЯ АВТОМАТИЗАЦИИ

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at в таблице users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для очистки старых данных
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Удаляем старые сессии (более 2 часов неактивности)
    DELETE FROM user_sessions 
    WHERE last_activity < NOW() - INTERVAL '2 hours';
    
    -- Помечаем пользователей как оффлайн если нет активной сессии
    UPDATE users 
    SET is_online = false 
    WHERE user_id NOT IN (
        SELECT user_id FROM user_sessions 
        WHERE last_activity > NOW() - INTERVAL '10 minutes'
    ) AND is_online = true;
    
    -- Удаляем старые сообщения (старше 30 дней)
    DELETE FROM messages 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Удаляем старую историю поиска (старше 7 дней)
    DELETE FROM search_history 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    RAISE NOTICE 'Очистка старых данных завершена';
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики сервера
CREATE OR REPLACE FUNCTION get_server_stats()
RETURNS TABLE(
    total_users BIGINT,
    online_users BIGINT,
    total_messages BIGINT,
    messages_today BIGINT,
    messages_this_week BIGINT,
    active_sessions BIGINT,
    blocked_users_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users WHERE NOT is_deleted) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_online = true AND NOT is_deleted) as online_users,
        (SELECT COUNT(*) FROM messages) as total_messages,
        (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE) as messages_today,
        (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as messages_this_week,
        (SELECT COUNT(*) FROM user_sessions WHERE last_activity > NOW() - INTERVAL '10 minutes') as active_sessions,
        (SELECT COUNT(*) FROM blocked_users) as blocked_users_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для поиска пользователей (с поддержкой частичного поиска)
CREATE OR REPLACE FUNCTION search_users(search_query TEXT, searcher_id TEXT DEFAULT NULL)
RETURNS TABLE(
    user_id TEXT,
    username TEXT,
    display_name TEXT,
    device_type TEXT,
    is_online BOOLEAN,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Записываем поиск в историю (если указан searcher_id)
    IF searcher_id IS NOT NULL THEN
        INSERT INTO search_history (searcher_id, search_query)
        VALUES (searcher_id, search_query);
    END IF;
    
    -- Возвращаем результаты поиска
    RETURN QUERY
    SELECT 
        u.user_id,
        u.username,
        u.display_name,
        u.device_type,
        u.is_online,
        u.last_seen
    FROM users u
    WHERE (
        u.username ILIKE '%' || search_query || '%' 
        OR u.user_id = search_query
        OR u.display_name ILIKE '%' || search_query || '%'
    )
    AND NOT u.is_deleted
    AND (searcher_id IS NULL OR u.user_id != searcher_id)
    ORDER BY 
        CASE WHEN u.username = search_query THEN 1 ELSE 2 END,
        CASE WHEN u.is_online THEN 1 ELSE 2 END,
        u.last_seen DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 8. ПОЛИТИКИ БЕЗОПАСНОСТИ (Row Level Security)
-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Базовые политики (можно настроить позже)
-- Пока разрешаем все операции для упрощения разработки
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON blocked_users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON search_history FOR ALL USING (true);

-- 9. НАЧАЛЬНЫЕ ДАННЫЕ (опционально)
-- Создаем тестового пользователя для проверки
INSERT INTO users (user_id, username, password_hash, display_name, device_type) 
VALUES (
    'test_user_001', 
    'testuser', 
    '$2b$10$example.hash.for.testing.purposes.only', 
    'Test User',
    'desktop'
)
ON CONFLICT (user_id) DO NOTHING;

-- 10. КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
COMMENT ON TABLE users IS 'Основная таблица пользователей мессенджера';
COMMENT ON TABLE messages IS 'Таблица сообщений между пользователями';
COMMENT ON TABLE blocked_users IS 'Таблица заблокированных пользователей';
COMMENT ON TABLE user_sessions IS 'Таблица активных сессий пользователей';
COMMENT ON TABLE search_history IS 'История поиска пользователей для аналитики';

-- Комментарии к важным колонкам
COMMENT ON COLUMN users.user_id IS 'Уникальный ID пользователя (генерируется клиентом)';
COMMENT ON COLUMN users.username IS 'Имя пользователя для входа (уникальное)';
COMMENT ON COLUMN users.password_hash IS 'Хэш пароля пользователя (bcrypt)';
COMMENT ON COLUMN users.is_online IS 'Текущий статус онлайн пользователя';
COMMENT ON COLUMN users.last_seen IS 'Время последней активности пользователя';

COMMENT ON COLUMN messages.message_id IS 'Уникальный ID сообщения (генерируется клиентом)';
COMMENT ON COLUMN messages.sender_id IS 'ID отправителя сообщения';
COMMENT ON COLUMN messages.receiver_id IS 'ID получателя сообщения';
COMMENT ON COLUMN messages.content IS 'Содержимое сообщения (текст или данные)';
COMMENT ON COLUMN messages.message_type IS 'Тип сообщения: text, voice, image, file';

-- 11. ПРОВЕРКА СОЗДАНИЯ ТАБЛИЦ
-- Выводим список созданных таблиц
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'messages', 'blocked_users', 'user_sessions', 'search_history')
ORDER BY table_name;

-- Выводим статистику по таблицам
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    typname as data_type
FROM pg_stats 
JOIN pg_type ON pg_stats.staattnum = pg_type.oid
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'messages', 'blocked_users', 'user_sessions', 'search_history')
ORDER BY tablename, attname;

-- 12. ТЕСТОВЫЕ ЗАПРОСЫ
-- Проверяем функцию статистики
SELECT * FROM get_server_stats();

-- Проверяем функцию поиска
SELECT * FROM search_users('test');

-- Проверяем очистку данных (осторожно!)
-- SELECT cleanup_old_data();

-- ГОТОВО! 🎉
-- База данных настроена и готова к работе
-- Все таблицы созданы с оптимальными индексами
-- Функции автоматизации настроены
-- Система безопасности включена