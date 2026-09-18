# BENEATH — предметы и подключение Telegram

Бот: https://t.me/BeneathhBot

Игра: https://beneath-byz.pages.dev/

Кнопка меню `Play BENEATH` настроена через Telegram Bot API. Независимая обратная проверка `getChatMenuButton` подтвердила тип `web_app` и адрес игры. Токен не сохранён в проекте. Настройка воспроизводится через scripts/connect-telegram.mjs с переменной окружения TELEGRAM_BOT_TOKEN. Скрипт не входит в клиент игры. Запуск на физическом телефоне внутри Telegram требует проверки пользователем; кнопка меню не означает настройку Main Mini App в BotFather или обработчика /start.

## Новый визуальный набор

16 кадров 96×96 и атлас 384×384: скамья, табурет, стеллаж, вентилятор, труба с вентилем, кабель, инструменты, электрический щит, оружейная стойка, кейс с пистолетом, ящик боеприпасов, дробовик, медицинский шкаф, канистра воды, пищевой ящик, рюкзак.

Путь атласа: src/game/assets/environment/details/details.png. Отдельные PNG находятся рядом. Визуальные замены используют прежние объекты: оружейная стойка вместо складского стеллажа, ящик боеприпасов вместо контейнера, кейс и дробовик в мастерской. Расположение комнат, коллизии, взаимодействия и ресурсы не изменены. Оружие — оформление, не новая боевая система и не экипируемый предмет.

## Генерация

Использован встроенный imagegen. Исходный лист героини служил только стилевым референсом. Полученный фон оказался нарисованной шахматной сеткой, а не прозрачностью; при подготовке кадров нейтральный светлый фон удалён. Результат проверен после нарезки. Небольшие края и пиксельные детали ещё требуют художественной полировки.

Prompt: Production 4×4 uniformly spaced game sprite atlas for BENEATH, 2:1 isometric isolated objects. Serious detailed modern survival pixel art, muted olive/teal/rust palette, crisp pixel clusters, worn metal and wood, restrained highlights, no cartoon outlines or glossy 3D. Rows: bench, stool, supply shelving, ventilation fan; pipe valve, cable, toolbox, electrical panel; generic rifle rack, pistol maintenance case, ammunition box, pump shotgun; medical cabinet, water canister, food crate, olive backpack. Equal cells, generous margins, transparent background, no people, no text, no floor tiles.

Raw generation: exec-1275867e-026d-49a2-82c3-7b949f3f3f02.png. Runtime uses only the prepared local atlas and nearest-neighbor rendering, without image-processing dependencies.
