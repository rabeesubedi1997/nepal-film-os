import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { Film, User, Lock, Mail, Phone, Loader } from 'lucide-react';
import SeoHead from '../components/SeoHead'

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const { register, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      alert("Passwords do not match");
      return;
    }

    const success = await register({
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirmation,
      preferred_language: 'English',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    });

    if (success) {
      navigate('/app/dashboard');
    }
  };

  return (
    <>
      <SeoHead title="Create Account" description="Create your free Nepal Film OS account and start managing your film production." url="/register" />
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl mb-2">
            <Film className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Create Account</h2>
          <p className="text-xs text-slate-500 mt-0.5">Register to start managing production workspaces</p>
          <Link to="/" className="mt-2 text-xs text-slate-600 hover:text-amber-400 transition-colors flex items-center gap-1">
            &larr; Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Ram Shrestha" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="ram@email.com" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="+977 980-0000000" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Enter password" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Confirm Password</label>
            <input type="password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Confirm password" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm">
            {loading ? <><Loader className="h-4 w-4 animate-spin" /> Registering...</> : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium">Sign In</Link>
          </p>
        </div>

      </div>
    </div>
    </>
  );
}
