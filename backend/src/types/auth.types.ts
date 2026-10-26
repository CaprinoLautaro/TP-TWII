export interface SignupDto {
  email: string;
  password: string; // en texto plano, solo llega por la request; se hashea antes de guardar
  nombre: string;
  apellido: string;
  direccion: string;
}

export interface SigninDto {
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  nombre: string;
  apellido: string;
  direccion: string;
}

/** Lo que se guarda en la base: la contraseña ya va hasheada. */
export interface CreateUserData extends Omit<SignupDto, 'password'> {
  passwordHash: string;
}
