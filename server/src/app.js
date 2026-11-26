import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api from './routes/api.js';
import auth from './routes/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5000').split(',').map((origin) => origin.trim());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ credentials: true, origin(origin, callback) { if (!origin || origins.includes('*') || origins.includes(origin)) callback(null, true); else { const error = new Error('Origin is not allowed by CORS'); error.status = 403; callback(error); } } }));
// sendBeacon uses text/plain to avoid a CORS preflight; parse its JSON body too.
app.use(express.json({ limit: '16kb', type: ['application/json', 'text/plain'] }));
app.use('/api/auth', auth);
app.use('/api', api);
app.use('/tracker', express.static(path.resolve(__dirname, '../../tracker'), { maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.use('/demo', express.static(path.resolve(__dirname, '../../demo')));
app.use(notFound);
app.use(errorHandler);
export default app;
