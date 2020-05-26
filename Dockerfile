FROM python:3.6

# Install the required packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    supervisor \
    curl \
    nginx && \
    apt-get -q clean -y && rm -rf /var/lib/apt/lists/* && rm -f /var/cache/apt/*.bin

COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
RUN pip install en_core_web_lg-2.2.5.tar.gz

CMD ["python", "-u", "main.py"]
