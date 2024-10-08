import express from 'express';
import { createNewMessage, getAllMessages } from '../controllers/message.js';

const messageRouter = express.Router();

messageRouter.post('/create-new-message', createNewMessage);
messageRouter.get('/messages/:id', getAllMessages);

export default messageRouter;
