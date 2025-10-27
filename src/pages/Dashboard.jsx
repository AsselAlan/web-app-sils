import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  Build as BuildIcon,
  Checklist as ChecklistIcon,
  RequestPage as RequestPageIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [stats] = useState({
    totalHerramientas: 0,
    controlesHoy: 0,
    solicitudesPendientes: 0,
    herramientasAlerta: 0,
  });

  const statCards = [
    {
      title: 'Total Herramientas',
      value: stats.totalHerramientas,
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Controles Hoy',
      value: stats.controlesHoy,
      icon: <ChecklistIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Solicitudes Pendientes',
      value: stats.solicitudesPendientes,
      icon: <RequestPageIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Herramientas en Alerta',
      value: stats.herramientasAlerta,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ];

  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Resumen general del sistema
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {card.value}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {card.title}
                      </Typography>
                    </Box>
                    <Box sx={{ opacity: 0.8 }}>{card.icon}</Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Controles Recientes
              </Typography>
              <Typography color="text.secondary">
                No hay controles recientes
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Solicitudes Recientes
              </Typography>
              <Typography color="text.secondary">
                No hay solicitudes recientes
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
