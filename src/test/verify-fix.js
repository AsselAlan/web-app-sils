// Archivo de verificación de constantes
import { ESTADOS_HERRAMIENTAS, LABELS } from '../types/constants.js';

console.log('Estados disponibles:', ESTADOS_HERRAMIENTAS);
console.log('Labels en español:', LABELS.ESTADOS_HERRAMIENTAS);

// Test de la consulta que estaba fallando
const testQuery = {
  estados_filtro: [ESTADOS_HERRAMIENTAS.MAL, ESTADOS_HERRAMIENTAS.FALTANTE],
  descripcion: 'Consulta que busca herramientas en mal estado o faltantes'
};

console.log('Query corregida:', testQuery);
