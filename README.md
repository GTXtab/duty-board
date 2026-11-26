# Графік чергування

Статичний сайт без сервера: підключаєш Google Таблицю за посиланням або вставляєш її вручну.
Посилання й остання копія зберігаються в браузері.

Потрібен Node.js, який підтримує встановлена версія Vite.

    npm install
    npm run dev      # локальна розробка
    npm test
    npm run build    # dist/index.html — самодостатній файл

## Публікація

Читання за посиланням працює лише з сайту, відкритого за http(s), а не з файлу на диску.
Найпростіше: репозиторій на GitHub, у нього завантажити `dist/index.html`,
далі Settings → Pages → Deploy from a branch.

## Вхід через Google (необов’язково)

1. У Google Cloud створи проєкт і ввімкни Google Sheets API та Google Calendar API.
2. Налаштуй екран згоди (External, режим Testing) і додай пошти користувачів у Test users.
3. Створи OAuth Client ID типу Web application; в Authorized JavaScript origins вкажи адресу сайту
   без шляху, наприклад `https://gtxtab.github.io`.
4. Запиши його у `.env.production` як `VITE_GOOGLE_CLIENT_ID` і збери проєкт.

Для галочок користувачу потрібна роль «Редактор» у таблиці.
