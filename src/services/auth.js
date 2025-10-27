import { supabase } from '../lib/supabase';

// Obtener perfil del usuario actual
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }

    // Mapear los campos de la tabla usuarios al formato esperado por el frontend
    return {
      id: data.id,
      email: data.email,
      role: data.rol, // Nota: 'rol' en la BD se mapea a 'role' en el frontend
      zona: data.zona,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return null;
  }
};

// Verificar si el usuario tiene rol asignado
export const hasRoleAssigned = async () => {
  const profile = await getCurrentUserProfile();
  return profile && profile.role && profile.role !== 'sin_asignar';
};

// Verificar si el usuario es admin
export const isAdmin = async () => {
  const profile = await getCurrentUserProfile();
  return profile && profile.role === 'ADMIN';
};

// Obtener todos los usuarios (solo admins)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Mapear los datos al formato esperado
    return data.map(user => ({
      id: user.id,
      email: user.email,
      role: user.rol,
      zona: user.zona,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw error;
  }
};

// Actualizar rol de usuario (solo admins)
export const updateUserRole = async (userId, newRole) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ rol: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Mapear al formato esperado
    return {
      id: data.id,
      email: data.email,
      role: data.rol,
      zona: data.zona,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error actualizando rol:', error);
    throw error;
  }
};

// Actualizar zona del usuario
export const updateUserZona = async (userId, newZona) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ zona: newZona, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      email: data.email,
      role: data.rol,
      zona: data.zona,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error actualizando zona:', error);
    throw error;
  }
};

// Suscribirse a cambios en el perfil del usuario
export const subscribeToProfileChanges = (userId, callback) => {
  return supabase
    .channel('usuario-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'usuarios',
        filter: `id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
