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
  Fab,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
  InputAdornment,
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
  Cancel as CancelIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/auth';

const ZONAS = {
  TALLER: 'TALLER',
  INSTALACIONES: 'INSTALACIONES',
  MANTENIMIENTO: 'MANTENIMIENTO'
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
  const [filtroActivo, setFiltroActivo] = useState('PENDIENTE');
  
  // Filtros adicionales
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: '',
    zona: '',
    prioridad: ''
  });
  
  // Formulario de nueva solicitud
  const [formData, setFormData] = useState({
    tipo_solicitud: TIPOS_SOLICITUD.NUEVA,
    zona: '',
    prioridad: 'NECESARIA',
    
    // Campos para nueva herramienta
    nombre_herramienta: '',
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
    nueva_descripcion: '',
    nuevo_estado_herramienta: 'BIEN'
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
      // Consulta directa para obtener herramientas en mal estado por zona
      const { data, error } = await supabase
        .from('herramientas')
        .select('id, codigo, nombre, estado, zona')
        .eq('zona', zona)
        .in('estado', ['MAL', 'REGULAR', 'FALTANTE', 'ROTA'])
        .order('codigo');

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

  const validarFormulario = () => {
    const { tipo_solicitud, zona, prioridad, nombre_herramienta, descripcion_uso, herramienta_id, falla } = formData;

    // Validaciones comunes
    if (!zona || !prioridad) {
      return 'Debe seleccionar zona y prioridad';
    }

    // Validaciones específicas por tipo
    if (tipo_solicitud === TIPOS_SOLICITUD.NUEVA) {
      if (!nombre_herramienta || !descripcion_uso) {
        return 'Complete nombre y descripción de uso para nueva herramienta';
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

  const handleCancelSolicitud = async () => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta solicitud? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('solicitudes')
        .update({ 
          estado: 'CANCELADA'
        })
        .eq('id', selectedSolicitud.id)
        .eq('solicitado_por', currentUser.id) // Solo permitir cancelar propias solicitudes
        .eq('estado', 'PENDIENTE'); // Solo cancelar si está pendiente

      if (updateError) throw updateError;

      setSuccess('Solicitud cancelada correctamente');
      handleCloseViewDialog();
      cargarDatos();
    } catch (err) {
      console.error('Error al cancelar solicitud:', err);
      setError('Error al cancelar la solicitud: ' + err.message);
    }
  };

  const procesarAprobacion = async () => {
    const { tipo } = selectedSolicitud;

    if (tipo === TIPOS_SOLICITUD.NUEVA && adminResponse.crear_herramienta) {
      // Crear nueva herramienta
      const herramientaData = {
        codigo: adminResponse.nuevo_codigo,
        nombre: selectedSolicitud.herramienta_nueva_nombre,
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
          puntuacion_estado: 1
        })
        .eq('id', selectedSolicitud.herramienta_id);
    } else if (tipo === TIPOS_SOLICITUD.REPARACION) {
      // Para reparaciones, actualizar el estado de la herramienta
      let nuevoPuntuacion;
      switch (adminResponse.nuevo_estado_herramienta) {
        case 'BIEN':
          nuevoPuntuacion = 10;
          break;
        case 'REGULAR':
          nuevoPuntuacion = 7;
          break;
        case 'MAL':
          nuevoPuntuacion = 4;
          break;
        default:
          nuevoPuntuacion = 10;
      }
      
      const { error: updateError } = await supabase
        .from('herramientas')
        .update({ 
          estado: adminResponse.nuevo_estado_herramienta,
          puntuacion_estado: nuevoPuntuacion
        })
        .eq('id', selectedSolicitud.herramienta_id);

      if (updateError) {
        console.error('Error al actualizar herramienta reparada:', updateError);
        throw new Error('Error al actualizar el estado de la herramienta');
      }
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
      case 'CANCELADA': return 'default';
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
  const solicitudesCanceladas = filteredSolicitudes.filter(s => s.estado === 'CANCELADA');

  const getSolicitudesFiltradas = () => {
    // Primero filtrar por estado (tarjetas)
    let solicitudesFiltradas;
    switch (filtroActivo) {
      case 'PENDIENTE': solicitudesFiltradas = solicitudesPendientes; break;
      case 'APROBADA': solicitudesFiltradas = solicitudesAprobadas; break;
      case 'RECHAZADA': solicitudesFiltradas = solicitudesRechazadas; break;
      case 'CANCELADA': solicitudesFiltradas = solicitudesCanceladas; break;
      default: solicitudesFiltradas = filteredSolicitudes;
    }

    // Aplicar filtros adicionales
    return solicitudesFiltradas.filter(solicitud => {
      // Filtro por búsqueda (nombre de herramienta o motivo)
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const nombre = solicitud.tipo === TIPOS_SOLICITUD.NUEVA 
          ? solicitud.herramienta_nueva_nombre?.toLowerCase() || ''
          : solicitud.herramientas?.nombre?.toLowerCase() || '';
        const motivo = solicitud.motivo?.toLowerCase() || '';
        const codigo = solicitud.herramientas?.codigo?.toLowerCase() || '';
        
        if (!nombre.includes(busqueda) && !motivo.includes(busqueda) && !codigo.includes(busqueda)) {
          return false;
        }
      }
      
      // Filtro por tipo
      if (filtros.tipo && solicitud.tipo !== filtros.tipo) {
        return false;
      }
      
      // Filtro por zona
      if (filtros.zona && solicitud.zona !== filtros.zona) {
        return false;
      }
      
      // Filtro por prioridad
      if (filtros.prioridad && solicitud.prioridad !== parseInt(filtros.prioridad)) {
        return false;
      }
      
      return true;
    });
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      tipo: '',
      zona: '',
      prioridad: ''
    });
  };

  const cambiarFiltroActivo = (nuevoFiltro) => {
    setFiltroActivo(nuevoFiltro);
    // Opcionalmente limpiar los filtros adicionales al cambiar de categoría
    // limpiarFiltros();
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

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6">Filtros</Typography>
            {(filtros.busqueda || filtros.tipo || filtros.zona || filtros.prioridad) && (
              <Button 
                size="small" 
                onClick={limpiarFiltros}
                sx={{ ml: 'auto' }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre o código..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4} md={2.67}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtros.tipo}
                  label="Tipo"
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value={TIPOS_SOLICITUD.NUEVA}>Nueva Herramienta</MenuItem>
                  <MenuItem value={TIPOS_SOLICITUD.REPARACION}>Reparación</MenuItem>
                  <MenuItem value={TIPOS_SOLICITUD.CAMBIO}>Cambio</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4} md={2.67}>
              <FormControl fullWidth size="small">
                <InputLabel>Zona</InputLabel>
                <Select
                  value={filtros.zona}
                  label="Zona"
                  onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value={ZONAS.TALLER}>Taller</MenuItem>
                  <MenuItem value={ZONAS.INSTALACIONES}>Instalaciones</MenuItem>
                  <MenuItem value={ZONAS.MANTENIMIENTO}>Mantenimiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4} md={2.67}>
              <FormControl fullWidth size="small">
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={filtros.prioridad}
                  label="Prioridad"
                  onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="3">Urgente</MenuItem>
                  <MenuItem value="2">Necesaria</MenuItem>
                  <MenuItem value="1">Útil</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Estadísticas - Cards clicables para filtrar */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filtroActivo === 'PENDIENTE' ? 2 : 0,
                borderColor: 'warning.main',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => cambiarFiltroActivo('PENDIENTE')}
            >
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
          <Grid item xs={12} sm={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filtroActivo === 'APROBADA' ? 2 : 0,
                borderColor: 'success.main',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => cambiarFiltroActivo('APROBADA')}
            >
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
          <Grid item xs={12} sm={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filtroActivo === 'RECHAZADA' ? 2 : 0,
                borderColor: 'error.main',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => cambiarFiltroActivo('RECHAZADA')}
            >
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
          <Grid item xs={12} sm={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: filtroActivo === 'CANCELADA' ? 2 : 0,
                borderColor: 'grey.500',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => cambiarFiltroActivo('CANCELADA')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CancelIcon color="disabled" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {solicitudesCanceladas.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Canceladas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Título de la sección filtrada */}
        <Paper sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6">
            {filtroActivo === 'PENDIENTE' && `Solicitudes Pendientes (${getSolicitudesFiltradas().length})`}
            {filtroActivo === 'APROBADA' && `Solicitudes Aprobadas (${getSolicitudesFiltradas().length})`}
            {filtroActivo === 'RECHAZADA' && `Solicitudes Rechazadas (${getSolicitudesFiltradas().length})`}
            {filtroActivo === 'CANCELADA' && `Solicitudes Canceladas (${getSolicitudesFiltradas().length})`}
          </Typography>
          {(filtros.busqueda || filtros.tipo || filtros.zona || filtros.prioridad) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {getSolicitudesFiltradas().length} de {' '}
              {filtroActivo === 'PENDIENTE' && solicitudesPendientes.length}
              {filtroActivo === 'APROBADA' && solicitudesAprobadas.length}
              {filtroActivo === 'RECHAZADA' && solicitudesRechazadas.length}
              {filtroActivo === 'CANCELADA' && solicitudesCanceladas.length}
              {' '}resultados con filtros aplicados
            </Typography>
          )}
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
              {getSolicitudesFiltradas().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay solicitudes en esta categoría
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getSolicitudesFiltradas().map((solicitud) => (
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

        {/* FAB para crear solicitud - Solo técnicos */}
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
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
            Nueva Solicitud
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseDialog}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
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
                  <TextField
                    fullWidth
                    required
                    label="Nombre"
                    value={formData.nombre_herramienta}
                    onChange={(e) => setFormData({ ...formData, nombre_herramienta: e.target.value })}
                  />
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
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{ 
                borderColor: 'grey.400',
                color: 'grey.700',
                '&:hover': {
                  borderColor: 'grey.600',
                  backgroundColor: 'grey.50'
                }
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitSolicitud} variant="contained">
              Crear Solicitud
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para ver detalles */}
        <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
            Detalles de Solicitud
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseViewDialog}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
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
            <Button 
              onClick={handleCloseViewDialog}
              variant="outlined"
              sx={{ 
                borderColor: 'grey.400',
                color: 'grey.700',
                '&:hover': {
                  borderColor: 'grey.600',
                  backgroundColor: 'grey.50'
                }
              }}
            >
              Cerrar
            </Button>
            {/* Botón para cancelar solicitud - Solo técnicos en sus propias solicitudes pendientes */}
            {currentUser?.role === 'TECNICO' && 
             selectedSolicitud?.estado === 'PENDIENTE' && 
             selectedSolicitud?.solicitado_por === currentUser?.id && (
              <Button
                onClick={handleCancelSolicitud}
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
              >
                Cancelar Solicitud
              </Button>
            )}
            {currentUser?.role === 'ADMIN' && selectedSolicitud?.estado === 'PENDIENTE' && (
              <>
                <Button 
                  onClick={() => {
                    handleCloseViewDialog();
                    handleOpenAdminDialog(selectedSolicitud, 'APROBADA');
                  }}
                  variant="contained"
                  color="success"
                >
                  Terminar solicitud
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Dialog para respuesta admin */}
        <Dialog open={openAdminDialog} onClose={handleCloseAdminDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
            Procesar Solicitud
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseAdminDialog}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
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
                    {selectedSolicitud.tipo === TIPOS_SOLICITUD.REPARACION && (
                      <>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Nuevo estado de la herramienta</InputLabel>
                          <Select
                            value={adminResponse.nuevo_estado_herramienta || 'BIEN'}
                            label="Nuevo estado de la herramienta"
                            onChange={(e) => setAdminResponse({ ...adminResponse, nuevo_estado_herramienta: e.target.value })}
                          >
                            <MenuItem value="BIEN">BIEN</MenuItem>
                            <MenuItem value="REGULAR">REGULAR</MenuItem>
                            <MenuItem value="MAL">MAL</MenuItem>
                          </Select>
                        </FormControl>
                      </>
                    )}
                    
                    {(selectedSolicitud.tipo === TIPOS_SOLICITUD.NUEVA || selectedSolicitud.tipo === TIPOS_SOLICITUD.CAMBIO) && (
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
                            : "Crear herramienta de reemplazo"
                        }
                        sx={{ mb: 2 }}
                      />
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
            <Button 
              onClick={handleCloseAdminDialog}
              variant="outlined"
              sx={{ 
                borderColor: 'grey.400',
                color: 'grey.700',
                '&:hover': {
                  borderColor: 'grey.600',
                  backgroundColor: 'grey.50'
                }
              }}
            >
              Cancelar
            </Button>
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
