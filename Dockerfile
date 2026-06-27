FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY manage.py ./
COPY merchant_cad/ merchant_cad/
COPY merchants/ merchants/

EXPOSE 8000

CMD ["gunicorn", "merchant_cad.wsgi:application", "--bind", "0.0.0.0:8000"]
