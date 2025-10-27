import { Container, Box, Typography } from '@mui/material';
import Navbar from '../components/Navbar';

export default function Admin() {
  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Administración
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Panel de administración y aprobación de solicitudes
        </Typography>
      </Container>
    </Box>
  );
}
