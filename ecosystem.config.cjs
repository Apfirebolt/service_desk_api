module.exports = {
  apps: [
    {
      name: 'service-desk-api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
    },
  ],
};