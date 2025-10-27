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
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  History as HistoryIcon,
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

  // Menú items según rol
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['ADMIN', 'TECNICO'] },
    { text: 'Herramientas', icon: <BuildIcon />, path: '/herramientas', roles: ['ADMIN', 'TECNICO'] },
    { text: 'Controles', icon: <CheckCircleIcon />, path: '/controles', roles: ['ADMIN', 'TECNICO'] },
    { text: 'Solicitudes', icon: <AssignmentIcon />, path: '/solicitudes', roles: ['ADMIN', 'TECNICO'] },
  ];

  const adminItems = [
    { text: 'Panel Admin', icon: <AdminIcon />, path: '/admin', roles: ['ADMIN'] },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios', roles: ['ADMIN'] },
    { text: 'Historial', icon: <HistoryIcon />, path: '/historial', roles: ['ADMIN'] },
  ];

  // Mostrar todos los items mientras carga, o filtrar por rol cuando ya cargó
  const filteredMenuItems = loading ? menuItems : menuItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const filteredAdminItems = loading ? [] : adminItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

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
        {filteredMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {userRole === 'ADMIN' && filteredAdminItems.length > 0 && (
        <>
          <Divider />
          <List>
            {filteredAdminItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </>
      )}
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
            onClick={() => navigate('/dashboard')}
          >
            SILS
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  {filteredMenuItems.map((item) => (
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
                  
                  {userRole === 'ADMIN' && filteredAdminItems.length > 0 && (
                    <>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'white' }} />
                      {filteredAdminItems.map((item) => (
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
