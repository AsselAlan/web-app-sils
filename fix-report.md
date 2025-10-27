# 🔧 Corrección del Error de Estado de Herramientas

## Problema Identificado
- Error: `invalid input value for enum estado_herramienta: "MALO"`
- Ubicación: `Solicitudes.jsx` línea 132, función `cargarHerramientasMalEstado`
- Causa: Intento de usar valores `'MALO'` y `'DEFECTUOSO'` que no existen en el enum de Supabase

## Valores Correctos del Enum
Según la consulta a la base de datos, los valores válidos para `estado_herramienta` son:
- `BIEN`
- `REGULAR` 
- `MAL`
- `FALTANTE`
- `NO_HAY`

## Cambios Realizados

### 1. Actualización de Solicitudes.jsx
- **Archivo:** `src/pages/Solicitudes.jsx`
- **Línea 127:** Cambiado de `['MALO', 'DEFECTUOSO']` a `[ESTADOS_HERRAMIENTAS.MAL, ESTADOS_HERRAMIENTAS.FALTANTE]`
- **Agregado:** Import de `ESTADOS_HERRAMIENTAS` desde `../types/constants`

### 2. Actualización del archivo de constantes
- **Archivo:** `src/types/constants.js`
- **Agregado:** Objeto `ESTADOS_HERRAMIENTAS` con todos los valores válidos
- **Agregado:** Labels en español en `LABELS.ESTADOS_HERRAMIENTAS`

## Resultado Esperado
- ✅ La función `cargarHerramientasMalEstado` ahora usa valores válidos del enum
- ✅ Error 400 (Bad Request) debería estar resuelto
- ✅ La página de Solicitudes debería cargar correctamente
- ✅ Las herramientas en mal estado se filtrarán usando `MAL` y `FALTANTE`

## Archivos Modificados
1. `src/pages/Solicitudes.jsx`
2. `src/types/constants.js`

## Próximos Pasos
1. Reiniciar el servidor de desarrollo
2. Verificar que la página de Solicitudes carga sin errores
3. Confirmar que se muestran correctamente las herramientas en mal estado

---
**Fecha:** $(date)
**Estado:** Corregido ✅
