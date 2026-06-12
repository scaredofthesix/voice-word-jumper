FROM python:3.12-slim-bookworm

WORKDIR /app

# Копируем уже готовую сборку dist из хоста
COPY dist ./dist

# Открываем порт 8085
EXPOSE 8085

# Запускаем дефолтный веб-сервер Python прямо внутри папки dist
CMD ["python3", "-m", "http.server", "8085", "--directory", "dist"]