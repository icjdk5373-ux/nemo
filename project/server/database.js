// Модуль для работы с PostgreSQL базой данных
const { Pool } = require('pg');

class DatabaseManager {
  constructor() {
    // Подключение к PostgreSQL через переменные окружения Railway
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.init();
  }

  async init() {
    try {
      // Проверяем подключение
      const client = await this.pool.connect();
      console.log('✅ Подключение к PostgreSQL установлено');
      client.release();
      
      // Создаем таблицы если их нет
      await this.createTables();
    } catch (error) {
      console.error('❌ Ошибка подключения к PostgreSQL:', error);
    }
  }

  async createTables() {
    const client = await this.pool.connect();
    try {
      // Создаем таблицы (упрощенная версия)
      await client.query(`
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
      `);

      await client.query(`
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
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(50) UNIQUE NOT NULL,
          socket_id VARCHAR(100),
          last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Создаем индексы
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
      `);

      console.log('✅ Таблицы PostgreSQL созданы/проверены');
    } catch (error) {
      console.error('❌ Ошибка создания таблиц:', error);
    } finally {
      client.release();
    }
  }

  // Регистрация пользователя
  async registerUser(userData) {
    const client = await this.pool.connect();
    try {
      const { user_id, username, password_hash, display_name, device_type } = userData;
      
      const result = await client.query(`
        INSERT INTO users (user_id, username, password_hash, display_name, device_type, is_online)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (user_id) DO UPDATE SET
          is_online = true,
          last_seen = NOW(),
          device_type = $5
        RETURNING *;
      `, [user_id, username, password_hash, display_name, device_type]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка регистрации пользователя:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Поиск пользователя
  async searchUser(query) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT user_id, username, display_name, device_type, is_online, last_seen
        FROM users 
        WHERE (username ILIKE $1 OR user_id = $2) 
          AND NOT is_deleted
        LIMIT 1;
      `, [`%${query}%`, query]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка поиска пользователя:', error);
      return null;
    } finally {
      client.release();
    }
  }

  // Сохранение сообщения
  async saveMessage(messageData) {
    const client = await this.pool.connect();
    try {
      const { message_id, sender_id, receiver_id, content, message_type } = messageData;
      
      const result = await client.query(`
        INSERT INTO messages (message_id, sender_id, receiver_id, content, message_type, is_delivered)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *;
      `, [message_id, sender_id, receiver_id, content, message_type]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Получение сообщений для пользователя
  async getMessagesForUser(userId, limit = 100) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM messages 
        WHERE receiver_id = $1 AND NOT is_read
        ORDER BY created_at DESC
        LIMIT $2;
      `, [userId, limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      return [];
    } finally {
      client.release();
    }
  }

  // Обновление статуса пользователя
  async updateUserStatus(userId, isOnline, socketId = null) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE users 
        SET is_online = $1, last_seen = NOW()
        WHERE user_id = $2;
      `, [isOnline, userId]);

      if (isOnline && socketId) {
        // Обновляем сессию
        await client.query(`
          INSERT INTO user_sessions (user_id, socket_id, last_activity)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            socket_id = $2,
            last_activity = NOW();
        `, [userId, socketId]);
      } else {
        // Удаляем сессию
        await client.query(`
          DELETE FROM user_sessions WHERE user_id = $1;
        `, [userId]);
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    } finally {
      client.release();
    }
  }

  // Получение онлайн пользователей
  async getOnlineUsers() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT u.user_id, u.username, u.display_name, u.device_type, u.last_seen
        FROM users u
        INNER JOIN user_sessions s ON u.user_id = s.user_id
        WHERE u.is_online = true 
          AND s.last_activity > NOW() - INTERVAL '5 minutes'
          AND NOT u.is_deleted;
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка получения онлайн пользователей:', error);
      return [];
    } finally {
      client.release();
    }
  }

  // Получение статистики
  async getStats() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE NOT is_deleted) as total_users,
          (SELECT COUNT(*) FROM users WHERE is_online = true AND NOT is_deleted) as online_users,
          (SELECT COUNT(*) FROM messages) as total_messages,
          (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE) as messages_today;
      `);
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return {
        total_users: 0,
        online_users: 0,
        total_messages: 0,
        messages_today: 0
      };
    } finally {
      client.release();
    }
  }

  // Очистка старых данных
  async cleanup() {
    const client = await this.pool.connect();
    try {
      // Удаляем старые сессии (более 1 часа)
      await client.query(`
        DELETE FROM user_sessions 
        WHERE last_activity < NOW() - INTERVAL '1 hour';
      `);

      // Помечаем пользователей как оффлайн если нет активной сессии
      await client.query(`
        UPDATE users 
        SET is_online = false 
        WHERE user_id NOT IN (
          SELECT user_id FROM user_sessions 
          WHERE last_activity > NOW() - INTERVAL '5 minutes'
        );
      `);

      // Удаляем старые сообщения (старше 7 дней)
      const result = await client.query(`
        DELETE FROM messages 
        WHERE created_at < NOW() - INTERVAL '7 days';
      `);

      if (result.rowCount > 0) {
        console.log(`🧹 Очищено ${result.rowCount} старых сообщений`);
      }
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
    } finally {
      client.release();
    }
  }

  // Закрытие пула соединений
  async close() {
    await this.pool.end();
    console.log('🔌 Соединение с PostgreSQL закрыто');
  }
}

module.exports = DatabaseManager;