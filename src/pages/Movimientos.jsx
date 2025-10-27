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
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  LocalShipping as DeliveredIcon,
  Assignment as RequestIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtros, setFiltros] = useState({
    tipo: '',
    usuario: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  useEffect(() => {
    cargarMovimientos();
  }, [filtros]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar movimientos reales de la base de datos
      let query = supabase
        .from('movimientos')
        .select(`
          *,
          solicitudes:solicitud_id(
            tipo,
            herramienta_nueva_nombre,
            herramientas:herramienta_id(nombre)
          ),
          usuarios:usuario_id(email),
          admin:admin_id(email)
        `)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error al cargar movimientos:', fetchError);
        setError('Error al cargar el historial de movimientos');
        return;
      }

      setMovimientos(data || []);

    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      setError('Error al cargar el historial de movimientos');
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'SOLICITUD_CREADA':
        return 'info';
      case 'SOLICITUD_APROBADA':
        return 'success';
      case 'SOLICITUD_RECHAZADA':
        return 'error';
      case 'HERRAMIENTA_ENTREGADA':
        return 'primary';
      case 'HERRAMIENTA_REPARADA':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'SOLICITUD_CREADA':
        return <RequestIcon />;
      case 'SOLICITUD_APROBADA':
        return <ApprovedIcon />;
      case 'SOLICITUD_RECHAZADA':
        return <RejectedIcon />;
      case 'HERRAMIENTA_ENTREGADA':
        return <DeliveredIcon />;
      case 'HERRAMIENTA_REPARADA':
        return <ApprovedIcon />;
      default:
        return <TimelineIcon />;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedMovimientos = movimientos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <TimelineIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Historial de Movimientos
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select
                  value={filtros.tipo}
                  label="Tipo de Movimiento"
                  onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="SOLICITUD_CREADA">Solicitud Creada</MenuItem>
                  <MenuItem value="SOLICITUD_APROBADA">Solicitud Aprobada</MenuItem>
                  <MenuItem value="SOLICITUD_RECHAZADA">Solicitud Rechazada</MenuItem>
                  <MenuItem value="HERRAMIENTA_ENTREGADA">Herramienta Entregada</MenuItem>
                  <MenuItem value="HERRAMIENTA_REPARADA">Herramienta Reparada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Usuario"
                value={filtros.usuario}
                onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
                placeholder="Filtrar por email de usuario"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Fecha desde"
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla de movimientos */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Detalles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay movimientos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMovimientos.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTipoIcon(movimiento.tipo_movimiento)}
                        <Chip
                          label={movimiento.tipo_movimiento.replace('_', ' ')}
                          color={getTipoColor(movimiento.tipo_movimiento)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{movimiento.descripcion}</TableCell>
                    <TableCell>{movimiento.usuarios?.email || 'Usuario eliminado'}</TableCell>
                    <TableCell>
                      {new Date(movimiento.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={JSON.stringify(movimiento.detalles, null, 2)}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                        >
                          {movimiento.detalles ? 'Ver detalles' : 'Sin detalles'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={movimientos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TableContainer>
      </Container>
    </>
  );
}
