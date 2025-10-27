import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

export default function Login() {
  const [email, setEmail] = useState('admin@luxurydrive.com');
  const [senha, setSenha] = useState('admin123');
  const [totp, setTotp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, totp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Falha no login');
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      navigate('/admin/rotas-tarifas');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded p-6 w-full max-w-sm space-y-3">
        <h1 className="text-lg font-semibold">Luxury Drive — Login</h1>
        <label className="text-sm">E-mail</label>
        <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="text-sm">Senha</label>
        <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <label className="text-sm">Código 2FA (se ativado)</label>
        <input className="w-full p-2 rounded border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700" type="text" placeholder="000000" value={totp} onChange={(e) => setTotp(e.target.value)} />
        <button disabled={loading} type="submit" className="w-full bg-black text-white py-2 rounded hover:opacity-90 disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}