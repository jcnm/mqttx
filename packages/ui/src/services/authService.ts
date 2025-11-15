/**
 * Authentication Service
 * Simple JWT-based authentication with 3 default users
 * TODO: Connect to backend API in production
 */

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
  permissions: string[];
}

export interface AuthToken {
  token: string;
  user: User;
  expiresAt: number;
}

// Default users for development/demo
const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    user: {
      id: 'user-1',
      username: 'admin',
      role: 'admin' as const,
      permissions: ['*'], // All permissions
    },
  },
  {
    username: 'operator',
    password: 'operator123',
    user: {
      id: 'user-2',
      username: 'operator',
      role: 'operator' as const,
      permissions: [
        'read:logs',
        'read:scada',
        'write:commands',
        'control:simulator',
      ],
    },
  },
  {
    username: 'viewer',
    password: 'viewer123',
    user: {
      id: 'user-3',
      username: 'viewer',
      role: 'viewer' as const,
      permissions: ['read:logs', 'read:scada'],
    },
  },
];

export class AuthService {
  private static STORAGE_KEY = 'auth_token';

  /**
   * Login with username/password
   * TODO: Replace with API call in production
   */
  async login(username: string, password: string): Promise<AuthToken> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userEntry = DEFAULT_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!userEntry) {
      throw new Error('Invalid username or password');
    }

    // Create simple JWT-like token (not secure, for demo only)
    const token = this.createToken(userEntry.user);
    const authToken: AuthToken = {
      token,
      user: userEntry.user,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    // Store in localStorage
    localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(authToken));

    return authToken;
  }

  /**
   * Logout current user
   */
  logout(): void {
    localStorage.removeItem(AuthService.STORAGE_KEY);
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    const authToken = this.getAuthToken();
    if (!authToken) return null;

    // Check expiry
    if (Date.now() > authToken.expiresAt) {
      this.logout();
      return null;
    }

    return authToken.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin has all permissions
    if (user.permissions.includes('*')) return true;

    return user.permissions.includes(permission);
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): AuthToken | null {
    const stored = localStorage.getItem(AuthService.STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Create token (simple base64 encoding for demo)
   * TODO: Use proper JWT in production
   */
  private createToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Date.now(),
    };

    return btoa(JSON.stringify(payload));
  }

  /**
   * Get default users (for display in UI)
   */
  static getDefaultUsers() {
    return DEFAULT_USERS.map((u) => ({
      username: u.username,
      password: u.password,
      role: u.user.role,
    }));
  }
}

export const authService = new AuthService();
