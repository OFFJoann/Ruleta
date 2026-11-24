import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import type { AuditRow } from '../../types';

export function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: async () => (await api.get<AuditRow[]>('/admin/audit')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black tracking-wide">REGISTRO DE ACTIVIDADES</h1>
        <p className="mt-1 text-xs text-white/40">Historial de acciones administrativas y giros</p>
      </div>

      <div className="card-dark overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={32} /></div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/35">
              <tr><th className="px-5 py-3.5">Fecha</th><th className="px-3 py-3.5">Acción</th><th className="px-3 py-3.5">Entidad</th><th className="px-3 py-3.5">Detalle</th><th className="px-3 py-3.5">Usuario</th><th className="px-5 py-3.5">IP</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.map((row) => (
                <tr key={row.id} className="text-white/65">
                  <td className="whitespace-nowrap px-5 py-3 text-[11px] text-white/40">{new Date(row.created_at).toLocaleString('es')}</td>
                  <td className="px-3 py-3"><span className="badge border border-[color:var(--primary)]/25 bg-[color:var(--primary)]/10 text-[color:var(--primary)]">{row.action}</span></td>
                  <td className="px-3 py-3">{row.entity} <span className="text-white/30">{row.entity_id}</span></td>
                  <td className="px-3 py-3 text-white/50">{row.details || '—'}</td>
                  <td className="px-3 py-3">{row.username ?? 'Público'}</td>
                  <td className="px-5 py-3 font-mono text-[10px] text-white/30">{row.ip}</td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center">
                  <ShieldCheck className="mx-auto mb-2 text-white/20" size={26} />
                  <span className="text-white/30">Sin actividades registradas</span>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
