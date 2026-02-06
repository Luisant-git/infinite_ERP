import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tenants: [],
  isAuthenticated: false,
  loading: false,
  error: null,
  showCompanySelection: false,
  selectedCompany: null,
  selectedYear: null,
  selectedTenantId: null,
  IsMD: 0
};

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    const selectedCompany = localStorage.getItem('selectedCompany');
    const selectedYear = localStorage.getItem('selectedYear');
    const IsMD = localStorage.getItem('IsMD');
    
    if (token) {
      return {
        ...initialState,
        isAuthenticated: true,
        selectedTenantId: tenantId,
        selectedCompany: selectedCompany,
        selectedYear: selectedYear,
        IsMD: IsMD ? parseInt(IsMD) : 0
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
      state.IsMD = action.payload.user?.IsMD || 0;
      localStorage.setItem('IsMD', state.IsMD);
      
      // Auto-select tenant for users with concern mapping
      if (action.payload.autoSelectTenant) {
        state.selectedCompany = action.payload.autoSelectTenant.company;
        state.selectedYear = action.payload.autoSelectTenant.financialYear;
        state.selectedTenantId = action.payload.autoSelectTenant.id;
        state.showCompanySelection = false;
        localStorage.setItem('tenantId', action.payload.autoSelectTenant.id);
        localStorage.setItem('selectedCompany', action.payload.autoSelectTenant.company);
        localStorage.setItem('selectedYear', action.payload.autoSelectTenant.financialYear);
      } else {
        state.tenants = action.payload.tenants || [];
        state.showCompanySelection = true;
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.tenants = [];
      state.isAuthenticated = false;
      state.error = null;
      state.showCompanySelection = false;
      state.selectedCompany = null;
      state.selectedYear = null;
      state.selectedTenantId = null;
      state.IsMD = 0;
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('selectedCompany');
      localStorage.removeItem('selectedYear');
      localStorage.removeItem('IsMD');
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