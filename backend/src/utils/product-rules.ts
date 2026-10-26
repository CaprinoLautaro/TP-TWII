import { CATEGORIAS, type CreateProductDto } from '../types/product.types';
import { AppError } from './app-error';

/**
 * Reglas de validación de productos (mismas que el frontend, pero acá son las que valen:
 * el frontend se puede saltear, el backend no).
 * Reciben `unknown` porque lo que llega por HTTP no está tipado.
 */

const MAX_IMAGEN = 1_500_000; // caracteres; una imagen achicada del formulario pesa bastante menos

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function validarStock(valor: unknown): string | null {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
    return 'El stock debe ser un número entero igual o mayor a 0.';
  }
  return null;
}

/** Valida el body de "crear producto" y devuelve los datos limpios, o lanza 400 con todos los errores. */
export function parseCreateProduct(body: unknown): CreateProductDto {
  const datos = esObjeto(body) ? body : {};
  const errores: string[] = [];

  const nombre = typeof datos['nombre'] === 'string' ? datos['nombre'].trim() : '';
  const descripcion = typeof datos['descripcion'] === 'string' ? datos['descripcion'].trim() : '';
  const clasificacion = datos['clasificacion'];
  const precio = datos['precio'];
  const stock = datos['stock'];
  const imagen = typeof datos['imagen'] === 'string' ? datos['imagen'].trim() : '';

  if (nombre.length < 3) errores.push('El nombre debe tener al menos 3 caracteres.');
  if (descripcion.length < 10) errores.push('La descripción debe tener al menos 10 caracteres.');
  if (typeof clasificacion !== 'string' || !CATEGORIAS.includes(clasificacion)) {
    errores.push('Elegí una clasificación válida.');
  }
  if (typeof precio !== 'number' || !Number.isInteger(precio) || precio <= 0) {
    errores.push('El precio debe ser un número entero mayor a 0.');
  }
  const errorStock = validarStock(stock);
  if (errorStock) errores.push(errorStock);
  if (imagen.length > MAX_IMAGEN) errores.push('La imagen es demasiado pesada.');

  if (errores.length > 0) throw AppError.badRequest(errores.join(' '));

  return {
    nombre,
    descripcion,
    clasificacion: clasificacion as string,
    precio: precio as number,
    stock: stock as number,
    imagen,
  };
}

/** Valida el body de "cambiar stock" ({ stock: número }). */
export function parseStock(body: unknown): number {
  const valor = esObjeto(body) ? body['stock'] : undefined;
  const error = validarStock(valor);
  if (error) throw AppError.badRequest(error);
  return valor as number;
}
