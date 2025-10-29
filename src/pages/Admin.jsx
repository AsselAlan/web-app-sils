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
  Tab,
  Tabs,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Assignment as RequestIcon,
  Build as RepairIcon,
  SwapHoriz as ChangeIcon,
  Warning as WarningIcon,
  CheckCircle as CompleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/auth';

const PRIORIDADES = {
  URGENTE: { valor: 3, texto: 'URGENTE', color: 'error' },
  NECESARIA: { valor: 2, texto: 'NECESARIA', color: 'warning' },
  UTIL: { valor: 1, texto: 'UTIL', color: 'info' }
};

const TIPOS_SOLICITUD = {
  NUEVA: 'NUEVA',
  REPARACION: 'REPARACION',
  CAMBIO: 'CAMBIO'
};

export default function Admin() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Respuesta del admin
  const [adminResponse, setAdminResponse] = useState({
    accion: 'PENDIENTE', // APROBADA, RECHAZADA, PENDIENTE
    respuesta: '',
    crear_herramienta: false,
    nuevo_codigo: '',
    nueva_descripcion: '',
    nuevo_estado_herramienta: 'BIEN' // Para reparaciones
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtros
  const [filtros, setFiltros] = useState({
    zona: '',
    tipo: '',
    prioridad: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [userProfile, solicitudesData] = await Promise.all([
        getCurrentUserProfile(),
        cargarSolicitudes()
      ]);
      
      setCurrentUser(userProfile);
      setSolicitudes(solicitudesData || []);
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
        herramientas:herramienta_id(nombre, codigo, estado, zona)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar solicitudes:', error);
      throw error;
    }
    return data;
  };

  const handleOpenAdminDialog = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setAdminResponse({
      accion: 'PENDIENTE',
      respuesta: '',
      crear_herramienta: false,
      nuevo_codigo: '',
      nueva_descripcion: '',
      nuevo_estado_herramienta: 'BIEN'
    });
    setOpenAdminDialog(true);
  };

  const handleCloseAdminDialog = () => {
    setOpenAdminDialog(false);
    setSelectedSolicitud(null);
    setError('');
  };

  const handleOpenViewDialog = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedSolicitud(null);
  };

  const handleAdminResponse = async () => {
    try {
      setError('');
      setSuccess('');

      if (!selectedSolicitud || adminResponse.accion === 'PENDIENTE') {
        setError('Seleccione una acción');
        return;
      }

      const updateData = {
        estado: adminResponse.accion,
        revisado_por: currentUser.id,
        fecha_revision: new Date().toISOString(),
        comentario_revision: adminResponse.respuesta
      };

      const { error: updateError } = await supabase
        .from('solicitudes')
        .update(updateData)
        .eq('id', selectedSolicitud.id);

      if (updateError) throw updateError;

      // Lógica específica para aprobaciones
      if (adminResponse.accion === 'APROBADA') {
        await procesarAprobacion();
      }

      setSuccess(`Solicitud ${adminResponse.accion.toLowerCase()} correctamente`);
      handleCloseAdminDialog();
      cargarDatos();
    } catch (err) {
      console.error('Error al procesar solicitud:', err);
      setError('Error al procesar la solicitud: ' + err.message);
    }
  };

  const procesarReparacion = async (herramientaId, nuevoEstado) => {
    console.log('=== ACTUALIZANDO ESTADO DE HERRAMIENTA ===');
    console.log('ID:', herramientaId, 'Nuevo Estado:', nuevoEstado);

    const { error } = await supabase
      .from('herramientas')
      .update({ 
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', herramientaId);

    if (error) {
      console.error('Error al actualizar herramienta:', error);
      throw new Error(`Error al actualizar el estado de la herramienta: ${error.message}`);
    }

    console.log('✅ ESTADO ACTUALIZADO EXITOSAMENTE');
  };

  const procesarAprobacion = async () => {
    const { tipo } = selectedSolicitud;

    if (tipo === TIPOS_SOLICITUD.NUEVA && adminResponse.crear_herramienta) {
      // Crear nueva herramienta
      const herramientaData = {
        codigo: adminResponse.nuevo_codigo,
        nombre: selectedSolicitud.herramienta_nueva_nombre,
        tipo: selectedSolicitud.herramienta_nueva_tipo,
        zona: selectedSolicitud.zona,
        cantidad_total: 1,
        cantidad_disponible: 0,
        estado: 'BIEN',
        descripcion: adminResponse.nueva_descripcion || selectedSolicitud.descripcion_uso,
        created_by: currentUser.id
      };

      const { error: herramientaError } = await supabase
        .from('herramientas')
        .insert(herramientaData);

      if (herramientaError) {
        console.error('Error al crear herramienta:', herramientaError);
        throw new Error('Error al crear la herramienta asociada');
      }
    } else if (tipo === TIPOS_SOLICITUD.CAMBIO && adminResponse.crear_herramienta) {
      // Para cambios, crear nueva herramienta de reemplazo
      const herramientaOriginal = selectedSolicitud.herramientas;
      const herramientaData = {
        codigo: adminResponse.nuevo_codigo,
        nombre: herramientaOriginal.nombre,
        tipo: herramientaOriginal.tipo || 'DE_MANO',
        zona: selectedSolicitud.zona,
        cantidad_total: 1,
        cantidad_disponible: 0,
        estado: 'BIEN',
        descripcion: adminResponse.nueva_descripcion || `Reemplazo de ${herramientaOriginal.codigo}`,
        created_by: currentUser.id
      };

      const { error: herramientaError } = await supabase
        .from('herramientas')
        .insert(herramientaData);

      if (herramientaError) {
        console.error('Error al crear herramienta de reemplazo:', herramientaError);
        throw new Error('Error al crear la herramienta de reemplazo');
      }

      // Marcar la herramienta original como dada de baja
      await supabase
        .from('herramientas')
        .update({ 
          estado: 'FALTANTE',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSolicitud.herramienta_id);
    } else if (tipo === TIPOS_SOLICITUD.REPARACION && selectedSolicitud.herramienta_id) {
      // Para reparaciones, usar función especializada
      await procesarReparacion(selectedSolicitud.herramienta_id, adminResponse.nuevo_estado_herramienta);
    }
  };

  const getPrioridadInfo = (valor) => {
    const prioridad = Object.values(PRIORIDADES).find(p => p.valor === valor);
    return prioridad || PRIORIDADES.NECESARIA;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'APROBADA': return 'success';
      case 'RECHAZADA': return 'error';
      default: return 'default';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case TIPOS_SOLICITUD.NUEVA: return <AddIcon />;
      case TIPOS_SOLICITUD.REPARACION: return <RepairIcon />;
      case TIPOS_SOLICITUD.CAMBIO: return <ChangeIcon />;
      default: return <RequestIcon />;
    }
  };

  const getTipoTexto = (tipo) => {
    switch (tipo) {
      case TIPOS_SOLICITUD.NUEVA: return 'Nueva Herramienta';
      case TIPOS_SOLICITUD.REPARACION: return 'Reparación';
      case TIPOS_SOLICITUD.CAMBIO: return 'Cambio';
      default: return tipo;
    }
  };

  // Función para aplicar filtros
  const aplicarFiltros = (solicitudesList) => {
    return solicitudesList.filter(solicitud => {
      const cumpleZona = !filtros.zona || solicitud.zona === filtros.zona;
      const cumpleTipo = !filtros.tipo || solicitud.tipo === filtros.tipo;
      const cumplePrioridad = !filtros.prioridad || getPrioridadInfo(solicitud.prioridad).texto === filtros.prioridad;
      
      return cumpleZona && cumpleTipo && cumplePrioridad;
    });
  };

  // Separar por estado con filtros aplicados
  const solicitudesPendientes = aplicarFiltros(solicitudes.filter(s => s.estado === 'PENDIENTE'));
  const solicitudesAprobadas = aplicarFiltros(solicitudes.filter(s => s.estado === 'APROBADA'));
  const solicitudesRechazadas = aplicarFiltros(solicitudes.filter(s => s.estado === 'RECHAZADA'));

  const getSolicitudesByTab = () => {
    switch (tabValue) {
      case 0: return solicitudesPendientes;
      case 1: return solicitudesAprobadas;
      case 2: return solicitudesRechazadas;
      default: return solicitudes;
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
            Administración de Solicitudes
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

        {/* Estadísticas */}
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
                  <RejectIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {solicitudesRechazadas.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Rechazadas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Zona</InputLabel>
                <Select
                  value={filtros.zona}
                  onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
                  label="Zona"
                >
                  <MenuItem value="">Todas las zonas</MenuItem>
                  <MenuItem value="MANTENIMIENTO">MANTENIMIENTO</MenuItem>
                  <MenuItem value="TALLER">TALLER</MenuItem>
                  <MenuItem value="INSTALACIONES">INSTALACIONES</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                  label="Tipo"
                >
                  <MenuItem value="">Todos los tipos</MenuItem>
                  <MenuItem value="NUEVA">Nueva Herramienta</MenuItem>
                  <MenuItem value="REPARACION">Reparación</MenuItem>
                  <MenuItem value="CAMBIO">Cambio</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={filtros.prioridad}
                  onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
                  label="Prioridad"
                >
                  <MenuItem value="">Todas las prioridades</MenuItem>
                  <MenuItem value="URGENTE">URGENTE</MenuItem>
                  <MenuItem value="NECESARIA">NECESARIA</MenuItem>
                  <MenuItem value="UTIL">UTIL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setFiltros({ zona: '', tipo: '', prioridad: '' })}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </Paper>

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
            <Tab label={`Rechazadas (${solicitudesRechazadas.length})`} />
          </Tabs>
        </Paper>

        {/* Tabla de solicitudes */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell>Solicitante</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getSolicitudesByTab().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
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
                          {getTipoTexto(solicitud.tipo)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {solicitud.tipo === TIPOS_SOLICITUD.NUEVA 
                          ? solicitud.herramienta_nueva_nombre 
                          : solicitud.herramientas?.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {solicitud.motivo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={solicitud.zona} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{solicitud.usuarios?.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getPrioridadInfo(solicitud.prioridad).texto}
                        color={getPrioridadInfo(solicitud.prioridad).color}
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
                      {new Date(solicitud.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenViewDialog(solicitud)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {solicitud.estado === 'PENDIENTE' && (
                          <Tooltip title="Procesar solicitud">
                            <IconButton
                              color="secondary"
                              size="small"
                              onClick={() => handleOpenAdminDialog(solicitud)}
                            >
                              <EditIcon />
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

        {/* Dialog para ver detalles */}
        <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Detalles de Solicitud</DialogTitle>
          <DialogContent>
            {selectedSolicitud && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Tipo:</Typography>
                    <Typography>{getTipoTexto(selectedSolicitud.tipo)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Zona:</Typography>
                    <Typography>{selectedSolicitud.zona}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Prioridad:</Typography>
                    <Chip
                      label={getPrioridadInfo(selectedSolicitud.prioridad).texto}
                      color={getPrioridadInfo(selectedSolicitud.prioridad).color}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Estado:</Typography>
                    <Chip
                      label={selectedSolicitud.estado}
                      color={getEstadoColor(selectedSolicitud.estado)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Descripción:</Typography>
                    <Typography>{selectedSolicitud.motivo}</Typography>
                  </Grid>
                  {selectedSolicitud.falla && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Falla:</Typography>
                      <Typography>{selectedSolicitud.falla}</Typography>
                    </Grid>
                  )}
                  {selectedSolicitud.descripcion_uso && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Descripción de Uso:</Typography>
                      <Typography>{selectedSolicitud.descripcion_uso}</Typography>
                    </Grid>
                  )}
                  {selectedSolicitud.marca && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Marca:</Typography>
                      <Typography>{selectedSolicitud.marca}</Typography>
                    </Grid>
                  )}
                  {selectedSolicitud.comentario_adicional && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Comentario Adicional:</Typography>
                      <Typography>{selectedSolicitud.comentario_adicional}</Typography>
                    </Grid>
                  )}
                  {selectedSolicitud.comentario_revision && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Respuesta Admin:</Typography>
                      <Typography>{selectedSolicitud.comentario_revision}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para respuesta admin */}
        <Dialog open={openAdminDialog} onClose={handleCloseAdminDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Procesar Solicitud</DialogTitle>
          <DialogContent>
            {selectedSolicitud && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {getTipoTexto(selectedSolicitud.tipo)}: {' '}
                  {selectedSolicitud.tipo === TIPOS_SOLICITUD.NUEVA 
                    ? selectedSolicitud.herramienta_nueva_nombre 
                    : selectedSolicitud.herramientas?.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Zona: {selectedSolicitud.zona} | Solicitado por: {selectedSolicitud.usuarios?.email}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {selectedSolicitud.motivo}
                </Typography>

                <FormControl component="fieldset" sx={{ mt: 3, mb: 2 }}>
                  <FormLabel component="legend">Decisión</FormLabel>
                  <RadioGroup
                    value={adminResponse.accion}
                    onChange={(e) => setAdminResponse({ ...adminResponse, accion: e.target.value })}
                  >
                    <FormControlLabel value="APROBADA" control={<Radio />} label="Aprobar" />
                    <FormControlLabel value="RECHAZADA" control={<Radio />} label="Rechazar" />
                    <FormControlLabel value="PENDIENTE" control={<Radio />} label="Mantener pendiente" />
                  </RadioGroup>
                </FormControl>

                {adminResponse.accion === 'APROBADA' && (
                  <>
                    <FormControlLabel
                      control={
                        <input
                          type="checkbox"
                          checked={adminResponse.crear_herramienta}
                          onChange={(e) => setAdminResponse({ ...adminResponse, crear_herramienta: e.target.checked })}
                        />
                      }
                      label={
                        selectedSolicitud.tipo === TIPOS_SOLICITUD.NUEVA 
                          ? "Crear nueva herramienta en el sistema"
                          : selectedSolicitud.tipo === TIPOS_SOLICITUD.CAMBIO
                          ? "Crear herramienta de reemplazo"
                          : "Actualizar estado de la herramienta reparada"
                      }
                      sx={{ mb: 2 }}
                    />

                    {/* Selector de estado para reparaciones */}
                    {selectedSolicitud.tipo === TIPOS_SOLICITUD.REPARACION && (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Nuevo estado de la herramienta</InputLabel>
                        <Select
                          value={adminResponse.nuevo_estado_herramienta}
                          onChange={(e) => setAdminResponse({ ...adminResponse, nuevo_estado_herramienta: e.target.value })}
                          label="Nuevo estado de la herramienta"
                        >
                          <MenuItem value="BIEN">BIEN</MenuItem>
                          <MenuItem value="REGULAR">REGULAR</MenuItem>
                          <MenuItem value="MAL">MAL</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    {adminResponse.crear_herramienta && (selectedSolicitud.tipo === TIPOS_SOLICITUD.NUEVA || selectedSolicitud.tipo === TIPOS_SOLICITUD.CAMBIO) && (
                      <>
                        <TextField
                          fullWidth
                          label="Código de la herramienta"
                          value={adminResponse.nuevo_codigo}
                          onChange={(e) => setAdminResponse({ ...adminResponse, nuevo_codigo: e.target.value })}
                          sx={{ mb: 2 }}
                          placeholder="Ej: MART-001"
                          required
                        />
                        <TextField
                          fullWidth
                          label="Descripción adicional"
                          multiline
                          rows={2}
                          value={adminResponse.nueva_descripcion}
                          onChange={(e) => setAdminResponse({ ...adminResponse, nueva_descripcion: e.target.value })}
                          sx={{ mb: 2 }}
                          placeholder="Descripción opcional para la herramienta"
                        />
                      </>
                    )}
                  </>
                )}

                <TextField
                  fullWidth
                  label="Comentarios"
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
              color={
                adminResponse.accion === 'APROBADA' ? 'success' : 
                adminResponse.accion === 'RECHAZADA' ? 'error' : 'primary'
              }
              disabled={adminResponse.accion === 'PENDIENTE'}
            >
              {adminResponse.accion === 'APROBADA' ? 'Aprobar' : 
               adminResponse.accion === 'RECHAZADA' ? 'Rechazar' : 'Pendiente'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
