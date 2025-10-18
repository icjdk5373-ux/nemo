# 🚄 Railway - Быстрая настройка (БЕЗ КАРТЫ!)

## ⚡ 5 минут до запуска:

### Шаг 1: Переход на Railway
1. **Откройте [railway.app](https://railway.app)**
2. **Нажмите "Start a New Project"**

### Шаг 2: Авторизация
1. **Нажмите "Login with GitHub"**
2. **Разрешите доступ Railway к GitHub**

### Шаг 3: Развертывание
1. **Нажмите "Deploy from GitHub repo"**
2. **Найдите репозиторий `nemo-messenger-server`**
3. **Нажмите "Deploy Now"**

### Шаг 4: Получение URL
1. **Дождитесь завершения (2-3 минуты)**
2. **Скопируйте URL из раздела "Deployments"**
3. **URL будет вида:** `https://your-project.up.railway.app`

## ✅ Преимущества Railway:
- 🆓 **Полностью бесплатно**
- 🚫 **Никаких карт**
- ⚡ **Не засыпает**
- 🔄 **Автообновления**
- 🌍 **Глобальный доступ**

## 🔧 Обновление клиента:
```javascript
// В src/services/globalDatabase.ts
private databaseUrl = 'https://your-project.up.railway.app';
```

## 🎉 Готово!
Ваш сервер работает БЕЗ карт и проблем!

---
**💡 Railway намного лучше Heroku для наших целей!**