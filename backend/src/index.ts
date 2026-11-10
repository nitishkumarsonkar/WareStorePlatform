import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { authController } from './modules/auth/auth.controller';
import { kycController } from './modules/kyc/kyc.controller';
import { projectsController } from './modules/projects/projects.controller';
import { marketplaceController } from './modules/marketplace/marketplace.controller';
import { bidsController } from './modules/bids/bids.controller';
import { ratingsController } from './modules/ratings/ratings.controller';
import { upload, handleFileUpload } from './modules/upload/upload.controller';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup to allow frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded KYC documents statically
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Ware Store - Where Trust Builds',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==================== REST API ROUTES (v1) ====================
const apiRouter = express.Router();

// 1. Auth & Verification Routes
apiRouter.post('/auth/send-otp', authController.sendOtp);
apiRouter.post('/auth/verify-otp', authController.verifyOtp);
apiRouter.get('/auth/me', authenticateToken, authController.getCurrentUser);

// 2. KYC Onboarding
apiRouter.post('/kyc/builder', authenticateToken, kycController.submitBuilderKyc);
apiRouter.post('/kyc/vendor', authenticateToken, kycController.submitVendorKyc);

// 3. Document Upload
apiRouter.post('/upload', upload.single('document'), handleFileUpload);

// 4. Builder Requisitions & Bids Management
apiRouter.post('/projects', authenticateToken, projectsController.createProject);
apiRouter.get('/projects', authenticateToken, projectsController.listProjects);
apiRouter.get('/projects/:id', authenticateToken, projectsController.getProjectDetails);
apiRouter.get('/projects/:id/bids', authenticateToken, projectsController.getLeaderboard);
apiRouter.patch('/projects/:id', authenticateToken, projectsController.updateProject);
apiRouter.post('/bids/:id/accept', authenticateToken, projectsController.acceptBid);

// 5. Vendor Marketplace & Bidding
apiRouter.get('/marketplace/feed', authenticateToken, marketplaceController.getFeed);
apiRouter.post('/bids', authenticateToken, bidsController.submitBid);
apiRouter.post('/bids/:id/complete', authenticateToken, bidsController.completeBid);
apiRouter.get('/vendor/history', authenticateToken, bidsController.getVendorHistory);

// 6. Ratings & Reviews
apiRouter.post('/ratings', authenticateToken, ratingsController.submitRating);
apiRouter.get('/ratings/bid/:bidId', authenticateToken, ratingsController.getRatingsForBid);
apiRouter.get('/ratings/user/:userId', authenticateToken, ratingsController.getRatingsForUser);
apiRouter.get('/ratings/bid/:bidId/status', authenticateToken, ratingsController.checkRatingStatus);

app.use('/api/v1', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Ware Store Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Ware Store Backend API running at http://localhost:${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
  });
}

export default app;
