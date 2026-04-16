FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5577
ARG RESUME_API_BASE_URL=http://localhost:5577

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV RESUME_API_BASE_URL=$RESUME_API_BASE_URL

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @my-resume/web build

ENV NODE_ENV=production
ENV PORT=5555

EXPOSE 5555

CMD ["pnpm", "--filter", "@my-resume/web", "start"]
