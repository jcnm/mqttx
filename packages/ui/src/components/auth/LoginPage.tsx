/**
 * Login Page Component
 * Simple login form with default users
 */

import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/authService';
import { toastService } from '../../services/toastService';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const defaultUsers = AuthService.getDefaultUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(username, password);
      toastService.success(`Welcome, ${username}!`);
      onLoginSuccess();
    } catch (err) {
      toastService.error((err as Error).message);
    }
  };

  const handleQuickLogin = (user: { username: string; password: string }) => {
    setUsername(user.username);
    setPassword(user.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📡</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">MQTT Sparkplug Platform</h2>
          <p className="text-slate-400">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                placeholder="Enter username"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  placeholder="Enter password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <span>🔓</span>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Users */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span>🎭</span>
            Demo Users (Click to auto-fill)
          </h3>
          <div className="space-y-2">
            {defaultUsers.map((user) => (
              <button
                key={user.username}
                onClick={() => handleQuickLogin(user)}
                className="w-full text-left px-4 py-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-600 rounded-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium group-hover:text-emerald-400 transition">
                      {user.username}
                    </p>
                    <p className="text-xs text-slate-400">
                      Password: <code className="text-slate-300">{user.password}</code>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      user.role === 'admin'
                        ? 'bg-red-900/30 text-red-400 border border-red-800'
                        : user.role === 'operator'
                        ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Development/Demo Mode • Not for production use
        </p>
      </div>
    </div>
  );
}
