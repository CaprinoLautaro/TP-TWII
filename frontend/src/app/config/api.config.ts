/**
 * La dirección base de nuestra API.
 *
 * Usamos '/api' (relativo) en lugar de 'http://localhost:3000/api' (completo)
 * porque así funciona tanto en nuestra computadora como cuando se publique
 * el proyecto. El proxy se encarga de llevar las peticiones al backend.
 */
export const API_URL = '/api';