import { Container, Box, Typography } from '@mui/material';
import Navbar from '../components/Navbar';

export default function Solicitudes() {
  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Solicitudes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Gestión de solicitudes de cambios y nuevas herramientas
        </Typography>
      </Container>
    </Box>
  );
}
