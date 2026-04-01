import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createWebhookHandler } from './webhook';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Webhook endpoint
app.post('/webhook', createWebhookHandler());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});