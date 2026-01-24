import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

/**
 * User roles in the application.
 * - 'client': Regular customer view
 * - 'admin': Administrative view with management capabilities
 */
export type UserRole = 'client' | 'admin';

interface AuthContextValue {
  /** Current user role */
  role: UserRole;
  /** Switch to a different role */
  setRole: (role: UserRole) => void;
  /** Check if current role is admin */
  isAdmin: boolean;
  /** Check if current role is client */
  isClient: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** Initial role, defaults to 'client' */
  initialRole?: UserRole;
}

/**
 * Auth provider component that manages user role state.
 * Wrap your app with this provider to enable role-based access.
 *
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider({ children, initialRole = 'client' }: AuthProviderProps) {
  const [role, setRoleState] = useState<UserRole>(initialRole);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
  }, []);

  const value: AuthContextValue = {
    role,
    setRole,
    isAdmin: role === 'admin',
    isClient: role === 'client',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 *
 * @example
 * const { role, setRole, isAdmin } = useAuth();
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
