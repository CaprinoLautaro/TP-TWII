// Carga datos iniciales (usuarios + productos). Se puede correr las veces que quieras: npm run db:seed
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcryptjs';

const PRODUCTOS = [
  { nombre: 'Alimento Premium para Perros 15kg', descripcion: 'Balanceado adulto con pollo y arroz, razas medianas y grandes.', clasificacion: 'Alimento', precio: 48000, stock: 10, imagen: 'img/productos/comida-para-perros.jpg' },
  { nombre: 'Alimento para Gatos 7,5kg', descripcion: 'Con salmón y omega 3, ideal para pelo brillante.', clasificacion: 'Alimento', precio: 36000, stock: 8, imagen: 'img/productos/comida-para-gato.jpg' },
  { nombre: 'Pelota de Goma para Perros', descripcion: 'Resistente a mordidas, rebota y flota en el agua.', clasificacion: 'Juguetes', precio: 5500, stock: 25, imagen: 'img/productos/pelota-para-perros.jpg' },
  { nombre: 'Rascador para Gatos', descripcion: 'Torre de sisal con plataforma y ratón colgante.', clasificacion: 'Juguetes', precio: 29000, stock: 2, imagen: 'img/productos/rascador-para-gatos.png' },
  { nombre: 'Collar Ajustable con Chapita', descripcion: 'Nylon reforzado, disponible en varios colores.', clasificacion: 'Accesorios', precio: 7800, stock: 15, imagen: 'img/productos/collar-ajustable-con-chapita.png' },
  { nombre: 'Correa Retráctil 5m', descripcion: 'Con freno de seguridad y mango ergonómico.', clasificacion: 'Accesorios', precio: 14500, stock: 0, imagen: 'img/productos/correa.png' },
  { nombre: 'Shampoo Hipoalergénico', descripcion: 'Para perros y gatos de piel sensible, 500ml.', clasificacion: 'Higiene', precio: 9200, stock: 12, imagen: 'img/productos/shampoo-hipoalergenico.jpg' },
  { nombre: 'Cama Acolchada Mediana', descripcion: 'Lavable, base antideslizante, ideal para perros y gatos.', clasificacion: 'Camas', precio: 32000, stock: 5, imagen: 'img/productos/colchon-mediano.jpg' },
];

/** Contraseña de prueba para todos los usuarios del seed. */
const PASSWORD_PRUEBA = 'Password123!';

const USUARIOS = [
  {
    id: 1,
    email: 'cliente@test.com',
    password: PASSWORD_PRUEBA,
    nombre: 'Cliente',
    apellido: 'Test',
    direccion: 'Calle Falsa 123',
    rol: 'CLIENTE' as const,
  },
  {
    id: 2,
    email: 'admin@test.com',
    password: PASSWORD_PRUEBA,
    nombre: 'Admin',
    apellido: 'Test',
    direccion: 'Calle Falsa 456',
    rol: 'ADMIN' as const,
  },
];

async function main() {
  // 1. Usuarios (idempotente por email)
  for (const u of USUARIOS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {}, // si ya existe, no lo toca
      create: {
        id: u.id,
        email: u.email,
        password: passwordHash,
        nombre: u.nombre,
        apellido: u.apellido,
        direccion: u.direccion,
        rol: u.rol,
      },
    });
  }
  console.log(`Usuarios cargados: ${USUARIOS.length}`);

  // 2. Productos (idempotente por nombre)
  for (const p of PRODUCTOS) {
    await prisma.product.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: p,
    });
  }
  console.log(`Productos cargados: ${PRODUCTOS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());