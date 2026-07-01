const path = require('path');
const fs = require('fs');

// Read .env file and parse it into env object for PM2
// This ensures PM2 always has the correct env vars regardless of cache
const envPath = path.join(__dirname, 'server', '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });
}

module.exports = {
  apps: [{
    name: 'janki-backend',
    script: 'server.js',
    cwd: '/var/www/janki/server',
    env: { NODE_ENV: 'production', ...envVars },
    max_memory_restart: '512M',
    instances: 1,
    autorestart: true,
  }]
};
