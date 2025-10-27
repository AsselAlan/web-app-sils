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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { getAllUsers, updateUserRole, updateUserZona } from '../services/auth';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    rol: 'TECNICO',
    zona: 'INSTALACIONES',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener todos los usuarios desde la tabla usuarios
      const users = await getAllUsers();
      setUsuarios(users || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        rol: user.role || 'TECNICO',
        zona: user.zona || 'INSTALACIONES',
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        rol: 'TECNICO',
        zona: 'INSTALACIONES',
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

      // Actualizar rol del usuario
      await updateUserRole(selectedUser.id, formData.rol);
      
      // Si es técnico, actualizar zona
      if (formData.rol === 'TECNICO') {
        await updateUserZona(selectedUser.id, formData.zona);
      }

      setSuccess('Usuario actualizado correctamente');
      handleCloseDialog();
      cargarUsuarios();
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      setError('Error al actualizar el usuario: ' + err.message);
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'ADMIN':
        return 'error';
      case 'TECNICO':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getZonaColor = (zona) => {
    switch (zona) {
      case 'INSTALACIONES':
        return 'success';
      case 'MANTENIMIENTO':
        return 'warning';
      case 'TALLER':
        return 'info';
      default:
        return 'default';
    }
  };

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

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell>Fecha de Registro</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
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
                      {user.zona ? (
                        <Chip
                          label={user.zona}
                          color={getZonaColor(user.zona)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <EditIcon />
                      </IconButton>
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
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="TECNICO">Técnico</MenuItem>
                </Select>
              </FormControl>

              {formData.rol === 'TECNICO' && (
                <FormControl fullWidth>
                  <InputLabel>Zona</InputLabel>
                  <Select
                    value={formData.zona}
                    label="Zona"
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                  >
                    <MenuItem value="INSTALACIONES">Instalaciones</MenuItem>
                    <MenuItem value="MANTENIMIENTO">Mantenimiento</MenuItem>
                    <MenuItem value="TALLER">Taller</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleUpdateUser} variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
