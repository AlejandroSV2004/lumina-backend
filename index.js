// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import usuariosRoutes from './routes/usuarios.js';
import categoriasRoutes from './routes/categorias.js'
import productosRoutes from './routes/productos.js';
import productoRoutes from './routes/producto.js';
import resenaRoutes from './routes/resenas.js';
import productosVendedorRouter from './routes/productos_vendedor.js';


dotenv.config();

const app = express();

// 🔐 Seguridad básica
app.use(cors());
app.use(express.json());


app.use('/api/productos', productosRoutes);
// 🖼️ Servir archivos subidos (foto de perfil)
app.use('/uploads', express.static(path.resolve('uploads')));



// 📦 Rutas
app.use('/api/productosVendedor', productosVendedorRouter);

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/producto', productoRoutes);
// Categorias
app.use('/api/categorias', categoriasRoutes);
app.use('/api/resenas', resenaRoutes);
// Ruta raíz para pruebas
app.get('/', (req, res) => {
  res.send('API Lumina funcionando ✅');
});

// 🚀 Levantar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
