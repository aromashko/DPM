import { useState } from 'react'

type Tab = 'overview' | 'files' | 'api' | 'docker' | 'config'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  const copyToClipboard = (text: string, fileName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedFile(fileName)
    setTimeout(() => setCopiedFile(null), 2000)
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Обзор', icon: '📋' },
    { id: 'files', label: 'Файлы', icon: '📁' },
    { id: 'api', label: 'API сообщений', icon: '📨' },
    { id: 'docker', label: 'Docker', icon: '🐳' },
    { id: 'config', label: 'Конфигурация', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
              📄
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DOCX Worker</h1>
              <p className="text-xs text-slate-400">Микросервис обработки документов • Python 3.13</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                v1.0.0
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Python 3.13
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'files' && <FilesTab copyToClipboard={copyToClipboard} copiedFile={copiedFile} />}
        {activeTab === 'api' && <ApiTab />}
        {activeTab === 'docker' && <DockerTab />}
        {activeTab === 'config' && <ConfigTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-6 text-center text-sm text-slate-500">
        <p>DOCX Worker Microservice • RabbitMQ + LibreOffice + Python 3.13</p>
      </footer>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Микросервис обработки DOCX-документов</h2>
        <p className="text-slate-300 leading-relaxed mb-6">
          Воркер слушает очередь RabbitMQ, получает задачи на заполнение DOCX-шаблонов данными,
          выполняет подстановку через <code className="text-blue-400 bg-blue-500/10 px-1 rounded">docxtpl</code>,
          конвертирует результат в PDF через LibreOffice и публикует готовые документы в выходную очередь.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">🐰 RabbitMQ</span>
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">📝 python-docx</span>
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">📄 docxtpl</span>
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">🖨️ LibreOffice</span>
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">🐍 Python 3.13</span>
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-sm text-slate-300">🐳 Docker</span>
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">🏗️</span> Архитектура
        </h3>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 min-w-[160px]">
              <div className="text-2xl mb-1">📥</div>
              <div className="text-sm font-medium text-green-400">INPUT_QUEUE</div>
              <div className="text-xs text-slate-400">docx_tasks</div>
            </div>
            <div className="text-slate-500 text-2xl">→</div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 min-w-[200px]">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-sm font-medium text-blue-400">DOCX Worker</div>
              <div className="text-xs text-slate-400">Заполнение + PDF</div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 min-w-[160px]">
                <div className="text-sm font-medium text-emerald-400">OUTPUT_QUEUE</div>
                <div className="text-xs text-slate-400">docx_results ✅</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 min-w-[160px]">
                <div className="text-sm font-medium text-red-400">ERROR_QUEUE</div>
                <div className="text-xs text-slate-400">docx_errors ❌</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">✨</span> Возможности
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '🔄', title: 'Последовательная обработка', desc: 'Одно сообщение за раз, без потоков' },
            { icon: '🛡️', title: 'Обработка ошибок', desc: 'Все ошибки → ERROR_QUEUE с контекстом' },
            { icon: '📊', title: 'JSON-логирование', desc: 'Структурированные логи с correlation_id' },
            { icon: '🔁', title: 'Автопереподключение', desc: 'Восстановление связи с RabbitMQ' },
            { icon: '📦', title: 'Docker-ready', desc: 'Dockerfile + docker-compose.yml' },
            { icon: '🔤', title: 'Шрифт Verdana', desc: 'Установлен в контейнере' },
          ].map((feature, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/30 transition-colors">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h4 className="font-medium text-white mb-1">{feature.title}</h4>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* File Structure */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">📂</span> Структура проекта
        </h3>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 font-mono text-sm">
          <div className="space-y-1 text-slate-300">
            <div className="text-blue-400">docx-worker/</div>
            <div className="pl-4">├── <span className="text-yellow-400">worker.py</span> <span className="text-slate-500">— основной модуль воркера</span></div>
            <div className="pl-4">├── <span className="text-yellow-400">Dockerfile</span> <span className="text-slate-500">— образ контейнера</span></div>
            <div className="pl-4">├── <span className="text-yellow-400">docker-compose.yml</span> <span className="text-slate-500">— оркестрация сервисов</span></div>
            <div className="pl-4">├── <span className="text-yellow-400">requirements.txt</span> <span className="text-slate-500">— Python-зависимости</span></div>
            <div className="pl-4">├── <span className="text-yellow-400">.env.example</span> <span className="text-slate-500">— шаблон переменных окружения</span></div>
            <div className="pl-4">├── <span className="text-green-400">README.md</span> <span className="text-slate-500">— документация репозитория</span></div>
            <div className="pl-4">└── <span className="text-purple-400">project_description.txt</span> <span className="text-slate-500">— описание задачи</span></div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">🚀</span> Быстрый старт
        </h3>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <code className="text-green-400">cp .env.example .env</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <code className="text-green-400">docker-compose up -d</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <code className="text-green-400">docker-compose logs -f worker</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilesTab({ copyToClipboard, copiedFile }: { copyToClipboard: (text: string, name: string) => void; copiedFile: string | null }) {
  const files = [
    {
      name: 'worker.py',
      lang: 'python',
      description: 'Основной модуль воркера — обработка документов',
      content: `"""
Document Processing Worker
==========================
Микросервис для обработки DOCX-шаблонов: заполнение данными и конвертация в PDF.
"""

import base64
import io
import json
import logging
import os
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone

import pika
from docxtpl import DocxTemplate
from pythonjsonlogger import jsonlogger

# Configuration
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
INPUT_QUEUE = os.getenv("INPUT_QUEUE", "docx_tasks")
OUTPUT_QUEUE = os.getenv("OUTPUT_QUEUE", "docx_results")
ERROR_QUEUE = os.getenv("ERROR_QUEUE", "docx_errors")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LIBREOFFICE_PATH = os.getenv("LIBREOFFICE_PATH", "libreoffice")

# ... (полный код в файле worker.py)

def main():
    """Главная точка входа воркера."""
    while True:
        try:
            connection = get_connection()
            channel = connection.channel()
            declare_queues(channel)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=INPUT_QUEUE, on_message_callback=handle_message)
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError:
            time.sleep(5)

if __name__ == "__main__":
    main()`
    },
    {
      name: 'Dockerfile',
      lang: 'dockerfile',
      description: 'Docker-образ с Python 3.13 + LibreOffice + шрифты',
      content: `FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends \\
    libreoffice-core \\
    libreoffice-writer \\
    fonts-dejavu-core \\
    && rm -rf /var/lib/apt/lists/*

RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \\
    && apt-get update \\
    && apt-get install -y --no-install-recommends ttf-mscorefonts-installer \\
    && fc-cache -fv \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY worker.py .
CMD ["python", "worker.py"]`
    },
    {
      name: 'docker-compose.yml',
      lang: 'yaml',
      description: 'Оркестрация worker + RabbitMQ',
      content: `version: "3.8"

services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER:-guest}
      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASS:-guest}
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  worker:
    build: .
    depends_on:
      rabbitmq:
        condition: service_healthy
    environment:
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PORT: 5672
      RABBITMQ_USER: \${RABBITMQ_USER:-guest}
      RABBITMQ_PASS: \${RABBITMQ_PASS:-guest}
      INPUT_QUEUE: docx_tasks
      OUTPUT_QUEUE: docx_results
      ERROR_QUEUE: docx_errors
    restart: unless-stopped`
    },
    {
      name: 'requirements.txt',
      lang: 'text',
      description: 'Python-зависимости',
      content: `pika==1.3.2
python-docx==1.1.0
docxtpl==0.17.0
python-json-logger==2.0.7`
    },
    {
      name: '.env.example',
      lang: 'env',
      description: 'Шаблон переменных окружения',
      content: `# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# Queue Names
INPUT_QUEUE=docx_tasks
OUTPUT_QUEUE=docx_results
ERROR_QUEUE=docx_errors

# Logging
LOG_LEVEL=INFO

# LibreOffice
LIBREOFFICE_PATH=libreoffice`
    },
    {
      name: 'README.md',
      lang: 'markdown',
      description: 'Документация репозитория',
      content: `# DOCX Worker

Микросервис-воркер для обработки DOCX-шаблонов: заполнение данными и конвертация в PDF.

## 📋 Описание

Сервис слушает очередь RabbitMQ, получает задачи на заполнение DOCX-шаблонов данными,
выполняет подстановку через docxtpl, конвертирует результат в PDF через LibreOffice
и публикует готовые документы в выходную очередь.

## 🚀 Быстрый старт

\`\`\`bash
cp .env.example .env
docker-compose up -d
docker-compose logs -f worker
\`\`\`

## 📨 Форматы сообщений

### Входящее (INPUT_QUEUE)
\`\`\`json
{
  "template_name": "имя_шаблона.docx",
  "docx_content_base64": "base64-содержимое .docx шаблона",
  "data": { ... },
  "metadata": { "correlation_id": "uuid", ... }
}
\`\`\`

### Успех (OUTPUT_QUEUE)
\`\`\`json
{
  "pdf_content_base64": "base64 PDF",
  "docx_content_base64": "base64 DOCX",
  "original_metadata": { ... },
  "status": "success",
  "template_name": "имя_шаблона.docx"
}
\`\`\`

### Ошибка (ERROR_QUEUE)
\`\`\`json
{
  "original_message": { ... },
  "error_message": "текст ошибки",
  "status": "error",
  "timestamp": "2026-01-01T00:00:00Z"
}
\`\`\`

## ⚙️ Конфигурация

| Переменная | По умолчанию | Описание |
|---|---|---|
| RABBITMQ_HOST | localhost | Хост RabbitMQ |
| RABBITMQ_PORT | 5672 | Порт RabbitMQ |
| INPUT_QUEUE | docx_tasks | Входящая очередь |
| OUTPUT_QUEUE | docx_results | Очередь результатов |
| ERROR_QUEUE | docx_errors | Очередь ошибок |
| LOG_LEVEL | INFO | Уровень логирования |

## 🐳 Docker

\`\`\`bash
docker-compose up -d
docker-compose logs -f worker
docker-compose down
\`\`\`

## 📝 Лицензия

MIT`
    },
    {
      name: 'project_description.txt',
      lang: 'text',
      description: 'Полное описание задачи и требований',
      content: `===============================================================================
                    ОПИСАНИЕ ПРОЕКТА: DOCX WORKER
              Микросервис-воркер для обработки документов
===============================================================================

1. ОБЩАЯ ЛОГИКА РАБОТЫ СЕРВИСА

Сервис слушает очередь RabbitMQ (INPUT_QUEUE). Каждое сообщение — одна задача
на обработку.

Получив сообщение, он извлекает из него шаблон документа (.docx в base64),
данные для подстановки (JSON), заполняет шаблон, конвертирует результат в PDF.

Сформированный PDF и заполненный DOCX (оба в base64) вместе с метаданными
отправляются в выходную очередь (OUTPUT_QUEUE).

При любой ошибке исходное сообщение и описание ошибки отправляются в очередь
ошибок (ERROR_QUEUE), сообщение подтверждается (ack).

Обработка строго последовательная: одно сообщение за раз, без потоков и
асинхронности.

2. ФОРМАТЫ СООБЩЕНИЙ
... (см. полный файл project_description.txt)

3. КОНФИГУРАЦИЯ (ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ)
...

4. ДЕТАЛИ РЕАЛИЗАЦИИ НА PYTHON
...

5. ЛОГИРОВАНИЕ
...

6. DOCKER
...

7. ФАЙЛОВАЯ СТРУКТУРА ПРОЕКТА
...

===============================================================================`
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Исходные файлы проекта</h2>
      <p className="text-slate-400">Все файлы готовы к использованию. Нажмите «Копировать» для копирования содержимого.</p>

      {files.map((file) => (
        <div key={file.name} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 text-sm font-mono">📄</span>
              <span className="font-mono text-sm text-white">{file.name}</span>
              <span className="text-xs text-slate-500">{file.description}</span>
            </div>
            <button
              onClick={() => copyToClipboard(file.content, file.name)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                copiedFile === file.name
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
              }`}
            >
              {copiedFile === file.name ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed max-h-96 overflow-y-auto">
            <code>{file.content}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}

function ApiTab() {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Форматы сообщений</h2>

      {/* Input */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-green-500/5">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">📥</span>
            <h3 className="font-semibold text-green-400">Входящее сообщение (INPUT_QUEUE)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Задача на обработку шаблона</p>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300">
          <code>{`{
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
}`}</code>
        </pre>
      </div>

      {/* Output Success */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-lg">📤</span>
            <h3 className="font-semibold text-emerald-400">Успешный результат (OUTPUT_QUEUE)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Готовые PDF и DOCX</p>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300">
          <code>{`{
  "pdf_content_base64": "base64 PDF документа",
  "docx_content_base64": "base64 заполненного DOCX",
  "original_metadata": {
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
    "source_system": "crm",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "status": "success",
  "template_name": "имя_шаблона.docx"
}`}</code>
        </pre>
      </div>

      {/* Error */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-red-500/5">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-lg">❌</span>
            <h3 className="font-semibold text-red-400">Ошибка (ERROR_QUEUE)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Исходное сообщение + описание ошибки</p>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300">
          <code>{`{
  "original_message": {
    "template_name": "имя_шаблона.docx",
    "docx_content_base64": "...",
    "data": { ... },
    "metadata": { ... }
  },
  "error_message": "RuntimeError: LibreOffice conversion failed (exit code 1)",
  "status": "error",
  "timestamp": "2026-01-01T00:00:00Z"
}`}</code>
        </pre>
      </div>

      {/* Flow diagram */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Последовательность обработки</h3>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="space-y-3">
            {[
              { step: 1, text: 'Получить сообщение из INPUT_QUEUE', color: 'blue' },
              { step: 2, text: 'Декодировать docx_content_base64 → байты', color: 'blue' },
              { step: 3, text: 'Загрузить DocxTemplate из BytesIO', color: 'blue' },
              { step: 4, text: 'Выполнить template.render(data)', color: 'purple' },
              { step: 5, text: 'Сохранить заполненный DOCX во временный файл', color: 'purple' },
              { step: 6, text: 'Вызвать LibreOffice --headless --convert-to pdf', color: 'orange' },
              { step: 7, text: 'Прочитать PDF, закодировать в base64', color: 'green' },
              { step: 8, text: 'Опубликовать результат в OUTPUT_QUEUE', color: 'green' },
              { step: 9, text: 'Удалить временные файлы, ack сообщение', color: 'green' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-${item.color}-500/20 text-${item.color}-400 border border-${item.color}-500/30`}>
                  {item.step}
                </div>
                <span className="text-sm text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DockerTab() {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Docker & Развёртывание</h2>

      {/* Docker Compose */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
          <span>🐳</span> docker-compose.yml
        </h3>
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
            <h4 className="text-sm font-medium text-white mb-2">Сервисы:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <strong>worker</strong> — микросервис обработки документов
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <strong>rabbitmq</strong> — брокер сообщений (с management UI)
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
            <h4 className="text-sm font-medium text-white mb-2">Порты:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-400">5672</div>
              <div className="text-slate-300">RabbitMQ AMQP</div>
              <div className="text-slate-400">15672</div>
              <div className="text-slate-300">RabbitMQ Management UI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dockerfile details */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
          <span>📦</span> Dockerfile
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-sm font-mono text-slate-500 min-w-[80px]">Base:</span>
            <span className="text-sm text-slate-300">python:3.13-slim</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm font-mono text-slate-500 min-w-[80px]">LibreOffice:</span>
            <span className="text-sm text-slate-300">libreoffice-core, libreoffice-writer</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm font-mono text-slate-500 min-w-[80px]">Шрифты:</span>
            <span className="text-sm text-slate-300">ttf-mscorefonts-installer (Verdana), fonts-dejavu-core</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm font-mono text-slate-500 min-w-[80px]">Python:</span>
            <span className="text-sm text-slate-300">pika, python-docx, docxtpl, python-json-logger</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm font-mono text-slate-500 min-w-[80px]">CMD:</span>
            <span className="text-sm text-slate-300 font-mono">python worker.py</span>
          </div>
        </div>
      </div>

      {/* Commands */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
          <span>💻</span> Команды запуска
        </h3>
        <div className="space-y-3 font-mono text-sm">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Запуск всех сервисов</div>
            <div className="text-green-400">docker-compose up -d</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Просмотр логов воркера</div>
            <div className="text-green-400">docker-compose logs -f worker</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Пересборка после изменений</div>
            <div className="text-green-400">docker-compose up -d --build</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Остановка</div>
            <div className="text-green-400">docker-compose down</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Остановка с удалением данных</div>
            <div className="text-green-400">docker-compose down -v</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfigTab() {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Конфигурация</h2>

      {/* Environment Variables */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>⚙️</span> Переменные окружения
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Переменная</th>
                <th className="px-4 py-3 text-slate-400 font-medium">По умолчанию</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {[
                { name: 'RABBITMQ_HOST', default: 'localhost', desc: 'Хост RabbitMQ' },
                { name: 'RABBITMQ_PORT', default: '5672', desc: 'Порт RabbitMQ' },
                { name: 'RABBITMQ_USER', default: 'guest', desc: 'Пользователь RabbitMQ' },
                { name: 'RABBITMQ_PASS', default: 'guest', desc: 'Пароль RabbitMQ' },
                { name: 'INPUT_QUEUE', default: 'docx_tasks', desc: 'Входящая очередь задач' },
                { name: 'OUTPUT_QUEUE', default: 'docx_results', desc: 'Очередь успешных результатов' },
                { name: 'ERROR_QUEUE', default: 'docx_errors', desc: 'Очередь ошибок' },
                { name: 'LOG_LEVEL', default: 'INFO', desc: 'Уровень логирования (DEBUG/INFO/WARNING/ERROR)' },
                { name: 'LIBREOFFICE_PATH', default: 'libreoffice', desc: 'Путь к исполняемому файлу LibreOffice' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-mono text-blue-400 text-xs">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-green-400 text-xs">{row.default}</td>
                  <td className="px-4 py-3 text-slate-300">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dependencies */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>📦</span> Python-зависимости
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Пакет</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Версия</th>
                <th className="px-4 py-3 text-slate-400 font-medium">Назначение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {[
                { name: 'pika', version: '1.3.2', desc: 'Клиент RabbitMQ (BlockingConnection)' },
                { name: 'python-docx', version: '1.1.0', desc: 'Чтение/запись DOCX файлов' },
                { name: 'docxtpl', version: '0.17.0', desc: 'Шаблонизация DOCX (Jinja2)' },
                { name: 'python-json-logger', version: '2.0.7', desc: 'JSON-форматирование логов' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-mono text-blue-400 text-xs">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-green-400 text-xs">{row.version}</td>
                  <td className="px-4 py-3 text-slate-300">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logging */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span>📊</span> Формат логов
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Все логи выводятся в JSON-формате через pythonjsonlogger.JsonFormatter.
        </p>
        <pre className="bg-slate-900/50 rounded-lg p-4 text-sm font-mono text-slate-300 overflow-x-auto border border-slate-700/30">
          <code>{`{
  "timestamp": "2026-01-01T00:00:00Z",
  "level": "INFO",
  "name": "docx_worker",
  "message": "Document processing completed successfully",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "template_name": "contract.docx"
}`}</code>
        </pre>
      </div>

      {/* Local development */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span>🧪</span> Локальная разработка (без Docker)
        </h3>
        <div className="space-y-3 font-mono text-sm">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Создать виртуальное окружение</div>
            <div className="text-green-400">python3.13 -m venv venv</div>
            <div className="text-green-400">source venv/bin/activate</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Установить зависимости</div>
            <div className="text-green-400">pip install -r requirements.txt</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
            <div className="text-slate-500 text-xs mb-1"># Запустить (нужен RabbitMQ и LibreOffice локально)</div>
            <div className="text-green-400">python worker.py</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
