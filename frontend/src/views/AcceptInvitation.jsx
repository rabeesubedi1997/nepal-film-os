import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import api from '../api';
import { Film, Lock, Loader, CheckCircle, XCircle } from 'lucide-react';
import SeoHead from '../components/SeoHead'

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { fetchFilms, selectFilm } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email || !password || !passwordConfirmation) return;
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/invitation/accept', {
        token, email, password,
        password_confirmation: passwordConfirmation,
      });
      const { token: authToken, user } = response.data;
      useAuthStore.getState().setToken(authToken);
      useAuthStore.setState({ user });
      await fetchFilms();
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-4 inline-block">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Invalid Invitation Link</h2>
          <p className="text-sm text-slate-500 mb-6">This link is missing required information.</p>
          <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-green-500/10 text-green-400 p-4 rounded-xl mb-4 inline-block">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Password Set!</h2>
          <p className="text-sm text-slate-500">Redirecting you to your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SeoHead title="Accept Invitation" description="Set your password and join the film workspace." />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-amber-500 text-slate-950 p-3 rounded-xl mb-3">
              <Film className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Accept Invitation</h2>
            <p className="text-sm text-slate-500 mt-1">Set your password to get started</p>
          </div>

          <div className="mb-6 p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-400">
            Account: <span className="text-slate-200 font-medium">{email}</span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Min. 8 characters"
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Confirm Password</label>
              <input
                type="password" required value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Re-enter password"
                minLength={8}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm">
              {loading ? <><Loader className="h-4 w-4 animate-spin" /> Setting Password...</> : 'Set Password & Log In'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
