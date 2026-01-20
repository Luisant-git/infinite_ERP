import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  tenants: [],
  isAuthenticated: false,
  loading: false,
  error: null,
  showCompanySelection: false,
  selectedCompany: null,
  selectedYear: null,
  selectedTenantId: null
};

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    
    if (token) {
      return {
        ...initialState,
        isAuthenticated: true,
        selectedTenantId: tenantId
      };
    }
  } catch (error) {
    console.error('Error loading persisted state:', error);
  }
  return initialState;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadPersistedState(),
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.tenants = action.payload.tenants;
      state.showCompanySelection = true;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.tenants = [];
      state.isAuthenticated = false;
      state.error = null;
      state.showCompanySelection = false;
      state.selectedCompany = null;
      state.selectedYear = null;
      state.selectedTenantId = null;
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
    },
    clearError: (state) => {
      state.error = null;
    },
    setCompanySelection: (state, action) => {
      if (action.payload.showModal) {
        state.showCompanySelection = true;
      } else {
        state.selectedCompany = action.payload.company;
        state.selectedYear = action.payload.year;
        state.selectedTenantId = action.payload.tenantId;
        state.showCompanySelection = false;
        localStorage.setItem('tenantId', action.payload.tenantId);
      }
    },
    hideCompanySelection: (state) => {
      state.showCompanySelection = false;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError, setCompanySelection, hideCompanySelection } = authSlice.actions;
export default authSlice.reducer;