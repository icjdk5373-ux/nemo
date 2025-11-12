# 📁 Создание GitHub репозитория для сервера

## 🎯 Пошаговая инструкция:

### Шаг 1: Создание репозитория на GitHub
1. **Откройте [github.com](https://github.com)**
2. **Нажмите зеленую кнопку "New" или "+"** (правый верхний угол)
3. **Выберите "New repository"**

### Шаг 2: Настройка репозитория
1. **Repository name:** `nemo-messenger-server`
2. **Description:** `Глобальный сервер для Nemo Messenger`
3. **Visibility:** `Public` (обязательно для бесплатного Heroku)
4. **✅ Поставьте галочку "Add a README file"**
5. **Нажмите "Create repository"**

### Шаг 3: Загрузка файлов сервера
1. **В созданном репозитории нажмите "uploading an existing file"**
2. **Перетащите все файлы из папки `server/`:**
   - ✅ `package.json`
   - ✅ `server.js`
   - ✅ `Procfile`
   - ✅ `README.md`
   - ✅ `.env.example`

3. **Внизу страницы:**
   - **Commit message:** `Добавлен глобальный сервер для Nemo Messenger`
   - **Нажмите "Commit changes"**

### Шаг 4: Проверка
Убедитесь, что в репозитории есть все файлы:
- ✅ package.json (с зависимостями)
- ✅ server.js (основной файл сервера)
- ✅ Procfile (для Heroku)
- ✅ README.md (описание)

## 🔄 Возврат к Heroku
После создания репозитория:
1. **Вернитесь в Heroku**
2. **В поле поиска введите:** `nemo-messenger-server`
3. **Найдите ваш репозиторий и нажмите "Connect"**

---

**🎯 Название репозитория: `nemo-messenger-server`**