FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face runs containers as user 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user PATH=/home/user/.local/bin:$PATH

WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Safe Share (Part 6): --no-deps skips PyTorch; app/imwatermark_safe.py stubs the part that needs it
RUN pip install --no-cache-dir --no-deps invisible-watermark

COPY --chown=user app ./app
ENV STORAGE_DIR=/home/user/app/storage

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
