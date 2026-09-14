FROM python:3.14.0-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY app /app/app
COPY static /app/static
LABEL io.hass.type="addon" io.hass.version="1.0.0" io.hass.name="Smart House Dingtian Manager"
CMD ["python", "-m", "app.server"]
