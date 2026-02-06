# MD User Role Implementation Guide

## Overview
This guide documents the implementation of the MD (Managing Director) user role in the Infinite ERP system. MD users have similar privileges to Admin users, with full visibility to all approval pages across all concerns.

## Changes Made

### 1. Backend Changes

#### File: `backend/src/auth/auth.service.ts`
- **Updated login logic** to treat MD users (IsMD = 1) like Admin users
- MD users now have access to all tenants/concerns, not restricted to specific concernIds
- Auto-select tenant logic now excludes MD and Admin users (they see company selection)

**Key Changes:**
```typescript
// MD users get access to all tenants like admin
const availableTenants = await this.prisma.tenant.findMany({
  where: {
    ...(user.adminUser || user.IsMD === 1 ? {} : /* concern filter */),
    concern: { isDeleted: false }
  },
  include: { concern: true }
});
```

### 2. Frontend Changes

#### File: `frontend/src/store/slices/authSlice.js`
- Already had IsMD field support in state management
- Stores IsMD value in localStorage for persistence

#### File: `frontend/src/hooks/usePermissions.js`
- **Added isMD export** to make MD status available throughout the app
- Returns `isMD` value from user data

**Key Changes:**
```javascript
const isMD = user?.IsMD || 0;

return {
  user,
  canAdd,
  canEdit,
  canDelete,
  canDCClose,
  isAdmin,
  isMD  // New export
};
```

#### File: `frontend/src/layouts/AppSidebar.jsx`
- **Updated Approval menu visibility** to show for both Admin and MD users
- MD users now see all approval pages in the sidebar

**Key Changes:**
```javascript
...(user?.adminUser === true || isMD === 1 ? [{
  key: 'approval',
  icon: <FileTextOutlined />,
  label: 'Approval',
  children: [
    { key: ROUTES.PARTY_APPROVAL, label: 'Party Approval' },
    { key: ROUTES.DESIGN_APPROVAL, label: 'Design Approval' },
    { key: ROUTES.RATE_QUOTATION_APPROVAL, label: 'Rate Quotation Approval' }
  ]
}] : [])
```

#### File: `frontend/src/pages/masters/UserMaster.jsx`
- **Added MD User checkbox** to user creation/edit form
- **Added MD column** to user list table
- Properly handles IsMD value conversion (boolean to integer 0/1)

**Key Changes:**
- New state: `isMDUser` to track MD checkbox
- New form field: `IsMD` checkbox
- New table column: Shows MD status
- Form submission converts boolean to integer (0 or 1)

### 3. Database Schema
The database already had the `IsMD` field in the User model:
```prisma
model User {
  IsMD       Int      @default(0)
  // ... other fields
}
```

## How to Use

### Creating an MD User

1. **Login as Admin**
2. **Navigate to**: Masters → Login Creation
3. **Click**: Add User button
4. **Fill in the form**:
   - User Name: Enter username
   - Password: Enter password
   - Concern: Leave empty or select specific concerns (MD sees all regardless)
   - **Check**: MD User checkbox ✓
   - Active: Check to activate user
5. **Click**: OK to save

### MD User Login Experience

1. **Login** with MD credentials
2. **Company Selection**: MD users will see all available companies/concerns (like Admin)
3. **Select** company and financial year
4. **Dashboard**: Access to all features
5. **Approval Menu**: Visible in sidebar with:
   - Party Approval
   - Design Approval
   - Rate Quotation Approval

### MD User Capabilities

✅ **Same as Admin for Approvals:**
- View all Party approvals across all concerns
- View all Design approvals across all concerns
- View all Rate Quotation approvals across all concerns
- Approve/reject items from any concern

✅ **Access Control:**
- Can see all companies/concerns during login
- Not restricted by concernIds mapping
- Full visibility to approval workflows

❌ **Different from Admin:**
- May not have access to User Master (unless explicitly granted)
- May not have access to Concern Master (unless explicitly granted)
- Permissions for Add/Edit/Delete can be controlled separately

## Technical Notes

### IsMD Field Values
- `0` = Regular user (default)
- `1` = MD user (full approval access)

### Backend Logic
- MD users bypass concern filtering in tenant queries
- Login returns all available tenants for MD users
- JWT token includes IsMD value for frontend checks

### Frontend Logic
- `isMD` value available via `usePermissions()` hook
- Sidebar menu conditionally shows Approval section
- All approval pages already use IsMD from Redux state

## Testing Checklist

- [ ] Create new MD user via User Master
- [ ] Login with MD credentials
- [ ] Verify company selection shows all concerns
- [ ] Check Approval menu is visible in sidebar
- [ ] Access Party Approval page
- [ ] Access Design Approval page
- [ ] Access Rate Quotation Approval page
- [ ] Verify approvals from all concerns are visible
- [ ] Test approval/update functionality
- [ ] Edit MD user and verify MD checkbox state
- [ ] Verify MD column shows in user list

## Files Modified

### Backend (1 file)
1. `backend/src/auth/auth.service.ts`

### Frontend (4 files)
1. `frontend/src/hooks/usePermissions.js`
2. `frontend/src/layouts/AppSidebar.jsx`
3. `frontend/src/pages/masters/UserMaster.jsx`

## Migration Notes

No database migration required - the `IsMD` field already exists in the schema.

Existing users have `IsMD = 0` by default, so no data changes needed.

## Support

For issues or questions:
1. Check that IsMD value is properly set in database
2. Verify JWT token includes IsMD field
3. Check browser localStorage for IsMD value
4. Ensure approval pages are not filtered by concern for MD users
