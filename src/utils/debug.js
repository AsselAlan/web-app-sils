import { supabase } from '../lib/supabase';
import { ZONAS } from '../types/constants';

// Función para diagnosticar problemas con la función obtener_herramientas_para_check
export const diagnosticarFuncionHerramientas = async () => {
  console.log('🔍 Iniciando diagnóstico de función obtener_herramientas_para_check...');
  
  const resultados = {
    conexion: false,
    funcionExiste: false,
    enumValido: false,
    pruebasZonas: {},
    errores: []
  };

  try {
    // 1. Verificar conexión básica
    console.log('1️⃣ Verificando conexión...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('usuarios')
      .select('count(*)')
      .limit(1);
    
    if (connectionError) {
      resultados.errores.push(`Error de conexión: ${connectionError.message}`);
    } else {
      resultados.conexion = true;
      console.log('✅ Conexión exitosa');
    }

    // 2. Verificar que la función existe
    console.log('2️⃣ Verificando que la función existe...');
    const { data: funcionData, error: funcionError } = await supabase
      .rpc('obtener_herramientas_para_check', { zona_param: 'INSTALACIONES' });
    
    if (funcionError) {
      if (funcionError.code === '42883') {
        resultados.errores.push('La función obtener_herramientas_para_check no existe');
      } else {
        resultados.funcionExiste = true;
        console.log('✅ La función existe');
      }
    } else {
      resultados.funcionExiste = true;
      console.log('✅ La función existe y respondió');
    }

    // 3. Probar cada zona válida
    console.log('3️⃣ Probando cada zona...');
    for (const zona of Object.values(ZONAS)) {
      try {
        console.log(`🧪 Probando zona: ${zona}`);
        const { data, error } = await supabase
          .rpc('obtener_herramientas_para_check', { zona_param: zona });
        
        if (error) {
          resultados.pruebasZonas[zona] = {
            exito: false,
            error: error.message,
            codigo: error.code
          };
          console.log(`❌ Error en zona ${zona}:`, error.message);
        } else {
          resultados.pruebasZonas[zona] = {
            exito: true,
            herramientas: data?.length || 0,
            datos: data
          };
          console.log(`✅ Zona ${zona}: ${data?.length || 0} herramientas`);
        }
      } catch (err) {
        resultados.pruebasZonas[zona] = {
          exito: false,
          error: err.message
        };
        console.log(`💥 Error inesperado en zona ${zona}:`, err);
      }
    }

    // 4. Verificar valores del enum
    console.log('4️⃣ Verificando valores del enum zona_trabajo...');
    try {
      const { data: enumData, error: enumError } = await supabase
        .rpc('obtener_herramientas_para_check', { zona_param: 'ZONA_INVALIDA' });
      
      // Si no da error, algo está mal
      if (!enumError) {
        resultados.errores.push('El enum permite valores inválidos');
      }
    } catch (err) {
      // Esto es lo esperado para una zona inválida
      resultados.enumValido = true;
      console.log('✅ El enum rechaza valores inválidos correctamente');
    }

  } catch (err) {
    resultados.errores.push(`Error general: ${err.message}`);
    console.error('💥 Error general en diagnóstico:', err);
  }

  // Resumen del diagnóstico
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
  console.log('Conexión:', resultados.conexion ? '✅' : '❌');
  console.log('Función existe:', resultados.funcionExiste ? '✅' : '❌');
  console.log('Enum válido:', resultados.enumValido ? '✅' : '❌');
  
  console.log('\n🧪 PRUEBAS POR ZONA:');
  Object.entries(resultados.pruebasZonas).forEach(([zona, resultado]) => {
    console.log(`${resultado.exito ? '✅' : '❌'} ${zona}: ${
      resultado.exito 
        ? `${resultado.herramientas} herramientas` 
        : resultado.error
    }`);
  });

  if (resultados.errores.length > 0) {
    console.log('\n❌ ERRORES ENCONTRADOS:');
    resultados.errores.forEach(error => console.log(`- ${error}`));
  }

  return resultados;
};

// Función para verificar la estructura de la base de datos
export const verificarEstructuraBD = async () => {
  console.log('🏗️ Verificando estructura de la base de datos...');

  try {
    // Verificar tabla herramientas
    const { data: herramientas, error: herramientasError } = await supabase
      .from('herramientas')
      .select('*')
      .limit(1);

    if (herramientasError) {
      console.error('❌ Error en tabla herramientas:', herramientasError.message);
    } else {
      console.log('✅ Tabla herramientas accesible');
    }

    // Verificar tabla checks_diarios
    const { data: checks, error: checksError } = await supabase
      .from('checks_diarios')
      .select('*')
      .limit(1);

    if (checksError) {
      console.error('❌ Error en tabla checks_diarios:', checksError.message);
    } else {
      console.log('✅ Tabla checks_diarios accesible');
    }

    // Verificar usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, rol')
      .limit(1);

    if (usuariosError) {
      console.error('❌ Error en tabla usuarios:', usuariosError.message);
    } else {
      console.log('✅ Tabla usuarios accesible');
    }

  } catch (err) {
    console.error('💥 Error general verificando estructura:', err);
  }
};

// Función para limpiar cache y resetear estado
export const limpiarCacheSupabase = () => {
  console.log('🧹 Limpiando cache...');
  
  // Limpiar localStorage relacionado con Supabase
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log(`Eliminada clave: ${key}`);
    }
  });
  
  console.log('✅ Cache limpiado');
};
