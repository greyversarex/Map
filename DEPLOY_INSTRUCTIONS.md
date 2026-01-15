# Инструкция по развертыванию EcoMap на Timeweb

## Данные сервера
- **IP адрес:** 195.133.25.78
- **Домен:** ecomap.space
- **SSH:** ssh root@195.133.25.78

---

## ШАГ 1: Подключение к серверу

Открой терминал (или PuTTY на Windows) и введи:
```bash
ssh root@195.133.25.78
```
Введи root-пароль из панели Timeweb.

---

## ШАГ 2: Установка необходимых программ

Выполни эти команды по очереди:

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка PostgreSQL
apt install -y postgresql postgresql-contrib

# Установка Nginx
apt install -y nginx

# Установка Git
apt install -y git

# Установка PM2 (для запуска приложения)
npm install -g pm2
```

---

## ШАГ 3: Настройка базы данных PostgreSQL

```bash
# Войти в PostgreSQL
sudo -u postgres psql

# В консоли PostgreSQL выполни:
CREATE DATABASE ecomap;
CREATE USER ecomap_user WITH ENCRYPTED PASSWORD 'твой_пароль_здесь';
GRANT ALL PRIVILEGES ON DATABASE ecomap TO ecomap_user;
\c ecomap
GRANT ALL ON SCHEMA public TO ecomap_user;
\q
```

**Важно:** Запомни пароль, который ты установил!

---

## ШАГ 4: Загрузка приложения

```bash
# Перейти в папку для приложений
cd /var/www

# Клонировать репозиторий
git clone https://github.com/greyversarex/Map.git ecomap

# Перейти в папку проекта
cd ecomap

# Установить зависимости
npm install
```

---

## ШАГ 5: Настройка переменных окружения

```bash
# Создать файл с настройками
nano .env
```

Вставь в файл следующее (замени пароль на свой):
```
DATABASE_URL=postgresql://ecomap_user:твой_пароль_здесь@localhost:5432/ecomap
SESSION_SECRET=ecomap_secret_key_2024_secure
ADMIN_USERNAME=admin
ADMIN_PASSWORD=твой_пароль_для_админки
NODE_ENV=production
PORT=3000
```

Нажми **Ctrl+X**, затем **Y**, затем **Enter** для сохранения.

---

## ШАГ 6: Инициализация базы данных

```bash
# Создать таблицы в базе данных
npm run db:push

# Загрузить начальные данные (если есть файл database-export.sql)
# psql postgresql://ecomap_user:твой_пароль@localhost:5432/ecomap < database-export.sql
```

---

## ШАГ 7: Сборка и запуск приложения

```bash
# Собрать production-версию
npm run build

# Запустить через PM2
pm2 start dist/index.cjs --name ecomap

# Настроить автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

---

## ШАГ 8: Настройка Nginx

```bash
# Создать конфигурацию
nano /etc/nginx/sites-available/ecomap
```

Вставь следующее:
```nginx
server {
    listen 80;
    server_name ecomap.space www.ecomap.space;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Сохрани файл (Ctrl+X, Y, Enter).

```bash
# Активировать конфигурацию
ln -s /etc/nginx/sites-available/ecomap /etc/nginx/sites-enabled/

# Удалить стандартную конфигурацию
rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Перезапустить Nginx
systemctl restart nginx
```

---

## ШАГ 9: Настройка SSL сертификата (HTTPS)

```bash
# Установить Certbot
apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
certbot --nginx -d ecomap.space -d www.ecomap.space
```

Следуй инструкциям на экране. Введи email и согласись с условиями.

---

## ШАГ 10: Проверка

Открой в браузере:
- https://ecomap.space - карта
- https://ecomap.space/admin - панель администратора

---

## Полезные команды

```bash
# Посмотреть статус приложения
pm2 status

# Посмотреть логи
pm2 logs ecomap

# Перезапустить приложение
pm2 restart ecomap

# Обновить приложение из GitHub
cd /var/www/ecomap
git pull
npm install
npm run build
pm2 restart ecomap
```

---

## Если что-то не работает

1. Проверь логи: `pm2 logs ecomap`
2. Проверь Nginx: `systemctl status nginx`
3. Проверь PostgreSQL: `systemctl status postgresql`
4. Убедись, что порт 3000 не занят: `lsof -i :3000`

---

## Контакты для поддержки

Если возникнут проблемы - напиши мне, помогу разобраться!
