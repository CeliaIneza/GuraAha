import express, { Request, Response, NextFunction } from 'express';
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
import newsRoutes from './routes/news.routes';
import alertRoutes from './routes/alert.routes';
import { generateOpenApiDocument } from './openapi/document';
import { UPLOAD_ROOT } from './middleware/upload';
import { env } from './config/env';
import notificationRoutes from './routes/notification.routes';

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const isAllowed =
        !origin ||
        env.NODE_ENV === 'development' ||
        !env.FRONTEND_URL ||
        origin === env.FRONTEND_URL ||
        origin.endsWith('.run.app') ||
        origin.includes('localhost');

    if (origin && isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-setup-secret');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get('/api/v1/health', (_req, res) => {
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
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/webhooks', paymentRoutes);
app.use('/webhooks', paymentRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/lotto', lottoRoutes);

app.use('/api/v1/partners', partnerRoutes);
app.use('/api/v1/settings', settingRoutes);

app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/alerts', alertRoutes);


app.use((req: Request, res: Response) => {
    res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

export default app;
