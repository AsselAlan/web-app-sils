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
  Autocomplete,
  Tab,
  Tabs,
  Fab,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
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
  Construction as ToolIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/auth';

const ZONAS = {
  TALLER: 'TALLER',
  INSTALACIONES: 'INSTALACIONES',
  MANTENIMIENTO: 'MANTENIMIENTO'
};

const TIPOS_HERRAMIENTA = {
  DE_MANO: 'DE_MANO',
  INSUMO: 'INSUMO',
  MAQUINA: 'MAQUINA'
};

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

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [herramientasMalEstado, setHerramientasMalEstado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Formulario de nueva solicitud
  const [formData, setFormData] = useState({
    tipo_solicitud: TIPOS_SOLICITUD.NUEVA,
    zona: '',
    prioridad: 'NECESARIA',
    
    // Campos para nueva herramienta
    nombre_herramienta: '',
    tipo_herramienta: '',
    descripcion_uso: '',
    marca: '',
    
    // Campos para reparación/cambio
    herramienta_id: null,
    falla: '',
    
    comentario_adicional: ''
  });

  // Respuesta del admin
  const [adminResponse, setAdminResponse] = useState({
    accion: 'PENDIENTE', // APROBADA, RECHAZADA, PENDIENTE
    respuesta: '',
    crear_herramienta: false,
    nuevo_codigo: '',
    nueva_descripcion: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar herramientas cuando cambia la zona
  useEffect(() => {
    if (formData.zona && (formData.tipo_solicitud === TIPOS_SOLICITUD.REPARACION || formData.tipo_solicitud === TIPOS_SOLICITUD.CAMBIO)) {
      cargarHerramientasPorZona(formData.zona);
    }
  }, [formData.zona, formData.tipo_solicitud]);

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

  const cargarHerramientasPorZona = async (zona) => {
    try {
      // Usar la función SQL creada para obtener herramientas en mal estado por zona
      const { data, error } = await supabase
        .rpc('get_herramientas_mal_estado_por_zona', { zona_param: zona });

      if (error) {
        console.error('Error al cargar herramientas por zona:', error);
        setHerramientasMalEstado([]);
        return;
      }
      
      setHerramientasMalEstado(data || []);
    } catch (err) {
      console.error('Error al cargar herramientas por zona:', err);
      setHerramientasMalEstado([]);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      tipo_solicitud: TIPOS_SOLICITUD.NUEVA,
      zona: '',
      prioridad: 'NECESARIA',
      nombre_herramienta: '',
      tipo_herramienta: '',
      descripcion_uso: '',
      marca: '',
      herramienta_id: null,
      falla: '',
      comentario_adicional: ''
    });
    setHerramientasMalEstado([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleOpenAdminDialog = (solicitud, accionPredeterminada = 'PENDIENTE') => {
    setSelectedSolicitud(solicitud);
    setAdminResponse({
      accion: accionPredeterminada,
      respuesta: '',
      crear_herramienta: false,
      nuevo_codigo: '',
      nueva_descripcion: ''
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

  const validarFormulario = () => {
    const { tipo_solicitud, zona, prioridad, nombre_herramienta, tipo_herramienta, descripcion_uso, herramienta_id, falla } = formData;

    // Validaciones comunes
    if (!zona || !prioridad) {
      return 'Debe seleccionar zona y prioridad';
    }

    // Validaciones específicas por tipo
    if (tipo_solicitud === TIPOS_SOLICITUD.NUEVA) {
      if (!nombre_herramienta || !tipo_herramienta || !descripcion_uso) {
        return 'Complete nombre, tipo y descripción de uso para nueva herramienta';
      }
    } else if (tipo_solicitud === TIPOS_SOLICITUD.REPARACION || tipo_solicitud === TIPOS_SOLICITUD.CAMBIO) {
      if (!herramienta_id) {
        return 'Seleccione una herramienta';
      }
      if (!falla) {
        return 'Describa la falla encontrada';
      }
    }

    return null;
  };

  const handleSubmitSolicitud = async () => {
    try {
      setError('');
      setSuccess('');

      if (!currentUser) {
        setError('Usuario no identificado');
        return;
      }

      const errorValidacion = validarFormulario();
      if (errorValidacion) {
        setError(errorValidacion);
        return;
      }

      const solicitudData = {
        tipo: formData.tipo_solicitud,
        zona: formData.zona,
        prioridad: PRIORIDADES[formData.prioridad].valor,
        solicitado_por: currentUser.id,
        estado: 'PENDIENTE'
      };

      // Campos específicos según tipo de solicitud
      if (formData.tipo_solicitud === TIPOS_SOLICITUD.NUEVA) {
        solicitudData.herramienta_nueva_nombre = formData.nombre_herramienta;
        solicitudData.herramienta_nueva_tipo = formData.tipo_herramienta;
        solicitudData.descripcion_uso = formData.descripcion_uso;
        solicitudData.marca = formData.marca || null;
        solicitudData.motivo = `Nueva herramienta: ${formData.nombre_herramienta}`;
      } else {
        solicitudData.herramienta_id = formData.herramienta_id;
        solicitudData.falla = formData.falla;
        solicitudData.motivo = `${formData.tipo_solicitud}: ${formData.falla}`;
      }

      // Comentario adicional
      if (formData.comentario_adicional) {
        solicitudData.comentario_adicional = formData.comentario_adicional;
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
        puntuacion_estado: 10,
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
        puntuacion_estado: 10,
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
          puntuacion_estado: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSolicitud.herramienta_id);
    }
    // Para reparaciones, el estado se actualiza automáticamente por el trigger
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

  // Filtrar solicitudes según el rol del usuario
  const filteredSolicitudes = solicitudes.filter(s => {
    if (currentUser?.role === 'ADMIN') return true;
    return s.solicitado_por === currentUser?.id;
  });

  // Separar por estado
  const solicitudesPendientes = filteredSolicitudes.filter(s => s.estado === 'PENDIENTE');
  const solicitudesAprobadas = filteredSolicitudes.filter(s => s.estado === 'APROBADA');
  const solicitudesRechazadas = filteredSolicitudes.filter(s => s.estado === 'RECHAZADA');

  const getSolicitudesByTab = () => {
    switch (tabValue) {
      case 0: return solicitudesPendientes;
      case 1: return solicitudesAprobadas;
      case 2: return solicitudesRechazadas;
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
              </TableRow>
            </TableHead>
            <TableBody>
              {getSolicitudesByTab().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay solicitudes en esta categoría
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getSolicitudesByTab().map((solicitud) => (
                  <TableRow 
                    key={solicitud.id}
                    onClick={() => handleOpenViewDialog(solicitud)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
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
                    <TableCell>
                      <Typography variant="body2">
                        {solicitud.usuarios?.email}
                      </Typography>
                    </TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* FAB para crear solicitud */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleOpenDialog}
        >
          <AddIcon />
        </Fab>

        {/* Dialog para crear solicitud */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Nueva Solicitud</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Tipo de solicitud */}
              <FormControl component="fieldset">
                <FormLabel component="legend">Tipo de Solicitud</FormLabel>
                <RadioGroup
                  row
                  value={formData.tipo_solicitud}
                  onChange={(e) => setFormData({ ...formData, tipo_solicitud: e.target.value, herramienta_id: null })}
                >
                  <FormControlLabel value={TIPOS_SOLICITUD.NUEVA} control={<Radio />} label="Nueva Herramienta" />
                  <FormControlLabel value={TIPOS_SOLICITUD.REPARACION} control={<Radio />} label="Reparación" />
                  <FormControlLabel value={TIPOS_SOLICITUD.CAMBIO} control={<Radio />} label="Cambio" />
                </RadioGroup>
              </FormControl>

              {/* Campos comunes */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Zona</InputLabel>
                    <Select
                      value={formData.zona}
                      label="Zona"
                      onChange={(e) => setFormData({ ...formData, zona: e.target.value, herramienta_id: null })}
                    >
                      <MenuItem value={ZONAS.TALLER}>Taller</MenuItem>
                      <MenuItem value={ZONAS.INSTALACIONES}>Instalaciones</MenuItem>
                      <MenuItem value={ZONAS.MANTENIMIENTO}>Mantenimiento</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
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
                </Grid>
              </Grid>

              {/* Campos específicos para nueva herramienta */}
              {formData.tipo_solicitud === TIPOS_SOLICITUD.NUEVA && (
                <>
                  <Divider>Nueva Herramienta</Divider>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Nombre"
                        value={formData.nombre_herramienta}
                        onChange={(e) => setFormData({ ...formData, nombre_herramienta: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={formData.tipo_herramienta}
                          label="Tipo"
                          onChange={(e) => setFormData({ ...formData, tipo_herramienta: e.target.value })}
                        >
                          <MenuItem value={TIPOS_HERRAMIENTA.DE_MANO}>De Mano</MenuItem>
                          <MenuItem value={TIPOS_HERRAMIENTA.INSUMO}>Insumo</MenuItem>
                          <MenuItem value={TIPOS_HERRAMIENTA.MAQUINA}>Máquina</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  <TextField
                    fullWidth
                    required
                    label="Descripción de Uso"
                    multiline
                    rows={3}
                    value={formData.descripcion_uso}
                    onChange={(e) => setFormData({ ...formData, descripcion_uso: e.target.value })}
                    placeholder="Describa para qué necesita esta herramienta y cómo la va a usar"
                  />
                  <TextField
                    fullWidth
                    label="Marca (opcional)"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </>
              )}

              {/* Campos específicos para reparación/cambio */}
              {(formData.tipo_solicitud === TIPOS_SOLICITUD.REPARACION || formData.tipo_solicitud === TIPOS_SOLICITUD.CAMBIO) && (
                <>
                  <Divider>{getTipoTexto(formData.tipo_solicitud)}</Divider>
                  {formData.zona ? (
                    <Autocomplete
                      options={herramientasMalEstado}
                      getOptionLabel={(option) => `${option.codigo} - ${option.nombre} (${option.estado})`}
                      value={herramientasMalEstado.find(h => h.id === formData.herramienta_id) || null}
                      onChange={(e, newValue) => setFormData({ ...formData, herramienta_id: newValue?.id || null })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Seleccionar Herramienta"
                          required
                          helperText="Solo se muestran herramientas en mal estado de la zona seleccionada"
                        />
                      )}
                      noOptionsText="No hay herramientas en mal estado en esta zona"
                    />
                  ) : (
                    <Alert severity="info">
                      Primero seleccione una zona para ver las herramientas disponibles
                    </Alert>
                  )}
                  <TextField
                    fullWidth
                    required
                    label="Falla"
                    multiline
                    rows={3}
                    value={formData.falla}
                    onChange={(e) => setFormData({ ...formData, falla: e.target.value })}
                    placeholder={formData.tipo_solicitud === TIPOS_SOLICITUD.REPARACION 
                      ? "Describa la falla y la posible reparación"
                      : "Describa la falla que requiere el cambio de la herramienta"
                    }
                  />
                </>
              )}

              {/* Comentario adicional */}
              <TextField
                fullWidth
                label="Comentario Adicional (opcional)"
                multiline
                rows={2}
                value={formData.comentario_adicional}
                onChange={(e) => setFormData({ ...formData, comentario_adicional: e.target.value })}
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
                    <Typography variant="subtitle2" color="text.secondary">Solicitado por:</Typography>
                    <Typography>{selectedSolicitud.usuarios?.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Fecha:</Typography>
                    <Typography>{new Date(selectedSolicitud.created_at).toLocaleDateString('es-ES')}</Typography>
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
            {currentUser?.role === 'ADMIN' && selectedSolicitud?.estado === 'PENDIENTE' && (
              <>
                {/* <Button 
                  onClick={() => {
                    handleCloseViewDialog();
                    handleOpenAdminDialog(selectedSolicitud, 'PENDIENTE');
                  }}
                  variant="outlined"
                  color="warning"
                >
                  Mantener
                </Button> */}
                  {/* <Button 
                    onClick={() => {
                      handleCloseViewDialog();
                      handleOpenAdminDialog(selectedSolicitud, 'RECHAZADA');
                    }}
                    variant="contained"
                    color="error"
                  >
                    Rechazar
                  </Button> */}
                <Button 
                  onClick={() => {
                    handleCloseViewDialog();
                    handleOpenAdminDialog(selectedSolicitud, 'APROBADA');
                  }}
                  variant="contained"
                  color="success"
                >
                  Termianar solicitud
                </Button>
              </>
            )}
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
                          : "Marcar herramienta como reparada"
                      }
                      sx={{ mb: 2 }}
                    />

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
