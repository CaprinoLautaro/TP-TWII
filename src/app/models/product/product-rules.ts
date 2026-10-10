import { CATEGORIAS, NuevoProducto } from './product';

/**
 * Reglas de negocio de productos, escritas como funciones puras (sin Angular).
 * Cuando exista el backend en Node se copian tal cual al servidor,
 * que es donde realmente tienen que validarse.
 */

export function validarProducto(datos: Partial<NuevoProducto>): string[] {
  const errores: string[] = [];

  if (!datos.nombre || datos.nombre.trim().length < 3) {
    errores.push('El nombre debe tener al menos 3 caracteres.');
  }
  if (!datos.descripcion || datos.descripcion.trim().length < 10) {
    errores.push('La descripción debe tener al menos 10 caracteres.');
  }
  if (!datos.clasificacion || !CATEGORIAS.includes(datos.clasificacion)) {
    errores.push('Elegí una clasificación válida.');
  }
  if (typeof datos.precio !== 'number' || !Number.isFinite(datos.precio) || datos.precio <= 0) {
    errores.push('El precio debe ser mayor a 0.');
  }
  if (!Number.isInteger(datos.stock) || (datos.stock as number) < 0) {
    errores.push('El stock debe ser un número entero igual o mayor a 0.');
  }

  return errores;
}

/** Unidades que todavía se pueden agregar al carrito de un producto. */
export function stockDisponible(stock: number, enCarrito: number): number {
  return Math.max(0, stock - enCarrito);
}

/** Devuelve un mensaje de error si no se puede pedir esa cantidad, o null si está bien. */
export function validarCantidad(stock: number, enCarrito: number, cantidad: number): string | null {
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return 'La cantidad debe ser al menos 1.';
  }
  if (stock === 0) {
    return 'Este producto está agotado.';
  }
  const disponible = stockDisponible(stock, enCarrito);
  if (cantidad > disponible) {
    return disponible === 0
      ? `Ya tenés en el carrito todo el stock disponible (${stock}).`
      : `Solo podés agregar ${disponible} unidad(es) más; el stock es ${stock}.`;
  }
  return null;
}
