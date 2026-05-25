FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_PATH=./models/model.tflite

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl libgl1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

COPY services/face-recognition/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/face-recognition/main.py ./main.py
COPY services/face-recognition/models ./models

RUN useradd --create-home --shell /usr/sbin/nologin appuser \
  && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5).read()" || exit 1

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
