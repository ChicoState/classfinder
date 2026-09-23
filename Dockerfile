FROM node:22.14.0-bookworm-slim

WORKDIR /workspace
USER node
CMD ["sh", "-c", "npm ci && npm run dev -- --host 0.0.0.0"]
