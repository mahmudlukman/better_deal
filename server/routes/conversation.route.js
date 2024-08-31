import express from 'express';
import { isAuthenticated, isSeller } from '../middleware/auth.js';
import {
  allUserConversations,
  createConversation,
  getAllConversations,
  updateLastMessage,
} from '../controllers/conversation.js';

const conversationRouter = express.Router();

conversationRouter.post('/create-conversation', createConversation);
conversationRouter.get('/conversations', isSeller, getAllConversations);
conversationRouter.get(
  '/user-conversations/:id',
  isAuthenticated,
  allUserConversations
);
conversationRouter.put('/update-last-message/:id', updateLastMessage);

export default conversationRouter;
