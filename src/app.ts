import express from 'express';
import swaggerUi from 'swagger-ui-express';
import blockerRoutes from './routes/blocker.routes'
import authRoutes from './routes/auth.routes'
import adminRoutes from './routes/admin.routes'
import locationRoutes from './routes/location.routes'
import {generateOpenApiDocument} from './openapi/document';
import { UPLOAD_ROOT } from './middleware/upload';

const app = express();

app.use(express.json());

app.use('/uploads', express.static(UPLOAD_ROOT));

const openApiDocument = generateOpenApiDocument();

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

app.get('/docs.json', (_req, res) => res.json(openApiDocument));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/v1/blockers', blockerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/location', locationRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

export default app;