FROM node:22.14.0-bookworm-slim

WORKDIR /workspace

# The Compose dependency volume is mounted at /workspace/node_modules. Seed it
# with ownership that matches the non-root user used by the dev container.
RUN mkdir -p /workspace/node_modules \
  && chown -R node:node /workspace

USER node
CMD ["sh", "-c", "npm ci && npm run dev -- --host 0.0.0.0"]
