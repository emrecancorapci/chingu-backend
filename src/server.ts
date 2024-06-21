import http from 'node:http';

import * as dotenv from 'dotenv';
import morgan from 'morgan';

import { getPgVersion } from '@/config/database/drizzle.ts';

import app from './app.ts';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const NODE_PORT = Number(process.env.NODE_PORT) || 5000;

await getPgVersion();

app.use(morgan(NODE_ENV));

http
  .createServer(app)
  .listen(NODE_PORT)
  .on('listening', () => {
    console.log(`Server is running on http://localhost:${NODE_PORT}`);
  });
