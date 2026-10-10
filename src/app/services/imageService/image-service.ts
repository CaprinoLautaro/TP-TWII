import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;
const LADO_MAX = 800; // px: achicamos para no llenar el localStorage

@Injectable({ providedIn: 'root' })
export class ImageService {
  /** Hoy: devuelve la imagen achicada como data URL. Mañana: POST /imagenes y devuelve la URL del servidor. */
  subirImagen(archivo: File): Observable<string> {
    return new Observable<string>((obs) => {
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        obs.error(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'));
        return;
      }
      if (archivo.size > MAX_MB * 1024 * 1024) {
        obs.error(new Error(`La imagen no puede pesar más de ${MAX_MB} MB.`));
        return;
      }

      const lector = new FileReader();
      lector.onerror = () => obs.error(new Error('No se pudo leer la imagen.'));
      lector.onload = () => {
        const img = new Image();
        img.onerror = () => obs.error(new Error('El archivo no es una imagen válida.'));
        img.onload = () => {
          const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#fff'; // los PNG con transparencia no quedan negros
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          obs.next(canvas.toDataURL('image/jpeg', 0.8));
          obs.complete();
        };
        img.src = lector.result as string;
      };
      lector.readAsDataURL(archivo);
    });
  }
}
