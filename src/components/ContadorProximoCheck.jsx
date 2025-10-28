import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Schedule as ClockIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

export default function ContadorProximoCheck() {
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [esDiaLaboral, setEsDiaLaboral] = useState(false);
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    const calcularTiempoRestante = () => {
      const ahora = new Date();
      const diaSemana = ahora.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
      
      // Verificar si es día laboral (lunes a viernes)
      const esLaboral = diaSemana >= 1 && diaSemana <= 5;
      setEsDiaLaboral(esLaboral);

      if (!esLaboral) {
        // Si es fin de semana, calcular hasta el próximo lunes a las 08:00
        const proximoLunes = new Date(ahora);
        const diasHastaLunes = diaSemana === 0 ? 1 : 8 - diaSemana; // Si es domingo=1 día, si es sábado=2 días
        proximoLunes.setDate(ahora.getDate() + diasHastaLunes);
        proximoLunes.setHours(8, 0, 0, 0);
        
        const diferencia = proximoLunes.getTime() - ahora.getTime();
        setTiempoRestante(diferencia);
        setProgreso(0); // No hay progreso en fin de semana
        return;
      }

      // Si es día laboral
      const hoy8am = new Date(ahora);
      hoy8am.setHours(8, 0, 0, 0);
      
      const manana8am = new Date(ahora);
      manana8am.setDate(ahora.getDate() + 1);
      manana8am.setHours(8, 0, 0, 0);

      if (ahora < hoy8am) {
        // Antes de las 08:00 de hoy
        const diferencia = hoy8am.getTime() - ahora.getTime();
        setTiempoRestante(diferencia);
        
        // Progreso desde medianoche hasta 08:00
        const medianoche = new Date(ahora);
        medianoche.setHours(0, 0, 0, 0);
        const tiempoTranscurrido = ahora.getTime() - medianoche.getTime();
        const tiempoTotal = 8 * 60 * 60 * 1000; // 8 horas en ms
        setProgreso((tiempoTranscurrido / tiempoTotal) * 100);
      } else {
        // Después de las 08:00, mostrar tiempo hasta mañana
        // Verificar si mañana es día laboral
        const mananaDiaSemana = manana8am.getDay();
        if (mananaDiaSemana >= 1 && mananaDiaSemana <= 5) {
          const diferencia = manana8am.getTime() - ahora.getTime();
          setTiempoRestante(diferencia);
        } else {
          // Mañana es fin de semana, calcular hasta el próximo lunes
          const proximoLunes = new Date(manana8am);
          const diasExtra = mananaDiaSemana === 6 ? 2 : 1; // Si mañana es sábado, +2 días más
          proximoLunes.setDate(manana8am.getDate() + diasExtra);
          
          const diferencia = proximoLunes.getTime() - ahora.getTime();
          setTiempoRestante(diferencia);
        }
        setProgreso(100); // Ya pasaron las 08:00 de hoy
      }
    };

    // Calcular inmediatamente
    calcularTiempoRestante();

    // Actualizar cada segundo para mostrar cambios en tiempo real
    const interval = setInterval(calcularTiempoRestante, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatearTiempo = (ms) => {
    if (!ms) return '--:--:--';
    
    const totalSegundos = Math.floor(ms / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    if (horas > 24) {
      const dias = Math.floor(horas / 24);
      const horasRestantes = horas % 24;
      return `${dias}d ${horasRestantes}h ${minutos}m`;
    }

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const obtenerMensaje = () => {
    const ahora = new Date();
    const hoy8am = new Date(ahora);
    hoy8am.setHours(8, 0, 0, 0);

    if (!esDiaLaboral) {
      return 'Próximo check (Lunes 08:00)';
    }

    if (ahora < hoy8am) {
      return 'Checks se habilitan en';
    }

    return 'Próximo check en';
  };

  const obtenerColor = () => {
    const ahora = new Date();
    const hoy8am = new Date(ahora);
    hoy8am.setHours(8, 0, 0, 0);

    if (!esDiaLaboral) return 'default';
    if (ahora < hoy8am) return 'warning';
    return 'info';
  };

  return (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ClockIcon color="primary" />
          <Typography variant="h6" component="div">
            {obtenerMensaje()}
          </Typography>
          <Chip 
            label={esDiaLaboral ? 'Día Laboral' : 'Fin de Semana'} 
            color={esDiaLaboral ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" component="div" color="primary.main" fontWeight="bold">
            {formatearTiempo(tiempoRestante)}
          </Typography>
          
          {esDiaLaboral && (
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={progreso} 
                sx={{ height: 8, borderRadius: 4 }}
                color={obtenerColor()}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Progreso del día hacia las 08:00
              </Typography>
            </Box>
          )}
        </Box>

        {!esDiaLaboral && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los checks diarios solo se habilitan de lunes a viernes a las 08:00
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
