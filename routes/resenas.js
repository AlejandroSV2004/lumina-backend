import express from 'express';
import db from '../db.js';

const router = express.Router();

// ✅ Obtener reseñas por ID de producto
router.get('/:id_producto', async (req, res) => {
  const { id_producto } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        r.id,
        r.id_usuario,
        u.nombre_usuario,
        r.calificacion,
        r.comentario,
        r.fecha
      FROM resenas r
      JOIN usuarios u ON u.id_usuario = r.id_usuario
      WHERE r.id_producto = ?
      ORDER BY r.fecha DESC
    `, [id_producto]);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener reseñas:', err);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

// ✅ Insertar nueva reseña y devolver lista actualizada
router.post('/', async (req, res) => {
  const { id_usuario, id_producto, calificacion, comentario } = req.body;

  // Validaciones básicas
  if (!id_usuario || !id_producto || !calificacion || !comentario) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    // Insertar la reseña
    await db.query(
      `INSERT INTO resenas (id_usuario, id_producto, calificacion, comentario, fecha) 
       VALUES (?, ?, ?, ?, NOW())`,
      [id_usuario, id_producto, calificacion, comentario]
    );

    // Obtener reseñas actualizadas
    const [nuevasResenas] = await db.query(`
      SELECT 
        r.id,
        r.id_usuario,
        u.nombre_usuario,
        r.calificacion,
        r.comentario,
        r.fecha
      FROM resenas r
      JOIN usuarios u ON u.id_usuario = r.id_usuario
      WHERE r.id_producto = ?
      ORDER BY r.fecha DESC
    `, [id_producto]);

    res.json(nuevasResenas);
  } catch (err) {
    console.error('❌ Error al insertar reseña:', err);
    res.status(500).json({ error: 'Error al insertar reseña' });
  }
});
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(`DELETE FROM resenas WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al eliminar reseña:', err);
    res.status(500).json({ error: 'Error al eliminar reseña' });
  }
});
export default router;
