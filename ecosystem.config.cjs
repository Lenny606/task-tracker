// PM2 ecosystem config - CommonJS format required by PM2
module.exports = {
  apps: [
    {
      name: 'task-tracker',
      // TanStack Start / Nitro server entry
      script: '.output/server/index.mjs',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      // Restart automatically if it crashes
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // DATABASE_URL is injected via VPS environment / .env file on the server
        // Do NOT hardcode secrets here
      },
    },
  ],
};
