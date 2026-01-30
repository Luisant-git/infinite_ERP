import { useState, useEffect } from 'react';
import { validateToken } from '../api/token';

export const useMenuPermissions = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const userData = await validateToken();
        setUser(userData);
      } catch (error) {
        console.error('Token validation failed:', error);
      }
    };
    
    loadUserFromToken();
  }, []);

  const canView = () => true;
  const canAdd = () => user?.adminUser || user?.canAdd || false;
  const canEdit = () => user?.adminUser || user?.canEdit || false;
  const canDelete = () => user?.adminUser || user?.canDelete || false;

  return {
    canView,
    canAdd,
    canEdit,
    canDelete
  };
};