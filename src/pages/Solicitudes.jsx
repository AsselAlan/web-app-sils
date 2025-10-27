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
  Autocomplete,
  Tab,
  Tabs,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Assignment as RequestIcon,
  Build as RepairIcon,
  SwapHoriz as ChangeIcon,
  Warning as WarningIcon,
  CheckCircle as CompleteIcon,
  LocalShipping as DeliverIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/auth';
import { ESTADOS_HERRAMIENTAS } from '../types/constants';

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [herramientasMalEstado, setHerramientasMalEstado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    tipo_solicitud: 'NUEVA_HERRAMIENTA',
    prioridad: 'NECESARIA',
    nombre_herramienta: '',
    tipo_herramienta: '',
    marca: '',
    descripcion_uso: '',
    herramienta_id: null,
    comentarios: ''
  });
  const [adminResponse, setAdminResponse] = useState({
    accion: 'APROBAR',
    respuesta: '',
    herramienta_nueva_codigo: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [userProfile, solicitudesData, herramientasData] = await Promise.all([
        getCurrentUserProfile(),
        cargarSolicitudes(),
        cargarHerramientasMalEstado()
      ]);
      
      setCurrentUser(userProfile);
      setSolicitudes(solicitudesData || []);
      setHerramientasMalEstado(herramientasData || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const cargarSolicitudes = async () => {
    const { data, error } = await supabase
      .from('solicitudes')
      .select(`
        *,
        usuarios:solicitado_por(email),
        admin:revisado_por(email),
        herramientas:herramienta_id(nombre, codigo, estado)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar solicitudes:', error);
      throw error;
    }
    return data;
  };

  const cargarHerramientasMalEstado = async () => {
    const { data, error } = await supabase
      .from('herramientas')
      .select('id, nombre, codigo, estado, puntuacion_estado')
      .in('estado', [ESTADOS_HERRAMIENTAS.MAL, ESTADOS_HERRAMIENTAS.FALTANTE])
      .order('puntuacion_estado', { ascending: true });

    if (error) {
      console.error('Error al cargar herramientas:', error);
      throw error;
    }
    return data;
  };

  const handleOpenDialog = () => {
    setFormData({
      tipo_solicitud: 'NUEVA_HERRAMIENTA',
      prioridad: 'NECESARIA',
      nombre_herramienta: '',
      tipo_herramienta: '',
      marca: '',
      descripcion_uso: '',
      herramienta_id: null,
      comentarios: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleOpenAdminDialog = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setAdminResponse({
      accion: 'APROBAR',
      respuesta: '',
      herramienta_nueva_codigo: ''
    });
    setOpenAdminDialog(true);
  };

  const handleCloseAdminDialog = () => {
    setOpenAdminDialog(false);
    setSelectedSolicitud(null);
    setError('');
  };

  const handleSubmitSolicitud = async () => {
    try {
      setError('');
      setSuccess('');

      if (!currentUser) {
        setError('Usuario no identificado');
        return;
      }

      // Validaciones según tipo de solicitud
      if (formData.tipo_solicitud === 'NUEVA_HERRAMIENTA') {
        if (!formData.nombre_herramienta || !formData.tipo_herramienta || !formData.descripcion_uso) {
          setError('Complete todos los campos requeridos para nueva herramienta');
          return;
        }
      } else if (formData.tipo_solicitud === 'REPARACION' || formData.tipo_solicitud === 'CAMBIO') {
        if (!formData.herramienta_id) {
          setError('Seleccione una herramienta para reparación o cambio');
          return;
        }
      }

      const solicitudData = {
        tipo: formData.tipo_solicitud,
        prioridad: parseInt(getPrioridadNumero(formData.prioridad)),
        motivo: formData.comentarios,
        solicitado_por: currentUser.id,
        fecha_solicitud: new Date().toISOString(),
        estado: 'PENDIENTE'
      };

      // Agregar campos específicos según tipo
      if (formData.tipo_solicitud === 'NUEVA_HERRAMIENTA') {
        solicitudData.herramienta_nueva_nombre = formData.nombre_herramienta;
        solicitudData.herramienta_nueva_tipo = formData.tipo_herramienta;
        // Agregar más campos si necesario
      } else {
        solicitudData.herramienta_id = formData.herramienta_id;
      }

      const { error: insertError } = await supabase
        .from('solicitudes')
        .insert(solicitudData);

      if (insertError) throw insertError;

      setSuccess('Solicitud creada correctamente');
      handleCloseDialog();
      cargarDatos();
    } catch (err) {
      console.error('Error al crear solicitud:', err);
      setError('Error al crear la solicitud: ' + err.message);
    }
  };

  const handleAdminResponse = async () => {
    try {
      setError('');
      setSuccess('');

      if (!selectedSolicitud) return;

      const updateData = {
        estado: adminResponse.accion === 'APROBAR' ? 'APROBADA' : 'RECHAZADA',
        revisado_por: currentUser.id,
        fecha_revision: new Date().toISOString(),
        comentario_revision: adminResponse.respuesta
      };

      const { error: updateError } = await supabase
        .from('solicitudes')
        .update(updateData)
        .eq('id', selectedSolicitud.id);

      if (updateError) throw updateError;

      // Si es aprobación de nueva herramienta, crear la herramienta
      if (adminResponse.accion === 'APROBAR' && selectedSolicitud.tipo === 'NUEVA_HERRAMIENTA' && adminResponse.herramienta_nueva_codigo) {
        const herramientaData = {
          codigo: adminResponse.herramienta_nueva_codigo,
          nombre: selectedSolicitud.herramienta_nueva_nombre,
          tipo: selectedSolicitud.herramienta_nueva_tipo || 'MANUAL',
          zona: 'INSTALACIONES', // Por defecto
          cantidad_total: 1,
          cantidad_disponible: 0, // Inicialmente no disponible hasta entrega
          estado: 'NUEVO',
          puntuacion_estado: 10,
          descripcion: `Herramienta solicitada por ${selectedSolicitud.usuarios?.email}`,
          created_by: currentUser.id
        };

        const { error: herramientaError } = await supabase
          .from('herramientas')
          .insert(herramientaData);

        if (herramientaError) {
          console.error('Error al crear herramienta:', herramientaError);
          // No lanzar error aquí para no cancelar la aprobación
        }
      }

      setSuccess(`Solicitud ${adminResponse.accion === 'APROBAR' ? 'aprobada' : 'rechazada'} correctamente`);
      handleCloseAdminDialog();
      cargarDatos();
    } catch (err) {
      console.error('Error al procesar solicitud:', err);
      setError('Error al procesar la solicitud: ' + err.message);
    }
  };

  const handleMarcarEntregada = async (solicitudId) => {
    try {
      const { error } = await supabase
        .from('solicitudes')
        .update({ 
          estado: 'ENTREGADA',
          fecha_revision: new Date().toISOString()
        })
        .eq('id', solicitudId);

      if (error) throw error;

      setSuccess('Solicitud marcada como entregada');
      cargarDatos();
    } catch (err) {
      console.error('Error al marcar como entregada:', err);
      setError('Error al marcar como entregada: ' + err.message);
    }
  };

  const getPrioridadNumero = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE': return 3;
      case 'NECESARIA': return 2;
      case 'UTIL': return 1;
      default: return 2;
    }
  };

  const getPrioridadTexto = (numero) => {
    switch (numero) {
      case 3: return 'URGENTE';
      case 2: return 'NECESARIA';
      case 1: return 'UTIL';
      default: return 'NECESARIA';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'APROBADA': return 'success';
      case 'RECHAZADA': return 'error';
      case 'ENTREGADA': return 'info';
      case 'COMPLETADA': return 'primary';
      default: return 'default';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE': return 'error';
      case 'NECESARIA': return 'warning';
      case 'UTIL': return 'info';
      default: return 'default';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'NUEVA_HERRAMIENTA': return <AddIcon />;
      case 'REPARACION': return <RepairIcon />;
      case 'CAMBIO': return <ChangeIcon />;
      default: return <RequestIcon />;
    }
  };

  const filteredSolicitudes = solicitudes.filter(s => {
    if (currentUser?.role === 'ADMIN') return true;
    return s.solicitado_por === currentUser?.id;
  });

  const solicitudesPendientes = filteredSolicitudes.filter(s => s.estado === 'PENDIENTE');
  const solicitudesAprobadas = filteredSolicitudes.filter(s => s.estado === 'APROBADA');
  const solicitudesEntregadas = filteredSolicitudes.filter(s => s.estado === 'ENTREGADA');

  const getSolicitudesByTab = () => {
    switch (tabValue) {
      case 0: return solicitudesPendientes;
      case 1: return solicitudesAprobadas;
      case 2: return solicitudesEntregadas;
      default: return filteredSolicitudes;
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
            {currentUser?.role === 'ADMIN' ? 'Gestión de Solicitudes' : 'Mis Solicitudes'}
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

        {/* Estadísticas rápidas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {solicitudesPendientes.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Pendientes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CompleteIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {solicitudesAprobadas.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Aprobadas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CompleteIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {solicitudesEntregadas.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Entregadas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label={`Pendientes (${solicitudesPendientes.length})`} />
            <Tab label={`Aprobadas (${solicitudesAprobadas.length})`} />
            <Tab label={`Entregadas (${solicitudesEntregadas.length})`} />
          </Tabs>
        </Paper>

        {/* Tabla de solicitudes */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                {currentUser?.role === 'ADMIN' && <TableCell>Solicitante</TableCell>}
                <TableCell>Prioridad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getSolicitudesByTab().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={currentUser?.role === 'ADMIN' ? 7 : 6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay solicitudes en esta categoría
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getSolicitudesByTab().map((solicitud) => (
                  <TableRow key={solicitud.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTipoIcon(solicitud.tipo)}
                        <Typography variant="body2">
                          {solicitud.tipo === 'NUEVA_HERRAMIENTA' ? 'Nueva' : 
                           solicitud.tipo === 'REPARACION' ? 'Reparación' : 'Cambio'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {solicitud.tipo === 'NUEVA_HERRAMIENTA' 
                          ? solicitud.herramienta_nueva_nombre 
                          : solicitud.herramientas?.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {solicitud.motivo}
                      </Typography>
                    </TableCell>
                    {currentUser?.role === 'ADMIN' && (
                      <TableCell>{solicitud.usuarios?.email}</TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={getPrioridadTexto(solicitud.prioridad)}
                        color={getPrioridadColor(getPrioridadTexto(solicitud.prioridad))}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={solicitud.estado}
                        color={getEstadoColor(solicitud.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(solicitud.created_at || solicitud.fecha_solicitud).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {currentUser?.role === 'ADMIN' && solicitud.estado === 'PENDIENTE' && (
                          <Tooltip title="Revisar solicitud">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenAdminDialog(solicitud)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {currentUser?.role === 'ADMIN' && solicitud.estado === 'APROBADA' && (
                          <Tooltip title="Marcar como entregada">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleMarcarEntregada(solicitud.id)}
                            >
                              <DeliverIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* FAB para crear solicitud (solo técnicos) */}
        {currentUser?.role === 'TECNICO' && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={handleOpenDialog}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Dialog para crear solicitud */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Nueva Solicitud de Herramienta</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Solicitud</InputLabel>
                <Select
                  value={formData.tipo_solicitud}
                  label="Tipo de Solicitud"
                  onChange={(e) => setFormData({ ...formData, tipo_solicitud: e.target.value })}
                >
                  <MenuItem value="NUEVA_HERRAMIENTA">Nueva Herramienta</MenuItem>
                  <MenuItem value="REPARACION">Reparación</MenuItem>
                  <MenuItem value="CAMBIO">Cambio por Defecto</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.prioridad}
                  label="Prioridad"
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                >
                  <MenuItem value="URGENTE">Urgente</MenuItem>
                  <MenuItem value="NECESARIA">Necesaria</MenuItem>
                  <MenuItem value="UTIL">Útil</MenuItem>
                </Select>
              </FormControl>

              {formData.tipo_solicitud === 'NUEVA_HERRAMIENTA' ? (
                <>
                  <TextField
                    fullWidth
                    label="Nombre de la Herramienta"
                    value={formData.nombre_herramienta}
                    onChange={(e) => setFormData({ ...formData, nombre_herramienta: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Tipo/Categoría"
                    value={formData.tipo_herramienta}
                    onChange={(e) => setFormData({ ...formData, tipo_herramienta: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Marca (opcional)"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Descripción de Uso"
                    multiline
                    rows={3}
                    value={formData.descripcion_uso}
                    onChange={(e) => setFormData({ ...formData, descripcion_uso: e.target.value })}
                    required
                    placeholder="Describa para qué necesita esta herramienta y cómo la va a usar"
                  />
                </>
              ) : (
                <Autocomplete
                  options={herramientasMalEstado}
                  getOptionLabel={(option) => `${option.codigo} - ${option.nombre} (${option.estado})`}
                  value={herramientasMalEstado.find(h => h.id === formData.herramienta_id) || null}
                  onChange={(e, newValue) => setFormData({ ...formData, herramienta_id: newValue?.id || null })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Seleccionar Herramienta en Mal Estado"
                      required
                    />
                  )}
                />
              )}

              <TextField
                fullWidth
                label="Comentarios Adicionales"
                multiline
                rows={2}
                value={formData.comentarios}
                onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                placeholder="Información adicional sobre la solicitud"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmitSolicitud} variant="contained">
              Crear Solicitud
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para respuesta admin */}
        <Dialog open={openAdminDialog} onClose={handleCloseAdminDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Revisar Solicitud</DialogTitle>
          <DialogContent>
            {selectedSolicitud && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedSolicitud.tipo === 'NUEVA_HERRAMIENTA' 
                    ? selectedSolicitud.herramienta_nueva_nombre 
                    : selectedSolicitud.herramientas?.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Solicitado por: {selectedSolicitud.usuarios?.email}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {selectedSolicitud.motivo}
                </Typography>

                <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                  <InputLabel>Acción</InputLabel>
                  <Select
                    value={adminResponse.accion}
                    label="Acción"
                    onChange={(e) => setAdminResponse({ ...adminResponse, accion: e.target.value })}
                  >
                    <MenuItem value="APROBAR">Aprobar</MenuItem>
                    <MenuItem value="RECHAZAR">Rechazar</MenuItem>
                  </Select>
                </FormControl>

                {adminResponse.accion === 'APROBAR' && selectedSolicitud.tipo === 'NUEVA_HERRAMIENTA' && (
                  <TextField
                    fullWidth
                    label="Código para Nueva Herramienta"
                    value={adminResponse.herramienta_nueva_codigo}
                    onChange={(e) => setAdminResponse({ ...adminResponse, herramienta_nueva_codigo: e.target.value })}
                    sx={{ mb: 2 }}
                    placeholder="Ej: MART-001"
                  />
                )}

                <TextField
                  fullWidth
                  label="Respuesta/Comentarios"
                  multiline
                  rows={3}
                  value={adminResponse.respuesta}
                  onChange={(e) => setAdminResponse({ ...adminResponse, respuesta: e.target.value })}
                  placeholder="Comentarios sobre la decisión tomada"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdminDialog}>Cancelar</Button>
            <Button 
              onClick={handleAdminResponse} 
              variant="contained"
              color={adminResponse.accion === 'APROBAR' ? 'success' : 'error'}
            >
              {adminResponse.accion === 'APROBAR' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
