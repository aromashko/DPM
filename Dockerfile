FROM python:3.13-slim

# Неинтерактивный режим для apt
ENV DEBIAN_FRONTEND=noninteractive

# Определяем кодовое имя версии Debian динамически
RUN echo "deb http://deb.debian.org/debian $(. /etc/os-release && echo $VERSION_CODENAME) contrib" >> /etc/apt/sources.list

# Установка LibreOffice и базовых шрифтов
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core \
    libreoffice-writer \
    fonts-dejavu-core \
    fonts-croscore \
    && rm -rf /var/lib/apt/lists/*

# Попытка установить шрифт Verdana через ttf-mscorefonts-installer
# Если не получится (нет сети, проблемы с сервером), используем fallback
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && (apt-get update && apt-get install -y --no-install-recommends ttf-mscorefonts-installer \
        && fc-cache -fv \
        && rm -rf /var/lib/apt/lists/*) \
    || (echo "ttf-mscorefonts-installer installation failed, using fallback fonts" \
        && apt-get update \
        && apt-get install -y --no-install-recommends fonts-noto-core \
        && fc-cache -fv \
        && rm -rf /var/lib/apt/lists/*)

# Рабочая директория
WORKDIR /app

# Установка Python-зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода воркера
COPY worker.py .

# Запуск воркера
CMD ["python", "worker.py"]
