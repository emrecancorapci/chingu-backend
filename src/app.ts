import express, { json as expressJson } from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import rateLimiter from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import * as dotenv from 'dotenv';

import { swaggerJSDocOptions } from './config/swagger.ts';

dotenv.config();

const RATE_LIMITER_CONFIG = {
  max: 100, // Limits each IP to 100 request per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
};

const app = express();
const swaggerSpec = swaggerJSDoc(swaggerJSDocOptions);

app.disable('x-powered-by');
app.use(rateLimiter(RATE_LIMITER_CONFIG));
app.use(helmet());
app.use(expressJson());
app.use(compression());
app.use(bodyParser.json({ limit: '100kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1kb' }));

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec));

export default app;
