import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener productos según el slug de la categoría
router.get('/:slugCategoria', async (req, res) => {
  const { slugCategoria } = req.params;

  try {
    // Buscar código de categoría según el slug recibido
    const [categoriaResult] = await db.execute(
      'SELECT codigo_categoria FROM categorias WHERE slug = ?',
      [slugCategoria]
    );

    if (!categoriaResult || categoriaResult.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const codigoCategoria = categoriaResult[0].codigo_categoria;

    // Obtener productos asociados a la categoría
    const [productos] = await db.execute(
      `SELECT 
        p.id_producto AS id, 
        p.nombre AS name, 
        p.precio AS price, 
        p.descripcion AS descripcion,
        COALESCE(f.url_imagen, 'https://placehold.co/300x400') AS image
      FROM productos p
      LEFT JOIN fotos_producto f ON f.id_producto = p.id_producto
      WHERE p.codigo_categoria = ?`,
      [codigoCategoria]
    );

    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
