# Deployment Guide

## Docker (Recommended)

```bash
# Build and run
docker build -t structured-clause-agent .
docker run -p 37701:37701 structured-clause-agent

# Or use docker-compose
docker-compose up -d
```

## Production Deployment

### 1. Railway / Render / Fly.io

```bash
# Railway
railway deploy

# Render
# Connect your repo and use the Dockerfile
```

### 2. Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: structured-clause-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sca
  template:
    metadata:
      labels:
        app: sca
    spec:
      containers:
      - name: sca
        image: your-registry/structured-clause-agent:latest
        ports:
        - containerPort: 37701
        env:
        - name: DB_PATH
          value: /data/agent.db
```

### 3. PM2 (VPS)

```bash
npm install -g pm2
pm2 start dist/index.js --name "sca"
pm2 startup
pm2 save
```

## Environment Variables

| Variable     | Default                        | Description                  |
|--------------|--------------------------------|------------------------------|
| `PORT`       | 37701                          | Server port                  |
| `DB_PATH`    | `~/.structured-clause-agent/agent.db` | SQLite database path |
| `NODE_ENV`   | production                     | Node environment             |