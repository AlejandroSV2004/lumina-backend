import express from 'express';
import db from '../db.js';

const router = express.Router();

// ✅ Crear producto con imagen (desde formulario frontend)
router.post('/', async (req, res) => {
  const {
    id_vendedor,
    nombre,
    descripcion,
    precio,
    stock,
    codigo_categoria,
    imagen // debe ser una URL válida
  } = req.body;

  try {
    // Validar que el usuario sea vendedor
    const [verif] = await db.query(
      'SELECT es_negocio FROM usuarios WHERE id_usuario = ?',
      [id_vendedor]
    );

    if (!verif.length || !verif[0].es_negocio) {
      return res.status(403).json({ error: 'No autorizado para crear productos' });
    }

    // Insertar producto
    await db.query(
      `INSERT INTO productos 
       (id_vendedor, nombre, descripcion, precio, stock, codigo_categoria) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_vendedor, nombre, descripcion, precio, stock, codigo_categoria]
    );

    const [idRes] = await db.query('SELECT LAST_INSERT_ID() AS id_producto');
    const id_producto = idRes[0].id_producto;

    // Insertar imagen si se proporciona
    if (imagen) {
      await db.query(
        'INSERT INTO fotos_producto (id_producto, url_imagen) VALUES (?, ?)',
        [id_producto, imagen]
      );
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// ✅ Obtener productos por categoría (slug)
router.get('/:slugCategoria', async (req, res) => {
  const { slugCategoria } = req.params;

  try {
    const [categoriaResult] = await db.execute(
      'SELECT codigo_categoria FROM categorias WHERE slug = ?',
      [slugCategoria]
    );

    if (!categoriaResult.length) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const codigoCategoria = categoriaResult[0].codigo_categoria;

    const [productos] = await db.execute(
      `SELECT 
         p.id_producto AS id, 
         p.nombre AS name, 
         p.precio AS price, 
         p.descripcion,
         COALESCE(f.url_imagen, 'https://placehold.co/300x400') AS image
       FROM productos p
       LEFT JOIN fotos_producto f ON f.id_producto = p.id_producto
       WHERE p.codigo_categoria = ?`,
      [codigoCategoria]
    );

    res.status(200).json(productos);
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
