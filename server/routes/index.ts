import express from 'express';
import auth from './auth';
import admin from './admin';

const router = express.Router();

// Registrando as rotas
router.use('/auth', auth);
router.use('/admin', admin);

export default router; 