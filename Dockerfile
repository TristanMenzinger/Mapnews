FROM python:3.6

# Install the required packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    supervisor \
    curl \
    nginx && \
    apt-get -q clean -y && rm -rf /var/lib/apt/lists/* && rm -f /var/cache/apt/*.bin

WORKDIR /app
COPY requirements.txt /app
COPY es_core_news_lg-2.3.1.tar.gz /app

RUN pip install -r requirements.txt
RUN pip install es_core_news_lg-2.3.1.tar.gz

ADD main.py /app

CMD ["python", "-u", "main.py"]
