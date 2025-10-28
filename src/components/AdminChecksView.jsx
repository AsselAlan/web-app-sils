import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Assignment as CheckIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LABELS } from '../types/constants';

export default function AdminChecksView({ checks, onResetCheck, loading, currentUser }) {
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

  // Obtener checks de hoy
  const checksHoy = checks.filter(c => 
    c.fecha === new Date().toISOString().split('T')[0]
  );

  // Contar estados
  const estadisticas = {
    completados: checksHoy.filter(c => c.estado === 'COMPLETADO').length,
    pendientes: checksHoy.filter(c => c.estado === 'PENDIENTE').length,
    enProceso: checksHoy.filter(c => c.estado === 'EN_PROCESO').length,
    omitidos: checksHoy.filter(c => c.estado === 'OMITIDO').length,
  };

  return (
    <Box>
      {/* Alerta informativa para admins */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Vista de Administrador
        </Typography>
        Los administradores pueden supervisar los checks pero no realizarlos directamente. 
        Pueden resetear checks que quedaron en proceso.
      </Alert>

      {/* Estadísticas de hoy */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CompleteIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                {estadisticas.completados}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PendingIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" color="warning.main">
                {estadisticas.pendientes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" color="info.main">
                {estadisticas.enProceso}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En Proceso
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CancelIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" color="error.main">
                {estadisticas.omitidos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Omitidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estado por zona - HOY */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Estado de Checks - {new Date().toLocaleDateString('es-ES')}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zona</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Iniciado por</TableCell>
                <TableCell>Completado por</TableCell>
                <TableCell>Hora Inicio</TableCell>
                <TableCell>Hora Completado</TableCell>
                <TableCell>Acciones Admin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(['INSTALACIONES', 'MANTENIMIENTO', 'TALLER']).map(zona => {
                const checkZona = checksHoy.find(c => c.zona === zona);
                
                return (
                  <TableRow key={zona}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {LABELS.ZONAS[zona]}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={checkZona?.estado || 'SIN PROGRAMAR'}
                        color={getEstadoColor(checkZona?.estado || 'PENDIENTE')}
                        icon={getEstadoIcon(checkZona?.estado || 'PENDIENTE')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {checkZona?.iniciado_por?.email || '-'}
                    </TableCell>
                    <TableCell>
                      {checkZona?.completado_por?.email || '-'}
                    </TableCell>
                    <TableCell>
                      {checkZona?.fecha_inicio ? 
                        new Date(checkZona.fecha_inicio).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {checkZona?.fecha_completado ? 
                        new Date(checkZona.fecha_completado).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {checkZona?.estado === 'EN_PROCESO' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          startIcon={<RefreshIcon />}
                          onClick={() => onResetCheck(zona)}
                        >
                          Resetear
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Historial completo */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Historial Completo de Checks
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
                <TableCell>Duración</TableCell>
                <TableCell>Observaciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay checks registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                checks.map((check) => {
                  // Calcular duración si está completado
                  let duracion = '-';
                  if (check.fecha_inicio && check.fecha_completado) {
                    const inicio = new Date(check.fecha_inicio);
                    const fin = new Date(check.fecha_completado);
                    const minutos = Math.round((fin - inicio) / (1000 * 60));
                    duracion = `${minutos} min`;
                  }

                  return (
                    <TableRow key={check.id}>
                      <TableCell>
                        {new Date(check.fecha).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Chip label={LABELS.ZONAS[check.zona]} size="small" variant="outlined" />
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
                        <Typography variant="body2">
                          {check.iniciado_por?.email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {check.completado_por?.email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {duracion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {check.motivo_omision || check.observaciones || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
