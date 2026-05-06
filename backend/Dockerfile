FROM python:3.12-slim

WORKDIR /app

# System-Abhängigkeiten: WeasyPrint, psycopg2, Node.js (Claude CLI)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    gcc \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g @anthropic-ai/claude-code 2>/dev/null || true \
    && apt-get purge -y gnupg \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* /tmp/* /root/.npm

# Python-Abhängigkeiten
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App-Code
COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 8101

ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "mitra.asgi:application", "--host", "0.0.0.0", "--port", "8101", "--workers", "2"]
