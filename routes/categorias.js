import express from 'express';
import db  from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT codigo_categoria AS id, nombre, descripcion, slug FROM categorias');

    const enriched = rows.map((cat, i) => ({
      ...cat,
      icono: ['Battery', 'Zap', 'Sun', 'Settings', 'Home', 'Grid3X3', 'Smartphone'][i % 7],
      color: ['blue', 'yellow', 'green', 'red', 'purple', 'indigo', 'teal'][i % 7],
      cantidad: `${Math.floor(Math.random() * 1000) + 100}+ productos`
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
