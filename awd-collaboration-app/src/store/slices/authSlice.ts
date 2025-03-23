import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '../../types/auth';
import { clearWorkspaceState } from '../slices/workspaceSlice';
import { AppDispatch } from '../index';

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
});

// Export a thunk that will handle both authSlice.logout and workspaceSlice.clearWorkspaceState
export const logoutUser = () => (dispatch: AppDispatch) => {
  // First clear the workspace state
  dispatch(clearWorkspaceState());
  // Then logout the user
  dispatch(authSlice.actions.logout());
};

export const { setUser, setLoading, setError } = authSlice.actions;
// Export the original logout action for use within the auth slice
export const { logout } = authSlice.actions;

export default authSlice.reducer;