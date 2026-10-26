/** Error con código HTTP. Los servicios lo lanzan y el middleware de errores lo convierte en respuesta. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string) {
    return new AppError(400, message);
  }
  static unauthorized(message = 'No autenticado.') {
    return new AppError(401, message);
  }
  static forbidden(message = 'No tenés permisos para hacer esto.') {
    return new AppError(403, message);
  }
  static notFound(message: string) {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
  /** Para las partes del proyecto que todavía no se programaron. */
  static notImplemented(feature?: string) {
    return new AppError(501, feature ? `Todavía no implementado: ${feature}` : 'Todavía no implementado.');
  }
}
