import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, ClipboardList, Disc3, Gift, History, Loader2, LogOut,
  Palette, QrCode, Settings2, ShieldCheck,
} from 'lucide-react';
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Dashboard } from './Dashboard';
import { PrizesManager } from './PrizesManager';
import { VisualEditor } from './VisualEditor';
import { HistoryPage } from './HistoryPage';
import { CodesPage } from './CodesPage';
import { SettingsPanel } from './SettingsPanel';
import { AuditPage } from './AuditPage';

const navigation = [
  { to: '', label: 'Dashboard', icon: BarChart3, end: true },
  { to: 'premios', label: 'Premios', icon: Gift },
  { to: 'editor', label: 'Editor visual', icon: Palette },
  { to: 'historial', label: 'Participaciones', icon: History },
  { to: 'codigos', label: 'Validar códigos', icon: QrCode },
  { to: 'ajustes', label: 'Ajustes', icon: Settings2 },
  { to: 'auditoria', label: 'Auditoría', icon: ShieldCheck },
];

function Layout() {
  const navigate = useNavigate();
  const logout = async () => {
    await api.post('/admin/logout').catch(() => undefined);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#08040f] text-white lg:flex">
      <aside className="border-b border-white/10 bg-[#0d0718] lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400">
            <Disc3 size={19} />
          </div>
          <div>
            <p className="font-display text-xs font-black tracking-wider">RULETA ADMIN</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Panel de control</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  isActive ? 'bg-[color:var(--primary)]/20 text-white shadow-inner' : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-3 pb-4 lg:block">
          <a href="/" target="_blank" rel="noreferrer" className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-white/45 transition hover:bg-white/5 hover:text-white">
            <ClipboardList size={16} /> Ver página pública
          </a>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-red-300/70 transition hover:bg-red-500/10 hover:text-red-300">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminApp() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-me'],
    queryFn: async () => (await api.get('/admin/me')).data as { username: string },
    retry: false,
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#08040f]"><Loader2 className="animate-spin text-purple-400" size={40} /></div>;
  }
  if (isError || !data) return <Navigate to="/admin/login" replace />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="premios" element={<PrizesManager />} />
        <Route path="editor" element={<VisualEditor />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route path="codigos" element={<CodesPage />} />
        <Route path="ajustes" element={<SettingsPanel />} />
        <Route path="auditoria" element={<AuditPage />} />
      </Route>
    </Routes>
  );
}
