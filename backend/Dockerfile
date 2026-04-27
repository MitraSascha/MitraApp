FROM python:3.12-slim

WORKDIR /app

# System-Abhängigkeiten für WeasyPrint, psycopg2 und Node.js (Claude CLI)
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    gcc \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Node.js für Claude CLI
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Claude CLI installieren (Anthropic Claude Code)
RUN npm install -g @anthropic-ai/claude-code 2>/dev/null || true

# Python-Abhängigkeiten
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App-Code
COPY . .

# Entrypoint ausführbar machen
RUN chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "mitra.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
