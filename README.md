# DOCX Worker

Микросервис-воркер для обработки DOCX-шаблонов: заполнение данными и конвертация в PDF.

## 📋 Описание

Сервис слушает очередь RabbitMQ, получает задачи на заполнение DOCX-шаблонов данными, выполняет подстановку через `docxtpl`, конвертирует результат в PDF через LibreOffice и публикует готовые документы в выходную очередь.

### Основные возможности

- 🔄 **Последовательная обработка** — одно сообщение за раз, без потоков
- 🛡️ **Обработка ошибок** — все ошибки отправляются в ERROR_QUEUE с полным контекстом
- 📊 **JSON-логирование** — структурированные логи с correlation_id
- 🔁 **Автопереподключение** — автоматическое восстановление связи с RabbitMQ
- 📦 **Docker-ready** — готовый Dockerfile и docker-compose.yml
- 🔤 **Шрифт Verdana** — установлен в контейнере для корректного рендеринга

## 🏗️ Архитектура

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│INPUT_QUEUE  │─────▶│ DOCX Worker  │─────▶│ OUTPUT_QUEUE    │
│(docx_tasks) │      │              │      │(docx_results)   │
└─────────────┘      │  1. Загрузка │      └─────────────────┘
                     │  2. Рендер   │
                     │  3. PDF      │      ┌─────────────────┐
                     │  4. Публикац.│─────▶│ ERROR_QUEUE     │
                     └──────────────┘      │(docx_errors)    │
                                           └─────────────────┘
```

## 📂 Структура проекта

```
docx-worker/
├── worker.py                 # Основной модуль воркера
├── Dockerfile                # Образ контейнера
├── docker-compose.yml        # Оркестрация сервисов
├── requirements.txt          # Python-зависимости
├── .env.example              # Шаблон переменных окружения
├── README.md                 # Документация проекта
└── project_description.txt   # Полное описание задачи
```

## 🚀 Быстрый старт

### 1. Клонирование и настройка

```bash
git clone <repository-url>
cd docx-worker
cp .env.example .env
```

### 2. Запуск через Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов воркера
docker-compose logs -f worker

# Остановка
docker-compose down
```

### 3. Локальная разработка (без Docker)

```bash
# Создать виртуальное окружение
python3.13 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Установить зависимости
pip install -r requirements.txt

# Запустить (нужен RabbitMQ и LibreOffice локально)
python worker.py
```

## 📨 Форматы сообщений

### Входящее сообщение (INPUT_QUEUE)

```json
{
  "template_name": "имя_шаблона.docx",
  "docx_content_base64": "base64-содержимое .docx шаблона",
  "data": {
    "client_name": "Иванов Иван Иванович",
    "contract_number": "2026-001",
    "date": "01.01.2026"
  },
  "metadata": {
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
    "source_system": "crm",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

### Успешный результат (OUTPUT_QUEUE)

```json
{
  "pdf_content_base64": "base64 PDF документа",
  "docx_content_base64": "base64 заполненного DOCX",
  "original_metadata": {
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
    "source_system": "crm",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "status": "success",
  "template_name": "имя_шаблона.docx"
}
```

### Ошибка (ERROR_QUEUE)

```json
{
  "original_message": { ... },
  "error_message": "RuntimeError: LibreOffice conversion failed",
  "status": "error",
  "timestamp": "2026-01-01T00:00:00Z"
}
```

## ⚙️ Конфигурация

### Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `RABBITMQ_HOST` | `localhost` | Хост RabbitMQ |
| `RABBITMQ_PORT` | `5672` | Порт RabbitMQ |
| `RABBITMQ_USER` | `guest` | Пользователь RabbitMQ |
| `RABBITMQ_PASS` | `guest` | Пароль RabbitMQ |
| `INPUT_QUEUE` | `docx_tasks` | Входящая очередь задач |
| `OUTPUT_QUEUE` | `docx_results` | Очередь успешных результатов |
| `ERROR_QUEUE` | `docx_errors` | Очередь ошибок |
| `LOG_LEVEL` | `INFO` | Уровень логирования (DEBUG/INFO/WARNING/ERROR) |
| `LIBREOFFICE_PATH` | `libreoffice` | Путь к исполняемому файлу LibreOffice |

### Python-зависимости

- `pika==1.3.2` — клиент RabbitMQ (BlockingConnection)
- `python-docx==1.1.0` — чтение/запись DOCX файлов
- `docxtpl==0.17.0` — шаблонизация DOCX (Jinja2)
- `python-json-logger==2.0.7` — JSON-форматирование логов

## 🐳 Docker

### Dockerfile

Образ основан на `python:3.13-slim` и включает:
- LibreOffice (core + writer)
- Шрифты: Verdana (через ttf-mscorefonts-installer), DejaVu
- Все Python-зависимости из requirements.txt

### docker-compose.yml

Сервисы:
- **worker** — микросервис обработки документов
- **rabbitmq** — брокер сообщений (с Management UI)

Порты:
- `5672` — RabbitMQ AMQP
- `15672` — RabbitMQ Management UI (http://localhost:15672)

### Команды Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов воркера
docker-compose logs -f worker

# Пересборка после изменений
docker-compose up -d --build

# Остановка
docker-compose down

# Остановка с удалением данных
docker-compose down -v
```

## 📊 Логирование

Все логи выводятся в JSON-формате через `pythonjsonlogger.JsonFormatter`.

Пример лога:

```json
{
  "timestamp": "2026-01-01T00:00:00Z",
  "level": "INFO",
  "name": "docx_worker",
  "message": "Document processing completed successfully",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "template_name": "contract.docx"
}
```

Логируются:
- Получение сообщения
- Старт обработки
- Успешное завершение
- Ошибки
- Публикация результатов

## 🔧 Алгоритм обработки

1. Получить сообщение из INPUT_QUEUE
2. Декодировать `docx_content_base64` → байты
3. Загрузить `DocxTemplate` из BytesIO
4. Выполнить `template.render(data)`
5. Сохранить заполненный DOCX во временный файл
6. Вызвать LibreOffice: `--headless --convert-to pdf`
7. Прочитать PDF, закодировать в base64
8. Опубликовать результат в OUTPUT_QUEUE
9. Удалить временные файлы, ack сообщение

## 🧪 Тестирование

### Отправка тестового сообщения

```python
import pika
import json
import base64

# Прочитать шаблон
with open('template.docx', 'rb') as f:
    docx_base64 = base64.b64encode(f.read()).decode('utf-8')

# Сформировать сообщение
message = {
    "template_name": "template.docx",
    "docx_content_base64": docx_base64,
    "data": {
        "client_name": "Тестовый клиент",
        "contract_number": "TEST-001"
    },
    "metadata": {
        "correlation_id": "test-123",
        "source": "test_script"
    }
}

# Отправить в очередь
connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')
)
channel = connection.channel()
channel.queue_declare(queue='docx_tasks', durable=True)
channel.basic_publish(
    exchange='',
    routing_key='docx_tasks',
    body=json.dumps(message),
    properties=pika.BasicProperties(delivery_mode=2)
)
connection.close()
```

## 📝 Лицензия

MIT

## 👥 Авторы

Создано для автоматизации обработки документов.

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs worker`
2. Убедитесь, что RabbitMQ доступен
3. Проверьте наличие LibreOffice в контейнере
4. Проверьте корректность формата входящего сообщения
