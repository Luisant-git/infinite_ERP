import { useSelector } from 'react-redux';

export const usePermissions = () => {
  const { user } = useSelector(state => state.auth);
  
  const canAdd = () => user?.adminUser || user?.canAdd || false;
  const canEdit = () => user?.adminUser || user?.canEdit || false;
  const canDelete = () => user?.adminUser || user?.canDelete || false;
  const canDCClose = () => user?.adminUser || user?.dcClose || false;
  const isAdmin = () => user?.adminUser || false;

  return {
    canAdd,
    canEdit,
    canDelete,
    canDCClose,
    isAdmin
  };
};