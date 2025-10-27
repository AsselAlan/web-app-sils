import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Grid,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/auth';

export default function Herramientas() {
  const [herramientas, setHerramientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedHerramienta, setSelectedHerramienta] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: '',
    zona: '',
    estado: '',
  });

  // Formulario
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'DE_MANO',
    zona: 'INSTALACIONES',
    cantidad_total: 1,
    cantidad_disponible: 1,
    estado: 'BIEN',
    puntuacion_estado: 10,
    ubicacion: '',
  });

  useEffect(() => {
    loadUserProfile();
    cargarHerramientas();
  }, []);

  const loadUserProfile = async () => {
    const profile = await getCurrentUserProfile();
    setUserProfile(profile);
  };

  const cargarHerramientas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('herramientas')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setHerramientas(data || []);
    } catch (err) {
      console.error('Error al cargar herramientas:', err);
      setError('Error al cargar el listado de herramientas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (herramienta = null) => {
    if (herramienta) {
      setSelectedHerramienta(herramienta);
      setFormData({
        codigo: herramienta.codigo,
        nombre: herramienta.nombre,
        descripcion: herramienta.descripcion || '',
        tipo: herramienta.tipo,
        zona: herramienta.zona,
        cantidad_total: herramienta.cantidad_total,
        cantidad_disponible: herramienta.cantidad_disponible,
        estado: herramienta.estado,
        puntuacion_estado: herramienta.puntuacion_estado || 10,
        ubicacion: herramienta.ubicacion || '',
      });
    } else {
      setSelectedHerramienta(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'DE_MANO',
        zona: 'INSTALACIONES',
        cantidad_total: 1,
        cantidad_disponible: 1,
        estado: 'BIEN',
        puntuacion_estado: 10,
        ubicacion: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedHerramienta(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');

      // Validaciones
      if (!formData.codigo || !formData.nombre) {
        setError('Código y nombre son obligatorios');
        return;
      }

      const herramientaData = {
        ...formData,
        created_by: userProfile?.id,
        updated_at: new Date().toISOString(),
      };

      if (selectedHerramienta) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('herramientas')
          .update(herramientaData)
          .eq('id', selectedHerramienta.id);

        if (updateError) throw updateError;
        setSuccess('Herramienta actualizada correctamente');
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('herramientas')
          .insert([herramientaData]);

        if (insertError) throw insertError;
        setSuccess('Herramienta creada correctamente');
      }

      handleCloseDialog();
      cargarHerramientas();
    } catch (err) {
      console.error('Error al guardar herramienta:', err);
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta herramienta?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      console.log('Intentando eliminar herramienta con ID:', id);
      
      const { data, error } = await supabase
        .from('herramientas')
        .delete()
        .eq('id', id)
        .select(); // Agregamos select() para obtener información sobre el registro eliminado

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      console.log('Herramienta eliminada exitosamente:', data);
      setSuccess('Herramienta eliminada correctamente');
      cargarHerramientas();
    } catch (err) {
      console.error('Error al eliminar herramienta:', err);
      setError(`Error al eliminar: ${err.message || 'Error desconocido'}`);
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      'DE_MANO': 'De Mano',
      'MAQUINAS': 'Máquinas',
      'INSUMOS': 'Insumos',
    };
    return labels[tipo] || tipo;
  };

  const getZonaLabel = (zona) => {
    const labels = {
      'INSTALACIONES': 'Instalaciones',
      'MANTENIMIENTO': 'Mantenimiento',
      'TALLER': 'Taller',
    };
    return labels[zona] || zona;
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'BIEN': 'success',
      'REGULAR': 'warning',
      'MAL': 'error',
      'FALTANTE': 'default',
    };
    return colors[estado] || 'default';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'BIEN': 'Bien',
      'REGULAR': 'Regular',
      'MAL': 'Mal',
      'FALTANTE': 'Faltante',
    };
    return labels[estado] || estado;
  };

  // Filtrar herramientas
  const herramientasFiltradas = herramientas.filter((h) => {
    const matchBusqueda = !filtros.busqueda || 
      h.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      h.codigo.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const matchTipo = !filtros.tipo || h.tipo === filtros.tipo;
    const matchZona = !filtros.zona || h.zona === filtros.zona;
    const matchEstado = !filtros.estado || h.estado === filtros.estado;

    return matchBusqueda && matchTipo && matchZona && matchEstado;
  });

  // Estadísticas
  const stats = {
    total: herramientas.length,
    bien: herramientas.filter(h => h.estado === 'BIEN').length,
    regular: herramientas.filter(h => h.estado === 'REGULAR').length,
    mal: herramientas.filter(h => h.estado === 'MAL').length,
    faltantes: herramientas.filter(h => h.estado === 'FALTANTE').length,
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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Herramientas
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gestión del catálogo de herramientas
            </Typography>
          </Box>
          {userProfile?.role === 'ADMIN' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nueva Herramienta
            </Button>
          )}
        </Box>

        {/* Alertas */}
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

        {/* Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Typography gutterBottom variant="body2">
                  Bien
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.bien}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent>
                <Typography gutterBottom variant="body2">
                  Regular
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.regular}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
              <CardContent>
                <Typography gutterBottom variant="body2">
                  Mal
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.mal}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'grey.400' }}>
              <CardContent>
                <Typography gutterBottom variant="body2">
                  Faltantes
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.faltantes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre o código..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtros.tipo}
                  label="Tipo"
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="DE_MANO">De Mano</MenuItem>
                  <MenuItem value="MAQUINAS">Máquinas</MenuItem>
                  <MenuItem value="INSUMOS">Insumos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Zona</InputLabel>
                <Select
                  value={filtros.zona}
                  label="Zona"
                  onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="INSTALACIONES">Instalaciones</MenuItem>
                  <MenuItem value="MANTENIMIENTO">Mantenimiento</MenuItem>
                  <MenuItem value="TALLER">Taller</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  label="Estado"
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="BIEN">Bien</MenuItem>
                  <MenuItem value="REGULAR">Regular</MenuItem>
                  <MenuItem value="MAL">Mal</MenuItem>
                  <MenuItem value="FALTANTE">Faltante</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell align="center">Cantidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Puntuación</TableCell>
                {userProfile?.role === 'ADMIN' && (
                  <TableCell align="center">Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {herramientasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay herramientas que coincidan con los filtros
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                herramientasFiltradas.map((herramienta) => (
                  <TableRow key={herramienta.id}>
                    <TableCell>{herramienta.codigo}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {herramienta.nombre}
                      </Typography>
                      {herramienta.descripcion && (
                        <Typography variant="caption" color="text.secondary">
                          {herramienta.descripcion}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={getTipoLabel(herramienta.tipo)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={getZonaLabel(herramienta.zona)} size="small" color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      {herramienta.cantidad_disponible} / {herramienta.cantidad_total}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getEstadoLabel(herramienta.estado)}
                        size="small"
                        color={getEstadoColor(herramienta.estado)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {herramienta.puntuacion_estado ? (
                        <Chip
                          label={herramienta.puntuacion_estado}
                          size="small"
                          color={
                            herramienta.puntuacion_estado >= 7
                              ? 'success'
                              : herramienta.puntuacion_estado >= 5
                              ? 'warning'
                              : 'error'
                          }
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    {userProfile?.role === 'ADMIN' && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(herramienta)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(herramienta.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog para crear/editar herramienta */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedHerramienta ? 'Editar Herramienta' : 'Nueva Herramienta'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Código"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Descripción"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={formData.tipo}
                      label="Tipo"
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <MenuItem value="DE_MANO">De Mano</MenuItem>
                      <MenuItem value="MAQUINAS">Máquinas</MenuItem>
                      <MenuItem value="INSUMOS">Insumos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
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
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={formData.estado}
                      label="Estado"
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <MenuItem value="BIEN">Bien</MenuItem>
                      <MenuItem value="REGULAR">Regular</MenuItem>
                      <MenuItem value="MAL">Mal</MenuItem>
                      <MenuItem value="FALTANTE">Faltante</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Cantidad Total"
                    type="number"
                    value={formData.cantidad_total}
                    onChange={(e) => setFormData({ ...formData, cantidad_total: parseInt(e.target.value) })}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Cantidad Disponible"
                    type="number"
                    value={formData.cantidad_disponible}
                    onChange={(e) => setFormData({ ...formData, cantidad_disponible: parseInt(e.target.value) })}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Puntuación (1-10)"
                    type="number"
                    value={formData.puntuacion_estado}
                    onChange={(e) => setFormData({ ...formData, puntuacion_estado: parseInt(e.target.value) })}
                    fullWidth
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Ubicación"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedHerramienta ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
