import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  permissions: {},
  isAuthenticated: false,
  loading: false,
  error: null,
  showCompanySelection: false,
  selectedCompany: null,
  selectedYear: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.permissions = action.payload.permissions;
      // Show company selection for admin users
      if (action.payload.permissions.adminUser) {
        state.showCompanySelection = true;
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.permissions = {};
      state.isAuthenticated = false;
      state.error = null;
      state.showCompanySelection = false;
      state.selectedCompany = null;
      state.selectedYear = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCompanySelection: (state, action) => {
      state.selectedCompany = action.payload.company;
      state.selectedYear = action.payload.year;
      state.showCompanySelection = false;
    },
    hideCompanySelection: (state) => {
      state.showCompanySelection = false;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError, setCompanySelection, hideCompanySelection } = authSlice.actions;
export default authSlice.reducer;