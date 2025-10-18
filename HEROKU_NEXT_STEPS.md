# 🎯 Следующие шаги для Heroku

## Что делать СЕЙЧАС:

### Шаг 1: Отказаться от pipeline
- Нажмите **"Cancel"** в окне "Add this app to a pipeline"
- Pipeline нам не нужен для простого сервера

### Шаг 2: Выбрать GitHub развертывание
1. **Нажмите на "GitHub" в разделе "Deployment method"**
2. **Нажмите "Connect to GitHub"**
3. **Авторизуйтесь в GitHub если нужно**

### Шаг 3: Подключить репозиторий
1. **В поле поиска введите:** `nemo-messenger-server`
2. **Найдите ваш репозиторий**
3. **Нажмите "Connect"**

### Шаг 4: Настроить автоматическое развертывание
1. **Включите "Automatic deploys"**
2. **Выберите ветку "main"**
3. **Нажмите "Enable Automatic Deploys"**

### Шаг 5: Первое развертывание
1. **В разделе "Manual deploy"**
2. **Нажмите "Deploy Branch"**
3. **Дождитесь завершения (2-3 минуты)**

## ✅ После развертывания:

Ваш сервер будет доступен по адресу:
```
https://nemo-messenger.herokuapp.com
```

## 🔧 Обновление клиента:

Замените URL в `src/services/globalDatabase.ts`:
```javascript
private databaseUrl = 'https://nemo-messenger.herokuapp.com';
```

## 🎉 Готово!

После этого все пользователи смогут общаться через ваш глобальный сервер!

---

**🚀 Начинайте с отмены pipeline и выбора GitHub!**