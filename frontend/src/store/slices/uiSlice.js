import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: window.innerWidth <= 768,
  isMobile: window.innerWidth <= 768,
  loading: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setMobileView: (state, action) => {
      state.isMobile = action.payload;
      if (action.payload) {
        state.sidebarCollapsed = true;
      }
    }
  }
});

export const { toggleSidebar, setLoading, setMobileView } = uiSlice.actions;
export default uiSlice.reducer;