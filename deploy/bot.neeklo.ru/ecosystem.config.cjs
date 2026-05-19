/** PM2 — bot.neeklo.ru only (ports 3002/8082; does not touch neeklo-api on 3001). */
module.exports = {
  apps: [
    {
      name: "botmate-api",
      cwd: "/var/www/bot.neeklo.ru",
      script: "pnpm",
      args: "--filter @botmate/api start",
      interpreter: "none",
      env_file: "/var/www/bot.neeklo.ru/apps/api/.env",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
      },
      max_memory_restart: "400M",
      autorestart: true,
    },
    {
      name: "botmate-web",
      cwd: "/var/www/bot.neeklo.ru",
      script: "pnpm",
      args: "--filter @botmate/web dev --host 127.0.0.1 --port 8082",
      interpreter: "none",
      env_file: "/var/www/bot.neeklo.ru/apps/web/.env",
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=768",
      },
      max_memory_restart: "700M",
      autorestart: true,
    },
    {
      name: "botmate-worker",
      cwd: "/var/www/bot.neeklo.ru",
      script: "pnpm",
      args: "--filter @botmate/worker start",
      interpreter: "none",
      env_file: "/var/www/bot.neeklo.ru/apps/api/.env",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "350M",
      autorestart: true,
    },
  ],
};
