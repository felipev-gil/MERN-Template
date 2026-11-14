const { readConfig } = require('./src/config/env');
const { connectDatabase, closeDatabase } = require('./src/config/database');
const { createApp } = require('./src/app');
async function start() {
  let config;
  try { config = readConfig(); }
  catch (error) { console.error(error.message); process.exitCode = 1; return; }
  let server;
  try {
    await connectDatabase(config.databaseUrl);
    server = createApp(config).listen(config.port, () => console.log('API listening on port ' + config.port));
    server.on('error', async () => { console.error('Could not start HTTP server. Check PORT.'); await closeDatabase(); process.exitCode = 1; });
  } catch (error) {
    console.error('Startup failed. Check backend/.env and database availability.');
    if (!server) await closeDatabase();
    process.exitCode = 1;
    return;
  }
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(async () => { await closeDatabase(); clearTimeout(deadline); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
start();

