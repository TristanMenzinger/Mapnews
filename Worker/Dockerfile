FROM python:3.8
#FROM python:alpine3.7

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
# COPY en_core_web_sm-1.2.0.tar.gz /app

RUN pip install -r requirements.txt
# RUN pip install en_core_web_sm-1.2.0.tar.gz
RUN python -m spacy download en_core_web_md

ADD main.py /app

CMD ["python", "-u", "main.py"]
