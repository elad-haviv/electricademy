# One-off job image for migrations + seed: run it as a Coolify pre-deploy command or scheduled task.
FROM node:22-alpine
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @electricademy/db...
CMD ["sh", "-c", "pnpm db:migrate && pnpm db:seed"]
