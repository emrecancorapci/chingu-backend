import bodyParser from 'body-parser';
import compression from 'compression';
import * as dotenv from 'dotenv';
import express, { json as expressJson } from 'express';
import rateLimiter from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const RATE_LIMITER_CONFIG = {
  max: 100, // Limits each IP to 100 request per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
};

const app = express();

app.disable('x-powered-by');
app.use(rateLimiter(RATE_LIMITER_CONFIG));
app.use(expressJson());
app.use(helmet());
app.use(compression());
app.use(bodyParser.json({ limit: '100kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1kb' }));

export default app;
