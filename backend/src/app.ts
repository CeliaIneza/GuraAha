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
import { generateOpenApiDocument } from './openapi/document';
import { UPLOAD_ROOT } from './middleware/upload';

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, Content-Type, Accept, Authorization, x-admin-setup-secret'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    return next();
});

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

// Existing routes
app.use('/api/v1/blockers', blockerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/listings', listingRoutes);

// Previously missing routes — now registered
// contactUnlockRoutes mounts at / because it spans two URL namespaces:
//   POST /api/v1/listings/:listingId/contact/unlock
//   GET  /api/v1/listings/:listingId/contact
//   GET  /api/v1/contact-unlocks/mine
app.use('/api/v1', contactUnlockRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/lotto', lottoRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

export default app;
