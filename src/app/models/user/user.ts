export interface Usuario {
  id?: string | number;
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  password?: string;
}