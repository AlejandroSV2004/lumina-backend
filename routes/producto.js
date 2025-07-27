// routes/producto.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener producto por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT 
         p.id_producto AS id,
         p.nombre AS name,
         p.descripcion,
         p.precio AS price,
         COALESCE(f.url_imagen, 'https://placehold.co/300x400') AS image,
         p.stock,
         p.id_vendedor AS sellerId,
         u.nombre_usuario AS sellerName,
         u.correo AS sellerEmail
       FROM productos p
       JOIN usuarios u ON p.id_vendedor = u.id_usuario
       LEFT JOIN fotos_producto f ON f.id_producto = p.id_producto
       WHERE p.id_producto = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar nombre, descripción y/o stock (parcialmente)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, stock } = req.body;

  try {
    const [existente] = await db.execute(
      'SELECT * FROM productos WHERE id_producto = ?',
      [id]
    );

    if (existente.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const nuevoNombre = nombre ?? existente[0].nombre;
    const nuevaDescripcion = descripcion ?? existente[0].descripcion;
    const nuevoStock = stock ?? existente[0].stock;

    const [result] = await db.execute(
      `UPDATE productos
       SET nombre = ?, descripcion = ?, stock = ?
       WHERE id_producto = ?`,
      [nuevoNombre, nuevaDescripcion, nuevoStock, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se actualizó ningún producto' });
    }

    const [updated] = await db.execute(
      `SELECT 
         id_producto AS id, 
         nombre AS name, 
         descripcion, 
         precio AS price, 
         stock 
       FROM productos 
       WHERE id_producto = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Diagnóstico para detectar conflictos de ruta
router.all('*', (req, res) => {
  console.log(`[DEBUG producto.js] Método: ${req.method}, URL: ${req.originalUrl}`);
  res.status(404).json({ error: 'Ruta no encontrada dentro de producto.js' });
});

export default router;
