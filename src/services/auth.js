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
    const updateData = { 
      rol: newRole, 
      updated_at: new Date().toISOString() 
    };
    
    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Mapear al formato esperado
    return {
      id: data.id,
      email: data.email,
      role: data.rol,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error actualizando rol:', error);
    throw error;
  }
};

// Función eliminada: updateUserZona - Los usuarios ya no tienen zona asignada

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

// Eliminar usuario (solo admins)
export const deleteUser = async (userId) => {
  try {
    // Primero eliminar de la tabla usuarios
    const { error: userError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userId);

    if (userError) throw userError;

    // Luego eliminar de auth (esto requiere admin service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.warn('No se pudo eliminar de auth (requiere service role):', authError);
      // No lanzar error aquí ya que el usuario fue eliminado de la tabla
    }

    return true;
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    throw error;
  }
};

// Obtener estadísticas de usuarios
export const getUserStats = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('rol');

    if (error) throw error;

    const stats = {
      total: data.length,
      admins: data.filter(u => u.rol === 'ADMIN').length,
      tecnicos: data.filter(u => u.rol === 'TECNICO').length,
      sinRol: data.filter(u => !u.rol || u.rol === 'sin_asignar').length
    };

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};

// Verificar si el usuario actual puede editar otro usuario
export const canEditUser = async (targetUserId) => {
  try {
    const currentUser = await getCurrentUserProfile();
    
    // Solo admins pueden editar usuarios
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return false;
    }
    
    // Un admin no puede editarse a sí mismo para evitar quedarse sin acceso
    if (currentUser.id === targetUserId) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return false;
  }
};
