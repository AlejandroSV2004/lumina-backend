// routes/carrito.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Obtener carrito de un usuario
router.get('/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const [rows] = await db.query(
      `SELECT c.id_producto, c.cantidad, p.nombre, p.precio, p.imagen
       FROM carrito c
       JOIN productos p ON c.id_producto = p.id_producto
       WHERE c.id_usuario = ?`,
      [id_usuario]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener carrito:', err);
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
});

// Agregar producto o aumentar cantidad
router.post('/agregar', async (req, res) => {
  const { id_usuario, id_producto, cantidad = 1 } = req.body;
  try {
    await db.query(
      `INSERT INTO carrito (id_usuario, id_producto, cantidad)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
      [id_usuario, id_producto, cantidad]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al agregar al carrito:', err);
    res.status(500).json({ error: 'No se pudo agregar al carrito' });
  }
});

// Disminuir cantidad de un producto
router.post('/disminuir', async (req, res) => {
  const { id_usuario, id_producto } = req.body;
  try {
    await db.query(
      `UPDATE carrito SET cantidad = cantidad - 1
       WHERE id_usuario = ? AND id_producto = ? AND cantidad > 1`,
      [id_usuario, id_producto]
    );
    // Si la cantidad era 1, lo eliminamos
    await db.query(
      `DELETE FROM carrito
       WHERE id_usuario = ? AND id_producto = ? AND cantidad <= 1`,
      [id_usuario, id_producto]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al disminuir cantidad:', err);
    res.status(500).json({ error: 'No se pudo disminuir la cantidad' });
  }
});

// Eliminar un producto del carrito
router.delete('/:id_usuario/:id_producto', async (req, res) => {
  const { id_usuario, id_producto } = req.params;
  try {
    await db.query(
      `DELETE FROM carrito WHERE id_usuario = ? AND id_producto = ?`,
      [id_usuario, id_producto]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al eliminar producto:', err);
    res.status(500).json({ error: 'No se pudo eliminar el producto' });
  }
});

// Vaciar carrito completo
router.delete('/vaciar/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    await db.query(`DELETE FROM carrito WHERE id_usuario = ?`, [id_usuario]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al vaciar carrito:', err);
    res.status(500).json({ error: 'No se pudo vaciar el carrito' });
  }
});

export default router;
