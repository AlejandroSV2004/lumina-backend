import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/productosVendedor/:vendedorId
router.get('/:vendedorId', async (req, res) => {
  const vendedorId = req.params.vendedorId;

  if (!vendedorId) {
    return res.status(400).json({ error: 'Falta el ID del vendedor en la ruta' });
  }

  try {
    const [rows] = await db.execute(
      `
      SELECT 
        p.id_producto,
        p.nombre,
        p.precio,
        (SELECT url_imagen FROM fotos_producto WHERE id_producto = p.id_producto LIMIT 1) AS url_imagen
      FROM productos p
      WHERE p.id_vendedor = ?
      ORDER BY p.id_producto DESC
      `,
      [vendedorId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error al obtener productos del vendedor:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
    