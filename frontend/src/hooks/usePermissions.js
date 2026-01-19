import { useSelector } from 'react-redux';
import { PERMISSIONS } from '../constants/permissions';

export const usePermissions = () => {
  const { permissions } = useSelector(state => state.auth);
  
  const hasPermission = (permission) => {
    if (permissions[PERMISSIONS.ADMIN_USER]) return true;
    return permissions[permission] || false;
  };

  const canAdd = () => hasPermission(PERMISSIONS.ADD);
  const canEdit = () => hasPermission(PERMISSIONS.EDIT);
  const canDelete = () => hasPermission(PERMISSIONS.DELETE);
  const canDCClose = () => hasPermission(PERMISSIONS.DC_CLOSE);
  const isAdmin = () => permissions[PERMISSIONS.ADMIN_USER] || false;

  return {
    hasPermission,
    canAdd,
    canEdit,
    canDelete,
    canDCClose,
    isAdmin
  };
};