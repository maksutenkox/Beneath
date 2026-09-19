# BELOW PROTOCOL — публикация и Telegram

Бот: https://t.me/BeneathhBot

Игра: https://beneath-byz.pages.dev/

Кнопка меню `Play BELOW PROTOCOL` ведёт на стабильный Cloudflare Pages адрес. Telegram API подтвердил настройки обратным чтением. Токен не сохранён в проекте. Настройка воспроизводится через `scripts/connect-telegram.mjs` с переменной окружения `TELEGRAM_BOT_TOKEN`; скрипт не входит в клиентскую сборку.

## Новый визуальный набор side-view

Героиня: 40 runtime-кадров и атлас 512×480. Состояния: idle, run, jump start, jump, fall, land, атака клавиатурой, interaction, hurt и death.

Окружение: 16 кадров и атлас 512×512 — верстак, манекен, лифт, лестница, стол, сервер, принтер, кулер, шкаф, растение, баррикада, коробки, свет, вентиляция, монитор и кабели.

Пути: `src/game/assets/below-protocol/heroine-side.png` и `src/game/assets/below-protocol/hub-props.png`.

Runtime использует только подготовленные локальные PNG, nearest-neighbor и не содержит токенов либо сетевых загрузок графики. Старый изометрический набор удалён из рабочей ветки и остаётся доступен через историю Git.
