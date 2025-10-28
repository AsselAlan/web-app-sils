import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Faltan las variables de entorno de Supabase');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Configuración adicional para debugging
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
});

// Función auxiliar para manejar errores de RPC
export const handleSupabaseRPCError = (error, functionName) => {
  console.error(`❌ Error en función RPC ${functionName}:`, error);
  
  if (error.code === '42883') {
    return `La función ${functionName} no existe en la base de datos`;
  }
  
  if (error.code === '22P02') {
    return `Parámetro inválido enviado a la función ${functionName}`;
  }
  
  if (error.message?.includes('invalid input value for enum')) {
    return `Valor enum inválido enviado a la función ${functionName}`;
  }
  
  return error.message || `Error desconocido en función ${functionName}`;
};

// Función para verificar la conexión
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('count(*)')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión a Supabase:', err);
    return false;
  }
};
