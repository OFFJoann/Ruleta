import { api, errorMessage } from '../../services/api';
import { Background } from '../../components/Background';
import { defaultTheme } from '../../constants';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc3, LockKeyhole, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/login', { username, password });
      navigate('/admin', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 text-white">
      <Background theme={{ ...defaultTheme, effectsEnabled: true }} />
      <div className="glass-strong w-full max-w-md rounded-2xl p-7 shadow-2xl shadow-black/60">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 shadow-lg shadow-purple-500/30">
            <Disc3 size={28} className="animate-spin text-white" style={{ animationDuration: '5s' }} />
          </div>
          <h1 className="neon-title text-2xl">PANEL ADMINISTRATIVO</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">Acceso restringido</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label-dark" htmlFor="username">Usuario</label>
            <input id="username" className="input-dark" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </div>
          <div>
            <label className="label-dark" htmlFor="password">Contraseña</label>
            <input id="password" className="input-dark" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
          <button className="btn-neon w-full py-3" disabled={loading}>
            {loading ? <Loader2 size={17} className="animate-spin" /> : <LockKeyhole size={17} />}
            INGRESAR
          </button>
        </form>
        <a href="/" className="mt-5 block text-center text-[11px] text-white/35 transition hover:text-white/70">← Volver a la ruleta</a>
      </div>
    </div>
  );
}
