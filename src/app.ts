import express from 'express';
import swaggerUi from 'swagger-ui-express';
import blockerRoutes from './routes/blocker.routes'
import authRoutes from './routes/auth.routes'
import adminRoutes from './routes/admin.routes'
import locationRoutes from './routes/location.routes'
import {generateOpenApiDocument} from './openapi/document';

const app = express();

app.use(express.json());

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

export default app;