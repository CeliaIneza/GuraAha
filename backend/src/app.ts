import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import blockerRoutes from './routes/blocker.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import locationRoutes from './routes/location.routes';
import listingRoutes from './routes/listing.routes';
import contactUnlockRoutes from './routes/contact-unlock.routes';
import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import lottoRoutes from './routes/lotto.routes';
import partnerRoutes from './routes/partner.routes';
import settingRoutes from './routes/setting.routes';
import { generateOpenApiDocument } from './openapi/document';
import { UPLOAD_ROOT } from './middleware/upload';
import { env } from './config/env';

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.NODE_ENV === 'development' || !env.FRONTEND_URL) {
            return callback(null, true);
        }
        if (origin === env.FRONTEND_URL || origin.endsWith('.run.app') || origin.includes('localhost')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-setup-secret'],
}));

app.use(express.json());

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ message: 'Malformed JSON in request body' });
    }
    return next(err);
});

app.use('/uploads', express.static(UPLOAD_ROOT));

const openApiDocument = generateOpenApiDocument();

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/docs.json', (_req, res) => res.json(openApiDocument));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/v1/blockers', blockerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/listings', listingRoutes);

app.use('/api/v1', contactUnlockRoutes);

app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/lotto', lottoRoutes);

app.use('/api/v1/partners', partnerRoutes);
app.use('/api/v1/settings', settingRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

export default app;
