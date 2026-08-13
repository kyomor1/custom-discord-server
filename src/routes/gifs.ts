import { Router } from 'express';
import { searchGifs } from '../controllers/gif.controller.js';

const router = Router();

router.get('/', searchGifs);

export default router;
