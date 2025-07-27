import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 📦 Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// 🔠 Generador de ID alfanumérico de 6 caracteres
async function generarIDUnico() {
  const caracteres = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const generar = () => Array.from({ length: 6 }, () =>
    caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  ).join('');

  let nuevoID;
  let existe = true;

  while (existe) {
    nuevoID = generar();
    const [rows] = await db.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [nuevoID]);
    if (rows.length === 0) existe = false;
  }

  return nuevoID;
}

// 🔍 GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error en /api/usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// 📝 POST /api/usuarios/register
router.post('/register', upload.single('foto_perfil'), async (req, res) => {
  const {
    correo,
    nombre_usuario,
    contrasena,
    es_negocio = 'false'
  } = req.body;

  const esNegocioFinal = es_negocio === 'true' ? 1 : 0;
  const fotoUrl = req.file ? `http://localhost:3001/uploads/${req.file.filename}` : null;

  try {
    // Validar si el correo ya está registrado
    const [existing] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Correo ya registrado' });
    }

    // Generar ID único
    const id_usuario = await generarIDUnico();

    await db.query(
      'INSERT INTO usuarios (id_usuario, correo, nombre_usuario, contrasena, es_negocio, foto_perfil) VALUES (?, ?, ?, ?, ?, ?)',
      [id_usuario, correo, nombre_usuario, contrasena, esNegocioFinal, fotoUrl]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// 🔐 POST /api/usuarios/login
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id_usuario, correo, nombre_usuario, foto_perfil, es_negocio FROM usuarios WHERE correo = ? AND contrasena = ?',
      [correo, contrasena]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    res.json({ success: true, usuario: rows[0] });
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

export default router;

// GET /api/usuarios/:id (con negocio info)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [usuarioResult] = await db.query(
      `SELECT u.id_usuario, u.nombre_usuario, u.correo, u.foto_perfil, u.es_negocio,
              v.descripcion, v.localidad
       FROM usuarios u
       LEFT JOIN vendedores v ON u.id_usuario = v.id_usuario
       WHERE u.id_usuario = ?`,
      [id]
    );

    if (usuarioResult.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuarioResult[0]);
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, localidad, descripcion } = req.body;

  try {
    if (nombre_usuario !== undefined) {
      await db.query('UPDATE usuarios SET nombre_usuario = ? WHERE id_usuario = ?', [nombre_usuario, id]);
    }

    if (localidad !== undefined || descripcion !== undefined) {
      const [existeVendedor] = await db.query('SELECT * FROM vendedores WHERE id_usuario = ?', [id]);

      if (existeVendedor.length === 0) {
        await db.query('INSERT INTO vendedores (id_usuario, descripcion, localidad) VALUES (?, ?, ?)', [
          id,
          descripcion || null,
          localidad || null,
        ]);
      } else {
        await db.query('UPDATE vendedores SET descripcion = ?, localidad = ? WHERE id_usuario = ?', [
          descripcion || existeVendedor[0].descripcion,
          localidad || existeVendedor[0].localidad,
          id,
        ]);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
