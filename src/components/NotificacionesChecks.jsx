import { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/auth';
import { LABELS } from '../types/constants';

export default function NotificacionesChecks() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(true);

  useEffect(() => {
    loadUserProfile();
    cargarNotificaciones();
    
    // Actualizar notificaciones cada 5 minutos
    const interval = setInterval(cargarNotificaciones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUserProfile = async () => {
    const profile = await getCurrentUserProfile();
    setCurrentUser(profile);
  };

  const cargarNotificaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('notificaciones_checks')
        .select(`
          *,
          checks_diarios!inner(
            fecha,
            zona,
            estado
          )
        `)
        .eq('activa', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotificaciones(data || []);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  };

  const marcarComoLeida = async (notificacionId) => {
    try {
      const { error } = await supabase
        .from('notificaciones_checks')
        .update({ activa: false })
        .eq('id', notificacionId);

      if (error) throw error;
      
      // Remover de la lista local
      setNotificaciones(prev => prev.filter(n => n.id !== notificacionId));
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  const obtenerChecksPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from('checks_diarios')
        .select('*')
        .eq('estado', 'PENDIENTE')
        .lt('fecha', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error al obtener checks pendientes:', err);
      return [];
    }
  };

  if (!mostrarNotificaciones || notificaciones.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {notificaciones.map((notificacion) => (
        <Alert
          key={notificacion.id}
          severity="warning"
          sx={{ mb: 1 }}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={() => window.location.href = '/checks-diarios'}
              >
                Ver Checks
              </Button>
              <IconButton
                color="inherit"
                size="small"
                onClick={() => marcarComoLeida(notificacion.id)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          }
          icon={<WarningIcon />}
        >
          <AlertTitle>Check Diario Pendiente</AlertTitle>
          <Typography variant="body2">
            Zona: <strong>{LABELS.ZONAS[notificacion.checks_diarios.zona]}</strong> - 
            Fecha: <strong>{new Date(notificacion.checks_diarios.fecha).toLocaleDateString('es-ES')}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {notificacion.mensaje}
          </Typography>
        </Alert>
      ))}
    </Box>
  );
}
