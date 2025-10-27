import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box, Paper, Typography, Container } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { getCurrentUserProfile } from '../services/auth';

export default function RoleGuard({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userProfile = await getCurrentUserProfile();
    setProfile(userProfile);
    setLoading(false);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no tiene rol asignado
  if (profile.role === 'sin_asignar') {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <WarningIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Acceso Pendiente
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Tu cuenta está registrada pero aún no tienes un rol asignado.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Por favor, contacta a un administrador para que active tu cuenta y te asigne un rol.
            </Typography>
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                Email: {profile.email}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Estado: Esperando asignación de rol
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  // Si se especificaron roles permitidos, verificar
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <WarningIcon sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Acceso Restringido
            </Typography>
            <Typography variant="body1">
              No tienes permisos para acceder a esta sección.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
              Tu rol actual: <strong>{profile.role}</strong>
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  // Usuario tiene rol asignado y tiene permisos
  return children;
}
