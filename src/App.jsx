import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';

import Herramientas from './pages/Herramientas';
import Solicitudes from './pages/Solicitudes';
import Admin from './pages/Admin';
import Usuarios from './pages/Usuarios';
import Historial from './pages/Historial';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas - Todos los usuarios */}
        <Route
          path="/herramientas"
          element={
            <ProtectedRoute>
              <Herramientas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute>
              <Solicitudes />
            </ProtectedRoute>
          }
        />
        
        {/* Rutas solo para Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <Admin />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <Usuarios />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/historial"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <Historial />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/herramientas" replace />} />
        <Route path="*" element={<Navigate to="/herramientas" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
