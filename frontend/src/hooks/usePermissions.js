import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateToken } from '../api/token';
import { ROUTES } from '../constants/permissions';

export const usePermissions = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const userData = await validateToken();
        setUser(userData);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.clear();
        navigate(ROUTES.LOGIN);
      }
    };
    
    if (localStorage.getItem('token')) {
      loadUserFromToken();
    }
  }, [navigate]);
  
  const canAdd = () => user?.adminUser || user?.canAdd || false;
  const canEdit = () => user?.adminUser || user?.canEdit || false;
  const canDelete = () => user?.adminUser || user?.canDelete || false;
  const canDCClose = () => user?.adminUser || user?.dcClose || false;
  const isAdmin = () => user?.adminUser || false;
  const isMD = user?.IsMD || 0;

  return {
    user,
    canAdd,
    canEdit,
    canDelete,
    canDCClose,
    isAdmin,
    isMD
  };
};