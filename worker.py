"""
Document Processing Worker
==========================
Микросервис для обработки DOCX-шаблонов: заполнение данными и конвертация в PDF.
Слушает RabbitMQ, обрабатывает сообщения последовательно.
"""

import base64
import io
import json
import logging
import os
import signal
import subprocess
import tempfile
import time
import uuid
from datetime import datetime, timezone

import pika
from docxtpl import DocxTemplate
from pythonjsonlogger import jsonlogger


# ─── Configuration ───────────────────────────────────────────────────────────

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
INPUT_QUEUE = os.getenv("INPUT_QUEUE", "docx_tasks")
OUTPUT_QUEUE = os.getenv("OUTPUT_QUEUE", "docx_results")
ERROR_QUEUE = os.getenv("ERROR_QUEUE", "docx_errors")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LIBREOFFICE_PATH = os.getenv("LIBREOFFICE_PATH", "libreoffice")

# ─── Tuning Constants ────────────────────────────────────────────────────────

LIBREOFFICE_TIMEOUT = int(os.getenv("LIBREOFFICE_TIMEOUT", "120"))
MAX_MESSAGE_SIZE = int(os.getenv("MAX_MESSAGE_SIZE", str(50 * 1024 * 1024)))  # 50 MB
RECONNECT_BASE_DELAY = 5       # секунды
RECONNECT_MAX_DELAY = 60       # секунды
RABBITMQ_HEARTBEAT = 600
RABBITMQ_BLOCKED_TIMEOUT = 300


# ─── Logging Setup ───────────────────────────────────────────────────────────

def setup_logging() -> logging.Logger:
    """Настройка структурированного JSON-логирования."""
    logger = logging.getLogger("docx_worker")
    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt="%(timestamp)s %(level)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False
    return logger


logger = setup_logging()


# ─── Graceful Shutdown ───────────────────────────────────────────────────────

_shutdown_requested = False


def _signal_handler(signum: int, frame) -> None:
    """Обработчик сигналов SIGTERM/SIGINT для graceful shutdown."""
    global _shutdown_requested
    sig_name = signal.Signals(signum).name
    logger.info("Shutdown signal received", extra={"signal": sig_name})
    _shutdown_requested = True


signal.signal(signal.SIGTERM, _signal_handler)
signal.signal(signal.SIGINT, _signal_handler)


# ─── RabbitMQ Connection ─────────────────────────────────────────────────────

def get_connection() -> pika.BlockingConnection:
    """Создание подключения к RabbitMQ."""
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
        heartbeat=RABBITMQ_HEARTBEAT,
        blocked_connection_timeout=RABBITMQ_BLOCKED_TIMEOUT,
    )
    return pika.BlockingConnection(parameters)


def declare_queues(channel: pika.adapters.blocking_connection.BlockingChannel) -> None:
    """Объявление всех очередей (idempotent)."""
    channel.queue_declare(queue=INPUT_QUEUE, durable=True)
    channel.queue_declare(queue=OUTPUT_QUEUE, durable=True)
    channel.queue_declare(queue=ERROR_QUEUE, durable=True)


# ─── Validation ──────────────────────────────────────────────────────────────

def validate_message(message: dict) -> None:
    """
    Валидация обязательных полей входящего сообщения.
    Raises ValueError при невалидном сообщении.
    """
    required_fields = ["template_name", "docx_content_base64", "data", "metadata"]
    missing = [f for f in required_fields if f not in message]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    if not isinstance(message["data"], dict):
        raise ValueError("'data' must be a JSON object")

    if not isinstance(message["metadata"], dict):
        raise ValueError("'metadata' must be a JSON object")

    # Проверка base64
    try:
        decoded = base64.b64decode(message["docx_content_base64"], validate=True)
        if len(decoded) == 0:
            raise ValueError("'docx_content_base64' is empty")
    except Exception as e:
        raise ValueError(f"Invalid base64 in 'docx_content_base64': {e}")


# ─── Document Processing ─────────────────────────────────────────────────────

def process_document(docx_base64: str, data: dict) -> tuple[str, str]:
    """
    Заполняет DOCX-шаблон данными и конвертирует в PDF.

    Args:
        docx_base64: base64-содержимое .docx шаблона
        data: данные для подстановки в шаблон

    Returns:
        Кортеж (pdf_base64, docx_base64) — результаты в base64
    """
    # 1. Декодировать шаблон
    docx_bytes = base64.b64decode(docx_base64)

    # 2. Загрузить шаблон
    docx_stream = io.BytesIO(docx_bytes)
    template = DocxTemplate(docx_stream)

    # 3. Заполнить шаблон данными
    template.render(data)

    # 4. Сохранить заполненный DOCX
    filled_docx_stream = io.BytesIO()
    template.save(filled_docx_stream)
    filled_docx_bytes = filled_docx_stream.getvalue()

    # 5. Использовать TemporaryDirectory для автоматической очистки
    with tempfile.TemporaryDirectory(prefix="docx_worker_") as tmp_dir:
        tmp_docx_path = os.path.join(tmp_dir, f"{uuid.uuid4().hex}.docx")

        with open(tmp_docx_path, "wb") as f:
            f.write(filled_docx_bytes)

        # 6. Изолированный профиль LibreOffice (предотвращает зависания)
        lo_profile_dir = os.path.join(tmp_dir, "lo_profile")
        os.makedirs(lo_profile_dir, exist_ok=True)

        # 7. Конвертировать в PDF через LibreOffice
        result = subprocess.run(
            [
                LIBREOFFICE_PATH,
                "--headless",
                "--norestore",
                "--safe",
                f"-env:UserInstallation=file://{lo_profile_dir}",
                "--convert-to",
                "pdf",
                tmp_docx_path,
                "--outdir",
                tmp_dir,
            ],
            capture_output=True,
            text=True,
            timeout=LIBREOFFICE_TIMEOUT,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"LibreOffice conversion failed (exit code {result.returncode}): "
                f"{result.stderr}"
            )

        # 8. Прочитать получившийся PDF
        pdf_filename = os.path.splitext(os.path.basename(tmp_docx_path))[0] + ".pdf"
        pdf_path = os.path.join(tmp_dir, pdf_filename)

        if not os.path.exists(pdf_path):
            raise RuntimeError(
                f"PDF file not found after conversion. Expected: {pdf_path}"
            )

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

    # TemporaryDirectory автоматически удалён здесь (включая ошибки)

    # 9. Кодировать результаты в base64
    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
    docx_filled_base64 = base64.b64encode(filled_docx_bytes).decode("utf-8")

    return pdf_base64, docx_filled_base64


# ─── Message Handlers ────────────────────────────────────────────────────────

def publish_success(
    channel: pika.adapters.blocking_connection.BlockingChannel,
    pdf_base64: str,
    docx_base64: str,
    metadata: dict,
    template_name: str,
) -> None:
    """Публикация успешного результата в OUTPUT_QUEUE."""
    result_message = {
        "pdf_content_base64": pdf_base64,
        "docx_content_base64": docx_base64,
        "original_metadata": metadata,
        "status": "success",
        "template_name": template_name,
    }

    channel.basic_publish(
        exchange="",
        routing_key=OUTPUT_QUEUE,
        body=json.dumps(result_message, ensure_ascii=False),
        properties=pika.BasicProperties(
            delivery_mode=2,  # persistent
            content_type="application/json",
        ),
    )

    logger.info(
        "Published success result",
        extra={
            "correlation_id": metadata.get("correlation_id", "unknown"),
            "template_name": template_name,
            "queue": OUTPUT_QUEUE,
        },
    )


def publish_error(
    channel: pika.adapters.blocking_connection.BlockingChannel,
    original_message: dict,
    error_message: str,
) -> None:
    """Публикация ошибки в ERROR_QUEUE."""
    error_payload = {
        "original_message": original_message,
        "error_message": error_message,
        "status": "error",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    channel.basic_publish(
        exchange="",
        routing_key=ERROR_QUEUE,
        body=json.dumps(error_payload, ensure_ascii=False),
        properties=pika.BasicProperties(
            delivery_mode=2,  # persistent
            content_type="application/json",
        ),
    )

    correlation_id = original_message.get("metadata", {}).get(
        "correlation_id", "unknown"
    )
    logger.error(
        "Published error message",
        extra={
            "correlation_id": correlation_id,
            "template_name": original_message.get("template_name", "unknown"),
            "queue": ERROR_QUEUE,
            "error": error_message,
        },
    )


def handle_message(
    channel: pika.adapters.blocking_connection.BlockingChannel,
    method: pika.spec.Basic.Deliver,
    properties: pika.spec.BasicProperties,
    body: bytes,
) -> None:
    """
    Обработчик входящего сообщения из INPUT_QUEUE.
    Обрабатывает документ и публикует результат или ошибку.
    """
    original_message = None

    try:
        # Проверка размера сообщения
        if len(body) > MAX_MESSAGE_SIZE:
            raise ValueError(
                f"Message size {len(body)} exceeds limit {MAX_MESSAGE_SIZE}"
            )

        # Парсинг сообщения
        original_message = json.loads(body.decode("utf-8"))

        # Валидация
        validate_message(original_message)

        template_name = original_message.get("template_name", "unknown")
        docx_base64 = original_message.get("docx_content_base64", "")
        data = original_message.get("data", {})
        metadata = original_message.get("metadata", {})
        correlation_id = metadata.get("correlation_id", "unknown")

        logger.info(
            "Received message",
            extra={
                "correlation_id": correlation_id,
                "template_name": template_name,
            },
        )

        logger.info(
            "Starting document processing",
            extra={
                "correlation_id": correlation_id,
                "template_name": template_name,
            },
        )

        # Обработка документа
        pdf_base64, docx_filled_base64 = process_document(docx_base64, data)

        # Публикация результата
        publish_success(channel, pdf_base64, docx_filled_base64, metadata, template_name)

        logger.info(
            "Document processing completed successfully",
            extra={
                "correlation_id": correlation_id,
                "template_name": template_name,
            },
        )

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(
            "Document processing failed",
            extra={
                "correlation_id": (
                    original_message.get("metadata", {}).get("correlation_id", "unknown")
                    if original_message
                    else "unknown"
                ),
                "template_name": (
                    original_message.get("template_name", "unknown")
                    if original_message
                    else "unknown"
                ),
                "error": error_msg,
            },
        )

        # Отправка в очередь ошибок
        try:
            if original_message is not None:
                publish_error(channel, original_message, error_msg)
            else:
                # Если не удалось распарсить сообщение — отправляем сырые данные
                publish_error(
                    channel,
                    {"raw_body": body.decode("utf-8", errors="replace")},
                    error_msg,
                )
        except Exception as publish_err:
            logger.error(
                "Failed to publish error message",
                extra={"error": str(publish_err)},
            )

    finally:
        # Всегда подтверждаем сообщение
        try:
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except Exception:
            pass  # Connection may already be lost


# ─── Main Entry Point ────────────────────────────────────────────────────────

def _consume_loop(channel: pika.adapters.blocking_connection.BlockingChannel) -> None:
    """
    Неблокирующий цикл обработки событий.
    Проверяет флаг shutdown между итерациями.
    """
    while not _shutdown_requested:
        # process_data_events обрабатывает входящие сообщения и heartbeat
        # time_limit=1 — возврат управления каждую секунду для проверки shutdown
        channel.connection.process_data_events(time_limit=1)


def main() -> None:
    """Главная точка входа воркера."""
    logger.info(
        "Starting DOCX Worker",
        extra={
            "rabbitmq_host": RABBITMQ_HOST,
            "rabbitmq_port": RABBITMQ_PORT,
            "input_queue": INPUT_QUEUE,
            "output_queue": OUTPUT_QUEUE,
            "error_queue": ERROR_QUEUE,
            "libreoffice_path": LIBREOFFICE_PATH,
        },
    )

    current_delay = RECONNECT_BASE_DELAY

    while not _shutdown_requested:
        connection = None
        try:
            connection = get_connection()
            channel = connection.channel()

            # Объявление очередей
            declare_queues(channel)

            # Prefetch: одно сообщение за раз
            channel.basic_qos(prefetch_count=1)

            # Подписка на входную очередь
            channel.basic_consume(
                queue=INPUT_QUEUE,
                on_message_callback=handle_message,
                auto_ack=False,
            )

            # Сброс backoff при успешном подключении
            current_delay = RECONNECT_BASE_DELAY

            logger.info("Worker is ready. Waiting for messages...")

            # Неблокирующий цикл с проверкой shutdown flag
            _consume_loop(channel)

            if _shutdown_requested:
                logger.info("Shutdown requested, stopping consumption...")
                channel.stop_consuming()

        except pika.exceptions.AMQPConnectionError as e:
            if _shutdown_requested:
                break
            logger.error(
                "RabbitMQ connection lost. Reconnecting...",
                extra={"error": str(e), "next_retry_seconds": current_delay},
            )
            time.sleep(current_delay)
            current_delay = min(current_delay * 2, RECONNECT_MAX_DELAY)

        except KeyboardInterrupt:
            logger.info("Worker stopped by user (KeyboardInterrupt)")
            break

        except Exception as e:
            if _shutdown_requested:
                break
            logger.error(
                "Unexpected error in main loop. Reconnecting...",
                extra={
                    "error": f"{type(e).__name__}: {str(e)}",
                    "next_retry_seconds": current_delay,
                },
            )
            time.sleep(current_delay)
            current_delay = min(current_delay * 2, RECONNECT_MAX_DELAY)

        finally:
            if connection and connection.is_open:
                try:
                    connection.close()
                except Exception:
                    pass

    logger.info("Worker shut down gracefully")


if __name__ == "__main__":
    main()
