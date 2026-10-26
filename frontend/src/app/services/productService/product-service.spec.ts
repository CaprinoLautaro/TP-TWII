import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../../config/api.config';
import { IMAGEN_POR_DEFECTO, NuevoProducto, Product } from '../../models/product/product';
import { ProductService } from './product-service';

const COLLAR: Product = {
  id: 1,
  nombre: 'Collar',
  descripcion: 'Collar ajustable de nylon reforzado.',
  clasificacion: 'Accesorios',
  precio: 7800,
  stock: 10,
  imagen: 'img/productos/collar.png',
};

const NUEVO: NuevoProducto = {
  nombre: 'Hueso de cuero',
  descripcion: 'Hueso masticable de cuero natural.',
  clasificacion: 'Juguetes',
  precio: 4200,
  stock: 30,
  imagen: '',
};

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  /** Responde el GET inicial que el servicio hace al crearse. */
  function cargarInicial(lista: Product[]) {
    http.expectOne(`${API_URL}/products`).flush(lista);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('carga inicial', () => {
    it('pide la lista al backend y la expone en el signal', () => {
      expect(service.cargando()).toBe(true);
      expect(service.listaProductos()).toEqual([]);

      cargarInicial([COLLAR]);

      expect(service.cargando()).toBe(false);
      expect(service.errorCarga()).toBeNull();
      expect(service.listaProductos()).toEqual([COLLAR]);
      expect(service.getProducto(1)).toEqual(COLLAR);
      expect(service.getProducto(99)).toBeUndefined();
    });

    it('usa la imagen por defecto cuando el producto no tiene', () => {
      cargarInicial([{ ...COLLAR, imagen: '' }]);
      expect(service.getProducto(1)?.imagen).toBe(IMAGEN_POR_DEFECTO);
    });

    it('avisa que el backend no responde y permite reintentar', () => {
      http.expectOne(`${API_URL}/products`).error(new ProgressEvent('error'));

      expect(service.cargando()).toBe(false);
      expect(service.errorCarga()).toContain('No se pudo conectar con el servidor');

      service.cargar();
      expect(service.cargando()).toBe(true);
      expect(service.errorCarga()).toBeNull();
      cargarInicial([COLLAR]);
      expect(service.listaProductos().length).toBe(1);
    });
  });

  describe('crearProducto', () => {
    it('no llama al backend si los datos son inválidos', () => {
      cargarInicial([]);
      let mensaje = '';

      service.crearProducto({ ...NUEVO, nombre: 'ab', precio: 10.5 }).subscribe({
        error: (e: Error) => (mensaje = e.message),
      });

      expect(mensaje).toContain('El nombre debe tener al menos 3 caracteres.');
      expect(mensaje).toContain('El precio debe ser un número entero mayor a 0.');
      http.expectNone(`${API_URL}/products`);
    });

    it('hace POST y agrega el producto devuelto por el backend a la lista', () => {
      cargarInicial([COLLAR]);
      let creado: Product | undefined;

      service.crearProducto({ ...NUEVO, nombre: '  Hueso de cuero ' }).subscribe((p) => (creado = p));

      const req = http.expectOne({ method: 'POST', url: `${API_URL}/products` });
      expect(req.request.body.nombre).toBe('Hueso de cuero'); // sin espacios de más
      req.flush({ ...NUEVO, id: 2 }, { status: 201, statusText: 'Created' });

      expect(creado?.id).toBe(2);
      expect(creado?.imagen).toBe(IMAGEN_POR_DEFECTO);
      expect(service.listaProductos().map((p) => p.id)).toEqual([1, 2]);
    });

    it('muestra el mensaje del backend si el nombre está repetido (409) y no toca la lista', () => {
      cargarInicial([COLLAR]);
      let mensaje = '';

      service.crearProducto(NUEVO).subscribe({ error: (e: Error) => (mensaje = e.message) });
      http
        .expectOne({ method: 'POST', url: `${API_URL}/products` })
        .flush({ error: 'Ya existe un producto con ese nombre.' }, { status: 409, statusText: 'Conflict' });

      expect(mensaje).toBe('Ya existe un producto con ese nombre.');
      expect(service.listaProductos().length).toBe(1);
    });
  });

  describe('actualizarStock', () => {
    it('hace PATCH con el nuevo stock y actualiza solo ese producto', () => {
      cargarInicial([COLLAR, { ...COLLAR, id: 2, nombre: 'Correa' }]);

      service.actualizarStock(1, 25).subscribe();

      const req = http.expectOne({ method: 'PATCH', url: `${API_URL}/products/1/stock` });
      expect(req.request.body).toEqual({ stock: 25 });
      req.flush({ ...COLLAR, stock: 25 });

      expect(service.getProducto(1)?.stock).toBe(25);
      expect(service.getProducto(2)?.stock).toBe(10);
    });

    it('rechaza stock negativo o decimal sin llamar al backend', () => {
      cargarInicial([COLLAR]);
      const errores: string[] = [];

      service.actualizarStock(1, -1).subscribe({ error: (e: Error) => errores.push(e.message) });
      service.actualizarStock(1, 2.5).subscribe({ error: (e: Error) => errores.push(e.message) });

      expect(errores.length).toBe(2);
      http.expectNone(`${API_URL}/products/1/stock`);
    });

    it('muestra el error del backend si el producto no existe (404)', () => {
      cargarInicial([COLLAR]);
      let mensaje = '';

      service.actualizarStock(99, 5).subscribe({ error: (e: Error) => (mensaje = e.message) });
      http
        .expectOne(`${API_URL}/products/99/stock`)
        .flush({ error: 'El producto no existe.' }, { status: 404, statusText: 'Not Found' });

      expect(mensaje).toBe('El producto no existe.');
    });
  });

  describe('descontarStock', () => {
    it('falla sin llamar al backend si no alcanza el stock', () => {
      cargarInicial([COLLAR]);
      let mensaje = '';

      service.descontarStock(1, 11).subscribe({ error: (e: Error) => (mensaje = e.message) });

      expect(mensaje).toContain('Stock insuficiente');
      http.expectNone(`${API_URL}/products/1/stock`);
    });

    it('guarda el stock restante en el backend', () => {
      cargarInicial([COLLAR]);

      service.descontarStock(1, 4).subscribe();

      const req = http.expectOne({ method: 'PATCH', url: `${API_URL}/products/1/stock` });
      expect(req.request.body).toEqual({ stock: 6 });
      req.flush({ ...COLLAR, stock: 6 });
      expect(service.getProducto(1)?.stock).toBe(6);
    });
  });
});
