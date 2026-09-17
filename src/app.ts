import express from 'express';
import blockerRoutes from './routes/blocker.routes'

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

app.use('/api/blockers', blockerRoutes);

export default app;