# 🔧 Установка Heroku CLI на Windows

## 📥 Способ 1: Прямая загрузка (РЕКОМЕНДУЕТСЯ)

1. **Перейдите на официальный сайт:**
   - Откройте: https://devcenter.heroku.com/articles/heroku-cli
   - Или прямая ссылка: https://cli-assets.heroku.com/heroku-x64.exe

2. **Скачайте установщик:**
   - Нажмите "Download for Windows"
   - Скачается файл `heroku-x64.exe`

3. **Установите:**
   - Запустите скачанный файл
   - Следуйте инструкциям установщика
   - Перезапустите командную строку

## 📥 Способ 2: Через PowerShell (если первый не работает)

1. **Откройте PowerShell как администратор:**
   - Нажмите Win + X
   - Выберите "Windows PowerShell (администратор)"

2. **Выполните команду:**
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://cli-assets.heroku.com/install.ps1'))
```

## ✅ Проверка установки

После установки откройте новую командную строку и выполните:

```cmd
heroku --version
```

Должно показать что-то вроде:
```
heroku/8.7.1 win32-x64 node-v18.17.1
```

## 🔑 Авторизация в Heroku

После установки CLI выполните:

```cmd
heroku login
```

Это откроет браузер для авторизации.

## 📊 Просмотр логов

Теперь вы можете просматривать логи:

```cmd
heroku logs --tail -a your-app-name
```

Замените `your-app-name` на имя вашего приложения в Heroku.

## 🆘 Если установка не работает

### Альтернатива 1: Логи через веб-интерфейс
1. Зайдите в панель Heroku
2. Выберите ваше приложение
3. Нажмите "More" → "View logs"

### Альтернатива 2: Использование Git Bash
1. Установите Git for Windows: https://git-scm.com/download/win
2. Git Bash часто лучше работает с CLI инструментами

### Альтернатива 3: Использование WSL
1. Установите Windows Subsystem for Linux
2. Установите Heroku CLI в Linux окружении

## 🎯 Быстрое решение проблемы

Если нужно срочно посмотреть логи:

1. **Через веб-интерфейс Heroku:**
   - Dashboard → Your App → More → View logs

2. **Проверьте статус приложения:**
   - Откройте ваш URL в браузере
   - Если показывает ошибку, проблема в коде сервера

3. **Проверьте файлы в GitHub:**
   - Убедитесь, что все файлы загружены
   - Особенно `package.json` и `server.js`

## 📞 Если ничего не помогает

Опишите:
1. Какую именно ошибку видите в браузере
2. Какие файлы загружены в GitHub репозиторий
3. Какое имя у вашего Heroku приложения

И мы найдем решение без CLI!