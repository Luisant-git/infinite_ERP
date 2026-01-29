import { useSelector } from 'react-redux';

export const useMenuPermissions = () => {
  const { user } = useSelector(state => state.auth);

  const canView = () => true; // All users can view
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