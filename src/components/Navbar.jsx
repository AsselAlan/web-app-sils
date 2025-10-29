import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Obtener el rol desde la tabla usuarios
        const { data: userData, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single();
        
        if (!error && userData) {
          console.log('Rol del usuario:', userData.rol);
          setUserRole(userData.rol);
        } else {
          console.error('Error obteniendo rol del usuario:', error);
          setUserRole(null);
        }
      }
    } catch (error) {
      console.error('Error en getCurrentUser:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Menú items para ADMIN
  const adminMenuItems = [
    { 
      text: 'Herramientas', 
      icon: <BuildIcon />, 
      path: '/herramientas', 
      description: 'Agregar, editar, eliminar y sumar herramientas' 
    },
    { 
      text: 'Solicitudes', 
      icon: <AssignmentIcon />, 
      path: '/solicitudes', 
      description: 'Ver, aceptar o rechazar solicitudes de herramientas' 
    },
    { 
      text: 'Usuarios', 
      icon: <PeopleIcon />, 
      path: '/usuarios', 
      description: 'Gestionar usuarios del sistema' 
    }
  ];

  // Menú items para TECNICO
  const tecnicoMenuItems = [
    { 
      text: 'Herramientas', 
      icon: <VisibilityIcon />, 
      path: '/herramientas', 
      description: 'Ver herramientas y filtrar por zona, estado, etc.' 
    },
    { 
      text: 'Solicitudes', 
      icon: <AssignmentIcon />, 
      path: '/solicitudes', 
      description: 'Pedir herramientas o insumos' 
    }
  ];

  // Obtener menú items según el rol del usuario
  const getMenuItems = () => {
    if (loading) return [];
    
    switch (userRole) {
      case 'ADMIN':
        return adminMenuItems;
      case 'TECNICO':
        return tecnicoMenuItems;
      default:
        return [];
    }
  };

  const currentMenuItems = getMenuItems();

  const DrawerContent = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          SILS
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Sistema Integrado de Logística
        </Typography>
        {loading ? (
          <CircularProgress size={20} sx={{ mt: 1 }} />
        ) : userRole ? (
          <Chip
            label={userRole}
            color={userRole === 'ADMIN' ? 'error' : 'primary'}
            size="small"
            sx={{ mt: 1 }}
          />
        ) : (
          <Chip
            label="Sin rol"
            color="default"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>
      <Divider />
      <List>
        {currentMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text} 
              secondary={item.description}
              secondaryTypographyProps={{
                variant: 'caption',
                color: 'text.secondary',
                sx: { fontSize: '0.7rem', lineHeight: 1.2 }
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate(currentMenuItems.length > 0 ? currentMenuItems[0].path : '/herramientas')}
          >
            SILS
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  {currentMenuItems.map((item) => (
                    <Button
                      key={item.text}
                      color="inherit"
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderBottom: location.pathname === item.path ? 2 : 0,
                        borderRadius: 0,
                      }}
                    >
                      {item.text}
                    </Button>
                  ))}
                </>
              )}
            </Box>
          )}

          <Button
            color="inherit"
            onClick={handleMenuClick}
            sx={{ ml: 2 }}
          >
            {user?.email}
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Rol: {loading ? 'Cargando...' : (userRole || 'Sin asignar')}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <DrawerContent />
      </Drawer>
    </>
  );
}
