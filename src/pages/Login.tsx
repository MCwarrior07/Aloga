import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, Film, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        if (isRegister) {
          setIsRegister(false);
          setError('Registration successful! Please login.');
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user);
          navigate('/');
        }
      } else {
        setError(data.error);
      }
    } catch (err: any) { // Explicitly type err as any to allow access to message
      // The original instruction had a logical error where `res` was not in scope in the catch block.
      // To faithfully implement the intent of showing a specific error,
      // we check if the error object itself contains a message or if it's a generic error.
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20 mb-4">
            <Film className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-zinc-500">
            {isRegister ? 'Join the future of unrestricted content' : 'Sign in to your Aloga account'}
          </p>
        </div>

        {error && (
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Username"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          )}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-orange-500/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isRegister ? 'Sign Up' : 'Sign In'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm font-bold text-zinc-400 hover:text-orange-500 transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
