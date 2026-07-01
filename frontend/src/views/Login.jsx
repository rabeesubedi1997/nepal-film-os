import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { Film, Lock, Mail, Loader } from 'lucide-react';
import SeoHead from '../components/SeoHead'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    const success = await login(email, password);
    if (success) {
      navigate('/app/dashboard');
    }
  };

  return (
    <>
      <SeoHead title="Sign In" description="Sign in to Nepal Film OS and manage your film production workflow." url="/login" />
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-amber-500 text-slate-950 p-3 rounded-xl mb-3">
            <Film className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Nepal Film OS</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to your workspace</p>
          <Link to="/" className="mt-2 text-xs text-slate-600 hover:text-amber-400 transition-colors flex items-center gap-1">
            &larr; Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Enter password"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm">
            {loading ? <><Loader className="h-4 w-4 animate-spin" /> Signing In...</> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-500 hover:text-amber-400 font-medium">Create one</Link>
          </p>
        </div>

      </div>
    </div>
    </>
  );
}
