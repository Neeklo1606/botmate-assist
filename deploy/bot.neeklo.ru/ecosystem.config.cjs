/** PM2 — bot.neeklo.ru only (ports 3002; does not touch neeklo-api on 3001). */
module.exports = {
  apps: [
    {
      name: "botmate-api",
      cwd: "/var/www/bot.neeklo.ru",
      script: "node_modules/.bin/tsx",
      args: "apps/api/src/server.ts",
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
      cwd: "/var/www/bot.neeklo.ru/apps/web",
      script: "/var/www/bot.neeklo.ru/node_modules/.bin/vite",
      args: "dev --host 127.0.0.1 --port 8082",
      env_file: "/var/www/bot.neeklo.ru/apps/web/.env",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "450M",
      autorestart: true,
    },
    {
      name: "botmate-worker",
      cwd: "/var/www/bot.neeklo.ru",
      script: "node_modules/.bin/tsx",
      args: "apps/worker/src/index.ts",
      env_file: "/var/www/bot.neeklo.ru/apps/api/.env",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "350M",
      autorestart: true,
    },
  ],
};
