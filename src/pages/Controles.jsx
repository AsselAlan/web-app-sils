import { Container, Box, Typography } from '@mui/material';
import Navbar from '../components/Navbar';

export default function Controles() {
  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Controles
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Checklists diarios y semanales
        </Typography>
      </Container>
    </Box>
  );
}
