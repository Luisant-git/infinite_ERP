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
    const userData = localStorage.getItem('userData');
    const selectedCompany = localStorage.getItem('selectedCompany');
    const selectedYear = localStorage.getItem('selectedYear');
    
    if (token) {
      const user = userData ? JSON.parse(userData) : null;
      return {
        ...initialState,
        isAuthenticated: true,
        selectedTenantId: tenantId,
        selectedCompany: selectedCompany,
        selectedYear: selectedYear,
        user: user,
        showCompanySelection: user?.concernId ? false : false
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
      
      // Auto-select tenant for users with concern mapping
      if (action.payload.autoSelectTenant) {
        state.selectedCompany = action.payload.autoSelectTenant.company;
        state.selectedYear = action.payload.autoSelectTenant.financialYear;
        state.selectedTenantId = action.payload.autoSelectTenant.id;
        state.showCompanySelection = false;
        localStorage.setItem('tenantId', action.payload.autoSelectTenant.id);
        localStorage.setItem('selectedCompany', action.payload.autoSelectTenant.company);
        localStorage.setItem('selectedYear', action.payload.autoSelectTenant.financialYear);
        localStorage.setItem('userData', JSON.stringify(action.payload.user));
      } else {
        state.tenants = action.payload.tenants || [];
        state.showCompanySelection = true;
        localStorage.setItem('userData', JSON.stringify(action.payload.user));
      }
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
      localStorage.removeItem('userData');
      localStorage.removeItem('selectedCompany');
      localStorage.removeItem('selectedYear');
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
        localStorage.setItem('selectedCompany', action.payload.company);
        localStorage.setItem('selectedYear', action.payload.year);
      }
    },
    hideCompanySelection: (state) => {
      state.showCompanySelection = false;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError, setCompanySelection, hideCompanySelection } = authSlice.actions;
export default authSlice.reducer;