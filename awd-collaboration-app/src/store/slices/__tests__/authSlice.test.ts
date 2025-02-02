import authReducer, { setUser, setLoading, setError, logout } from '../authSlice';
import { User } from '../../../types/auth';

describe('authSlice', () => {
  const initialState = {
    user: null,
    loading: false,
    error: null,
  };

  const mockUser: User = {
    uid: '123',
    email: 'test@test.com',
    displayName: 'Test User',
    roles: { member: true },
    createdAt: '2025-01-30T00:00:00.000Z',
    lastLogin: '2025-01-30T00:00:00.000Z',
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const actual = authReducer(initialState, setUser(mockUser));
    expect(actual.user).toEqual(mockUser);
    expect(actual.loading).toBe(false);
    expect(actual.error).toBeNull();
  });

  it('should handle setLoading', () => {
    const actual = authReducer(initialState, setLoading(true));
    expect(actual.loading).toBe(true);
  });

  it('should handle setError', () => {
    const errorMessage = 'Test error';
    const actual = authReducer(initialState, setError(errorMessage));
    expect(actual.error).toBe(errorMessage);
    expect(actual.loading).toBe(false);
  });

  it('should handle logout', () => {
    const stateWithUser = {
      user: mockUser,
      loading: false,
      error: null,
    };
    const actual = authReducer(stateWithUser, logout());
    expect(actual).toEqual(initialState);
  });
});