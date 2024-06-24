import http from 'node:http';

import { getPgVersion } from './config/database/drizzle.ts';
import app from './app.ts';

const NODE_PORT = Number(process.env.NODE_PORT) || 5000;

await getPgVersion();

http
  .createServer(app)
  .listen(NODE_PORT)
  .on('listening', () => {
    console.log(`Server is running on http://localhost:${NODE_PORT}`);
    console.log(`Swagger docs: http://localhost:${NODE_PORT}/api-docs/`);
  });
