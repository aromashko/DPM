FROM python:3.13-slim

# Добавляем contrib репозиторий для ttf-mscorefonts-installer
RUN echo "deb http://deb.debian.org/debian bookworm contrib" >> /etc/apt/sources.list

# Установка LibreOffice и базовых шрифтов
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core \
    libreoffice-writer \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Установка шрифта Verdana (через ttf-mscorefonts-installer из contrib)
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && apt-get update \
    && apt-get install -y --no-install-recommends ttf-mscorefonts-installer \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

# Рабочая директория
WORKDIR /app

# Установка Python-зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода воркера
COPY worker.py .

# Запуск воркера
CMD ["python", "worker.py"]
