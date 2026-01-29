import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getUserPermissions } from '../api/menuPermission';

export const useMenuPermissions = () => {
  const [permissions, setPermissions] = useState({});
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (user && !user.adminUser) {
      loadPermissions();
    }
  }, [user]);

  const loadPermissions = async () => {
    try {
      const userPermissions = await getUserPermissions(user.id);
      const permissionMap = {};
      userPermissions.forEach(p => {
        permissionMap[p.menuName] = {
          canView: p.canView,
          canAdd: p.canAdd,
          canEdit: p.canEdit,
          canDelete: p.canDelete
        };
      });
      setPermissions(permissionMap);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const hasPermission = (menuName, action = 'canView') => {
    if (user?.adminUser) return true;
    return permissions[menuName]?.[action] || false;
  };

  const canView = (menuName) => hasPermission(menuName, 'canView');
  const canAdd = (menuName) => hasPermission(menuName, 'canAdd');
  const canEdit = (menuName) => hasPermission(menuName, 'canEdit');
  const canDelete = (menuName) => hasPermission(menuName, 'canDelete');

  return {
    permissions,
    hasPermission,
    canView,
    canAdd,
    canEdit,
    canDelete
  };
};