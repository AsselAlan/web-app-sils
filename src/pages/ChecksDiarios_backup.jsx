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
  Card,
  CardContent,
  Grid,
  Tooltip,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Assignment as CheckIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  CheckBox as OkIcon,
  Close as MissingIcon,
  Build as DamagedIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import ContadorProximoCheck from '../components/ContadorProximoCheck';
import AdminChecksView from '../components/AdminChecksView';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/auth';
import { ZONAS, LABELS } from '../types/constants';

export default function ChecksDiarios() {
  const [checks, setChecks] = useState([]);
  const [herramientasCheck, setHerramientasCheck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openOmitirDialog, setOpenOmitirDialog] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkEnProceso, setCheckEnProceso] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkDetalle, setCheckDetalle] = useState({});
  const [motivoOmision, setMotivoOmision] = useState('');

  useEffect(() => {
    loadUserProfile();
    cargarChecks();
  }, []);

  const loadUserProfile = async () => {
    const profile = await getCurrentUserProfile();
    setCurrentUser(profile);
  };

  const cargarChecks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checks_diarios')
        .select(`
          *,
          creado_por:usuarios!checks_diarios_creado_por_fkey(email),
          iniciado_por:usuarios!checks_diarios_iniciado_por_fkey(email),
          completado_por:usuarios!checks_diarios_completado_por_fkey(email)
        `)
        .order('fecha', { ascending: false })
        .limit(30);

      if (error) throw error;
      setChecks(data || []);
    } catch (err) {
      console.error('Error al cargar checks:', err);
      setError('Error al cargar los checks diarios');
    } finally {
      setLoading(false);
    }
  };

  const verificarPuedeCrearCheck = async (zona) => {
    try {
      const { data, error } = await supabase
        .rpc('puede_crear_check_hoy', { zona_param: zona });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al verificar checks:', err);
      return false;
    }
  };

  const reiniciarCheckHoy = async (zona) => {
    try {
      const { data, error } = await supabase
        .rpc('reiniciar_check_hoy', { 
          zona_param: zona,
          motivo_reinicio: 'Check reiniciado para verificación adicional'
        });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al reiniciar check:', err);
      return null;
    }
  };

  const resetearCheckEnProceso = async (zona) => {
    try {
      setError('');
      
      const { data, error } = await supabase
        .rpc('resetear_check_en_proceso', { zona_param: zona });

      if (error) throw error;
      
      if (data) {
        setSuccess(`Check de ${LABELS.ZONAS[zona]} reseteado correctamente`);
        cargarChecks();
      } else {
        setError('No hay checks en proceso para resetear en esta zona');
      }
    } catch (err) {
      console.error('Error al resetear check:', err);
      setError('Error al resetear el check: ' + err.message);
    }
  };

  const puedeRepetirCheckHoy = async (zona) => {
    try {
      const { data, error } = await supabase
        .rpc('puede_repetir_check_hoy', { zona_param: zona });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al verificar repetición:', err);
      return false;
    }
  };

  const cargarHerramientasParaCheck = async (zona) => {
    try {
      console.log('🔧 Cargando herramientas para zona:', zona);
      
      // Verificar que la zona sea válida antes de hacer la llamada
      const zonasValidas = Object.values(ZONAS);
      if (!zonasValidas.includes(zona)) {
        console.error('❌ Zona inválida:', zona, 'Zonas válidas:', zonasValidas);
        throw new Error(`Zona inválida: ${zona}. Zonas válidas: ${zonasValidas.join(', ')}`);
      }

      const { data, error } = await supabase
        .rpc('obtener_herramientas_para_check', { zona_param: zona });

      if (error) {
        console.error('❌ Error en función RPC:', error);
        throw error;
      }
      
      console.log('✅ Herramientas cargadas:', data?.length || 0, 'herramientas');
      return data || [];
    } catch (err) {
      console.error('💥 Error al cargar herramientas:', err);
      setError(`Error al cargar herramientas: ${err.message}`);
      return [];
    }
  };

  const iniciarCheck = async (check) => {
    try {
      setError('');
      
      // Verificar si se puede iniciar el check
      const puedeCrear = await verificarPuedeCrearCheck(check.zona);
      if (!puedeCrear) {
        setError('El check de hoy ya fue completado en esta zona. Use "Repetir Check" si necesita una verificación adicional.');
        return;
      }

      // Cargar herramientas para el check
      const herramientas = await cargarHerramientasParaCheck(check.zona);
      if (herramientas.length === 0) {
        setError('No hay herramientas en esta zona para verificar.');
        return;
      }

      // Actualizar el check a EN_PROCESO
      const { error: updateError } = await supabase
        .from('checks_diarios')
        .update({
          estado: 'EN_PROCESO',
          iniciado_por: currentUser.id,
          fecha_inicio: new Date().toISOString()
        })
        .eq('id', check.id);

      if (updateError) throw updateError;

      // Configurar el check en proceso
      setCheckEnProceso(check);
      setHerramientasCheck(herramientas);
      setCurrentStep(0);
      setCheckDetalle({});
      setOpenDialog(true);
      
      cargarChecks();
    } catch (err) {
      console.error('Error al iniciar check:', err);
      setError('Error al iniciar el check: ' + err.message);
    }
  };

  const repetirCheck = async (zona) => {
    try {
      setError('');
      
      // Reiniciar el check del día
      const checkId = await reiniciarCheckHoy(zona);
      if (!checkId) {
        setError('Error al preparar el check para repetir.');
        return;
      }

      // Buscar el check actualizado
      const { data: checkData, error: checkError } = await supabase
        .from('checks_diarios')
        .select('*')
        .eq('id', checkId)
        .single();

      if (checkError) throw checkError;

      // Cargar herramientas y iniciar el check
      const herramientas = await cargarHerramientasParaCheck(zona);
      if (herramientas.length === 0) {
        setError('No hay herramientas en esta zona para verificar.');
        return;
      }

      // Actualizar el check a EN_PROCESO
      const { error: updateError } = await supabase
        .from('checks_diarios')
        .update({
          estado: 'EN_PROCESO',
          iniciado_por: currentUser.id,
          fecha_inicio: new Date().toISOString()
        })
        .eq('id', checkId);

      if (updateError) throw updateError;

      // Configurar el check en proceso
      setCheckEnProceso(checkData);
      setHerramientasCheck(herramientas);
      setCurrentStep(0);
      setCheckDetalle({});
      setOpenDialog(true);
      
      setSuccess('Check preparado para repetir verificación');
      cargarChecks();
    } catch (err) {
      console.error('Error al repetir check:', err);
      setError('Error al repetir el check: ' + err.message);
    }
  };

  const guardarDetalleHerramienta = (herramientaId, estado, observaciones = '') => {
    setCheckDetalle(prev => ({
      ...prev,
      [herramientaId]: {
        estado_encontrado: estado,
        observaciones: observaciones
      }
    }));
  };

  const siguienteHerramienta = () => {
    if (currentStep < herramientasCheck.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const anteriorHerramienta = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completarCheck = async () => {
    try {
      setError('');

      // Verificar que todas las herramientas hayan sido verificadas
      const herramientasSinVerificar = herramientasCheck.filter(
        h => !checkDetalle[h.id]
      );

      if (herramientasSinVerificar.length > 0) {
        setError(`Faltan verificar ${herramientasSinVerificar.length} herramientas`);
        return;
      }

      // Guardar todos los detalles del check
      const detalles = herramientasCheck.map(herramienta => ({
        check_diario_id: checkEnProceso.id,
        herramienta_id: herramienta.id,
        estado_encontrado: checkDetalle[herramienta.id].estado_encontrado,
        observaciones: checkDetalle[herramienta.id].observaciones || null,
        verificado_por: currentUser.id
      }));

      const { error: detalleError } = await supabase
        .from('check_detalle')
        .insert(detalles);

      if (detalleError) throw detalleError;

      // Actualizar el check como completado
      const { error: updateError } = await supabase
        .from('checks_diarios')
        .update({
          estado: 'COMPLETADO',
          completado_por: currentUser.id,
          fecha_completado: new Date().toISOString()
        })
        .eq('id', checkEnProceso.id);

      if (updateError) throw updateError;

      setSuccess('Check diario completado exitosamente');
      handleCloseDialog();
      cargarChecks();
    } catch (err) {
      console.error('Error al completar check:', err);
      setError('Error al completar el check: ' + err.message);
    }
  };

  const omitirCheck = async () => {
    try {
      setError('');

      if (!motivoOmision.trim()) {
        setError('Debe especificar el motivo de la omisión');
        return;
      }

      const { error } = await supabase
        .from('checks_diarios')
        .update({
          estado: 'OMITIDO',
          motivo_omision: motivoOmision,
          completado_por: currentUser.id,
          fecha_completado: new Date().toISOString()
        })
        .eq('id', selectedCheck.id);

      if (error) throw error;

      setSuccess('Check marcado como omitido');
      setOpenOmitirDialog(false);
      setMotivoOmision('');
      cargarChecks();
    } catch (err) {
      console.error('Error al omitir check:', err);
      setError('Error al omitir el check: ' + err.message);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCheckEnProceso(null);
    setHerramientasCheck([]);
    setCurrentStep(0);
    setCheckDetalle({});
    setError('');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'EN_PROCESO': return 'info';
      case 'COMPLETADO': return 'success';
      case 'OMITIDO': return 'error';
      default: return 'default';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return <PendingIcon />;
      case 'EN_PROCESO': return <CheckIcon />;
      case 'COMPLETADO': return <CompleteIcon />;
      case 'OMITIDO': return <CancelIcon />;
      default: return <CheckIcon />;
    }
  };

  const herramientaActual = herramientasCheck[currentStep];
  const progreso = herramientasCheck.length > 0 ? ((currentStep + 1) / herramientasCheck.length) * 100 : 0;

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
              Control Diario de Herramientas
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Verificación diaria por zona de trabajo
            </Typography>
          </Box>
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

        {/* Contador de próximo check */}
        <ContadorProximoCheck />

        {/* Vista de administrador */}
        {currentUser?.rol === 'ADMIN' ? (
          <AdminChecksView 
            checks={checks}
            onResetCheck={resetearCheckEnProceso}
            loading={loading}
            currentUser={currentUser}
          />
        ) : (
          <>
            {/* Estadísticas rápidas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {Object.values(ZONAS).map(zona => {
                const checkHoy = checks.find(c => 
                  c.fecha === new Date().toISOString().split('T')[0] && c.zona === zona
                );
                
                return (
                  <Grid item xs={12} sm={4} key={zona}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getEstadoIcon(checkHoy?.estado || 'PENDIENTE')}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div">
                              {LABELS.ZONAS[zona]}
                            </Typography>
                            <Chip
                              label={checkHoy?.estado || 'SIN PROGRAMAR'}
                              color={getEstadoColor(checkHoy?.estado || 'PENDIENTE')}
                              size="small"
                            />
                          </Box>
                          {checkHoy?.estado === 'PENDIENTE' && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<StartIcon />}
                              onClick={() => iniciarCheck(checkHoy)}
                            >
                              Iniciar
                            </Button>
                          )}
                          {checkHoy?.estado === 'EN_PROCESO' && (
                            <Button
                              variant="outlined"
                              size="small"
                              color="warning"
                              onClick={() => resetearCheckEnProceso(zona)}
                            >
                              Resetear
                            </Button>
                          )}
                          {checkHoy?.estado === 'COMPLETADO' && (
                            <Button
                              variant="outlined"
                              size="small"
                              color="info"
                              onClick={() => repetirCheck(zona)}
                              sx={{ ml: 1 }}
                            >
                              Repetir Check
                            </Button>
                          )}
                          {checkHoy?.estado === 'PENDIENTE' && (
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedCheck(checkHoy);
                                setOpenOmitirDialog(true);
                              }}
                            >
                              Omitir
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Tabla de historial de checks */}
            <Paper>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Historial de Checks Diarios
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Zona</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Iniciado por</TableCell>
                      <TableCell>Completado por</TableCell>
                      <TableCell>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {checks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No hay checks registrados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      checks.map((check) => (
                        <TableRow key={check.id}>
                          <TableCell>
                            {new Date(check.fecha).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            <Chip label={LABELS.ZONAS[check.zona]} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={check.estado}
                              color={getEstadoColor(check.estado)}
                              size="small"
                              icon={getEstadoIcon(check.estado)}
                            />
                          </TableCell>
                          <TableCell>
                            {check.iniciado_por?.email || '-'}
                          </TableCell>
                          <TableCell>
                            {check.completado_por?.email || '-'}
                          </TableCell>
                          <TableCell>
                            {check.motivo_omision || check.observaciones || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Dialog para realizar el check */}
            <Dialog 
              open={openDialog} 
              onClose={handleCloseDialog} 
              maxWidth="md" 
              fullWidth
            >
              <DialogTitle>
                Check Diario - {checkEnProceso && LABELS.ZONAS[checkEnProceso.zona]}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progreso: {currentStep + 1} de {herramientasCheck.length} herramientas ({Math.round(progreso)}%)
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                {herramientaActual && (
                  <Box sx={{ pt: 2 }}>
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {herramientaActual.codigo} - {herramientaActual.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Estado actual: {herramientaActual.estado}
                        </Typography>
                        {herramientaActual.ubicacion && (
                          <Typography variant="body2" color="text.secondary">
                            Ubicación: {herramientaActual.ubicacion}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>

                    <FormControl component="fieldset">
                      <FormLabel component="legend">Estado encontrado:</FormLabel>
                      <RadioGroup
                        value={checkDetalle[herramientaActual.id]?.estado_encontrado || ''}
                        onChange={(e) => guardarDetalleHerramienta(herramientaActual.id, e.target.value)}
                      >
                        <FormControlLabel
                          value="OK"
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <OkIcon color="success" />
                              OK - Herramienta presente y en buen estado
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="FALTANTE"
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MissingIcon color="error" />
                              FALTANTE - Herramienta no encontrada
                            </Box>
                          }
                        />
                        <FormControlLabel
                          value="DAÑADO"
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DamagedIcon color="warning" />
                              DAÑADO - Herramienta presente pero dañada
                            </Box>
                          }
                        />
                      </RadioGroup>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Observaciones (opcional)"
                      multiline
                      rows={2}
                      value={checkDetalle[herramientaActual.id]?.observaciones || ''}
                      onChange={(e) => {
                        const estadoActual = checkDetalle[herramientaActual.id]?.estado_encontrado || '';
                        guardarDetalleHerramienta(herramientaActual.id, estadoActual, e.target.value);
                      }}
                      sx={{ mt: 2 }}
                      placeholder="Detalles adicionales sobre el estado de la herramienta"
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Cancelar</Button>
                <Button 
                  onClick={anteriorHerramienta} 
                  disabled={currentStep === 0}
                >
                  Anterior
                </Button>
                {currentStep < herramientasCheck.length - 1 ? (
                  <Button 
                    onClick={siguienteHerramienta}
                    disabled={!checkDetalle[herramientaActual?.id]?.estado_encontrado}
                    variant="contained"
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button 
                    onClick={completarCheck}
                    disabled={!checkDetalle[herramientaActual?.id]?.estado_encontrado}
                    variant="contained"
                    color="success"
                  >
                    Completar Check
                  </Button>
                )}
              </DialogActions>
            </Dialog>

            {/* Dialog para omitir check */}
            <Dialog open={openOmitirDialog} onClose={() => setOpenOmitirDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Omitir Check Diario</DialogTitle>
              <DialogContent>
                <Typography variant="body1" gutterBottom>
                  ¿Por qué se omite el check del día de hoy en {selectedCheck && LABELS.ZONAS[selectedCheck.zona]}?
                </Typography>
                <TextField
                  fullWidth
                  label="Motivo de omisión"
                  multiline
                  rows={3}
                  value={motivoOmision}
                  onChange={(e) => setMotivoOmision(e.target.value)}
                  sx={{ mt: 2 }}
                  placeholder="Ej: Día feriado, no se trabajó en la zona, zona fuera de servicio, etc."
                  required
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenOmitirDialog(false)}>Cancelar</Button>
                <Button onClick={omitirCheck} variant="contained" color="error">
                  Omitir Check
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Container>
    </>
  );
}
