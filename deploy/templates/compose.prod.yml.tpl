services:
  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    env_file:
      - ./.env
    environment:
      NODE_ENV: production
      PORT: 5577
      API_HOST: 0.0.0.0
      DATABASE_URL: file:/app/.data/my-resume.db
    ports:
      - '127.0.0.1:5577:5577'
    restart: unless-stopped
    volumes:
      - __HOST_SQLITE_DATA_DIR__:/app/.data
      - __HOST_RAG_DIR__:/app/apps/server/storage/rag
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://127.0.0.1:5577/api').then((response)=>{if(!response.ok)process.exit(1)}).catch(()=>process.exit(1))",
        ]
      interval: 20s
      timeout: 10s
      retries: 5
      start_period: 20s

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: https://__API_DOMAIN__
        RESUME_API_BASE_URL: http://server:5577
    env_file:
      - ./.env
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_BASE_URL: https://__API_DOMAIN__
      RESUME_API_BASE_URL: http://server:5577
    depends_on:
      server:
        condition: service_healthy
    ports:
      - '127.0.0.1:5555:5555'
    restart: unless-stopped
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://127.0.0.1:5555/').then((response)=>{if(!response.ok)process.exit(1)}).catch(()=>process.exit(1))",
        ]
      interval: 20s
      timeout: 10s
      retries: 5
      start_period: 30s

  admin:
    build:
      context: .
      dockerfile: apps/admin/Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: https://__API_DOMAIN__
    env_file:
      - ./.env
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_BASE_URL: https://__API_DOMAIN__
    depends_on:
      server:
        condition: service_healthy
    ports:
      - '127.0.0.1:5566:5566'
    restart: unless-stopped
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://127.0.0.1:5566/login').then((response)=>{if(!response.ok)process.exit(1)}).catch(()=>process.exit(1))",
        ]
      interval: 20s
      timeout: 10s
      retries: 5
      start_period: 30s
