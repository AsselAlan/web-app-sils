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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import {
  History as HistoryIcon,
  Build as BuildIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

export default function Historial() {
  const [historial, setHistorial] = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    herramienta_id: '',
    tipo_cambio: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  useEffect(() => {
    cargarHerramientas();
    cargarHistorial();
  }, []);

  const cargarHerramientas = async () => {
    try {
      const { data, error } = await supabase
        .from('herramientas')
        .select('id, nombre, codigo')
        .order('nombre');

      if (error) throw error;
      setHerramientas(data || []);
    } catch (err) {
      console.error('Error al cargar herramientas:', err);
    }
  };

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('historial_herramienta')
        .select(`
          *,
          herramienta:herramientas(nombre, codigo, tipo),
          usuario:usuarios(email)
        `)
        .order('fecha_cambio', { ascending: false });

      // Aplicar filtros
      if (filtros.herramienta_id) {
        query = query.eq('herramienta_id', filtros.herramienta_id);
      }
      if (filtros.tipo_cambio) {
        query = query.eq('tipo_cambio', filtros.tipo_cambio);
      }
      if (filtros.fecha_desde) {
        query = query.gte('fecha_cambio', filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        query = query.lte('fecha_cambio', filtros.fecha_hasta);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistorial(data || []);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setError('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [filtros]);

  const getTipoCambioIcon = (tipo) => {
    switch (tipo) {
      case 'REPOSICION':
        return <AddIcon />;
      case 'REPARACION':
        return <BuildIcon />;
      case 'AJUSTE':
        return <EditIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const getTipoCambioColor = (tipo) => {
    switch (tipo) {
      case 'REPOSICION':
        return 'success';
      case 'REPARACION':
        return 'warning';
      case 'AJUSTE':
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
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Historial de Cambios
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtros
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Herramienta</InputLabel>
              <Select
                value={filtros.herramienta_id}
                label="Herramienta"
                onChange={(e) => setFiltros({ ...filtros, herramienta_id: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {herramientas.map((h) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.codigo} - {h.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Tipo de Cambio</InputLabel>
              <Select
                value={filtros.tipo_cambio}
                label="Tipo de Cambio"
                onChange={(e) => setFiltros({ ...filtros, tipo_cambio: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="REPOSICION">Reposición</MenuItem>
                <MenuItem value="REPARACION">Reparación</MenuItem>
                <MenuItem value="AJUSTE">Ajuste</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Desde"
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Hasta"
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </Paper>

        {/* Tabla de historial */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Herramienta</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Tipo de Cambio</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay registros en el historial
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                historial.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.fecha_cambio).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {item.herramienta?.codigo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.herramienta?.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.herramienta?.tipo}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTipoCambioIcon(item.tipo_cambio)}
                        label={item.tipo_cambio}
                        color={getTipoCambioColor(item.tipo_cambio)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell align="center">
                      {item.cantidad_anterior} → {item.cantidad_nueva}
                    </TableCell>
                    <TableCell>{item.usuario?.email || 'Sistema'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
}
