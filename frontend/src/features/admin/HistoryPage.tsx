import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Filter, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';
import { statusColors, statusLabels } from '../../constants';
import type { Prize } from '../../types';

interface Row {
  id: number;
  participation_uid: string;
  name: string;
  phone: string;
  prize_id: number | null;
  prize_name_snapshot: string;
  code: string;
  status: string;
  redeemed_at: string | null;
  created_at: string;
}

export function HistoryPage() {
  const [filters, setFilters] = useState({ from: '', to: '', prizeId: '', status: '', search: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-history', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const response = await api.get<{ rows: Row[]; total: number }>(`/admin/participations?${params}`);
      return response.data;
    },
  });
  const { data: prizes } = useQuery({
    queryKey: ['admin-prizes'],
    queryFn: async () => (await api.get<Prize[]>('/admin/prizes')).data,
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/admin/participations/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-history'] }),
  });

  const exportParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) exportParams.set(key, value); });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">HISTORIAL DE PARTICIPACIONES</h1>
          <p className="mt-1 text-xs text-white/40">
            {data?.total ?? 0} registros · Cada premio conserva su nombre original aunque se elimine o modifique
          </p>
        </div>
        <a className="btn-neon" href={`/api/admin/participations/export.csv?${exportParams}`}>
          <Download size={16} /> Exportar CSV
        </a>
      </div>

      <div className="card-dark">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/45">
          <Filter size={14} /> Filtros
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div><label className="label-dark">Desde</label><input className="input-dark" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></div>
          <div><label className="label-dark">Hasta</label><input className="input-dark" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></div>
          <div>
            <label className="label-dark">Premio</label>
            <select className="input-dark" value={filters.prizeId} onChange={(e) => setFilters({ ...filters, prizeId: e.target.value })}>
              <option value="">Todos</option>
              {prizes?.map((prize) => <option key={prize.id} value={prize.id}>{prize.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-dark">Estado</label>
            <select className="input-dark" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div><label className="label-dark">Buscar</label><input className="input-dark" placeholder="Nombre, teléfono o código" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
        </div>
      </div>

      <div className="card-dark overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={32} /></div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/35">
              <tr>
                <th className="px-5 py-3.5">Fecha</th><th className="px-3 py-3.5">Participante</th>
                <th className="px-3 py-3.5">Premio</th><th className="px-3 py-3.5">Código</th>
                <th className="px-3 py-3.5">ID participación</th><th className="px-3 py-3.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.rows.map((row) => (
                <tr key={row.id} className="text-white/70">
                  <td className="whitespace-nowrap px-5 py-3 text-[11px] text-white/45">{new Date(row.created_at).toLocaleString('es')}</td>
                  <td className="px-3 py-3"><p className="font-semibold">{row.name}</p><p className="text-[10px] text-white/35">{row.phone}</p></td>
                  <td className="px-3 py-3">{row.prize_name_snapshot}</td>
                  <td className="px-3 py-3 font-mono text-[10px] text-[color:var(--secondary)]">{row.code}</td>
                  <td className="px-3 py-3 font-mono text-[9px] text-white/30">{row.participation_uid.slice(0, 12)}…</td>
                  <td className="px-3 py-3">
                    <select
                      className={`badge cursor-pointer border outline-none ${statusColors[row.status] ?? ''}`}
                      value={row.status}
                      onChange={(event) => changeStatus.mutate({ id: row.id, status: event.target.value })}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value} className="bg-[#120a22]">{label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {data?.rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-white/30">No hay registros con estos filtros</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
