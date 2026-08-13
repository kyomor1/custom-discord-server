import { Router } from 'express';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import serversRoutes from './servers.js';
import channelsRoutes from './channels.js';
import messagesRoutes from './messages.js';
import uploadRoutes from './upload.js';
import gifsRoutes from './gifs.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/servers', serversRoutes);
apiRouter.use('/channels', channelsRoutes);
apiRouter.use('/messages', messagesRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/gifs', gifsRoutes);

export default apiRouter;
