import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: false,
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
    }
  }
});

export const { toggleSidebar, setLoading } = uiSlice.actions;
export default uiSlice.reducer;