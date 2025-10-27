import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Tooltip,
  DialogContentText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as EngineeringIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import {
getAllUsers, 
updateUserRole, 
deleteUser, 
getUserStats,
canEditUser,
getCurrentUserProfile 
} from '../services/auth';
import { ROLES, ZONAS, LABELS } from '../types/constants';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    rol: ROLES.TECNICO
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cargar en paralelo: usuarios, estadísticas y usuario actual
      const [users, userStats, current] = await Promise.all([
        getAllUsers(),
        getUserStats(),
        getCurrentUserProfile()
      ]);
      
      setUsuarios(users || []);
      setStats(userStats);
      setCurrentUser(current);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        rol: user.role || ROLES.TECNICO
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        rol: ROLES.TECNICO
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setError('');
  };

  const handleUpdateUser = async () => {
    try {
      setError('');
      setSuccess('');

      if (!selectedUser) {
        setError('No se ha seleccionado un usuario');
        return;
      }

      // Verificar permisos
      const canEdit = await canEditUser(selectedUser.id);
      if (!canEdit) {
        setError('No tienes permisos para editar este usuario');
        return;
      }

      // Actualizar rol del usuario
      await updateUserRole(selectedUser.id, formData.rol);

      setSuccess('Usuario actualizado correctamente');
      handleCloseDialog();
      cargarDatos();
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      setError('Error al actualizar el usuario: ' + err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setDeleting(true);
      setError('');

      if (!selectedUser) {
        setError('No se ha seleccionado un usuario');
        return;
      }

      // Verificar permisos
      const canEdit = await canEditUser(selectedUser.id);
      if (!canEdit) {
        setError('No tienes permisos para eliminar este usuario');
        return;
      }

      await deleteUser(selectedUser.id);
      setSuccess('Usuario eliminado correctamente');
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      cargarDatos();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar el usuario: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
    setError('');
  };

  const canCurrentUserEdit = (user) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return false;
    }
    // Un admin no puede editarse a sí mismo
    return currentUser.id !== user.id;
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case ROLES.ADMIN:
        return 'error';
      case ROLES.TECNICO:
        return 'primary';
      default:
        return 'default';
    }
  };

  // Función eliminada: getZonaColor - Los usuarios ya no tienen zona

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Gestión de Usuarios
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Tarjetas de estadísticas */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.total}
                      </Typography>
                      <Typography color="text.secondary">
                        Total Usuarios
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AdminIcon color="error" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.admins}
                      </Typography>
                      <Typography color="text.secondary">
                        Administradores
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EngineeringIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.tecnicos}
                      </Typography>
                      <Typography color="text.secondary">
                        Técnicos
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" component="div">
                        {stats.sinRol}
                      </Typography>
                      <Typography color="text.secondary">
                        Sin Rol Asignado
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Fecha de Registro</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay usuarios registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role || 'Sin asignar'}
                        color={getRolColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title={canCurrentUserEdit(user) ? "Editar usuario" : "No puedes editar este usuario"}>
                          <span>
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenDialog(user)}
                              disabled={!canCurrentUserEdit(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={canCurrentUserEdit(user) ? "Eliminar usuario" : "No puedes eliminar este usuario"}>
                          <span>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleOpenDeleteDialog(user)}
                              disabled={!canCurrentUserEdit(user)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog para editar usuario */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                value={formData.email}
                disabled
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol}
                  label="Rol"
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                >
                  <MenuItem value={ROLES.ADMIN}>{LABELS.ROLES.ADMIN}</MenuItem>
                  <MenuItem value={ROLES.TECNICO}>{LABELS.ROLES.TECNICO}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleUpdateUser} variant="contained">
              Guardar
            </Button>
          </DialogActions>
          </Dialog>

          {/* Diálogo de confirmación para eliminar usuario */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              ¿Eliminar Usuario?
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                ¿Estás seguro de que deseas eliminar al usuario{' '}
                <strong>{selectedUser?.email}</strong>?
                <br /><br />
                Esta acción no se puede deshacer y el usuario perderá acceso al sistema.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setOpenDeleteDialog(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDeleteUser} 
                color="error" 
                variant="contained"
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </Dialog>
      </Container>
    </>
  );
}
