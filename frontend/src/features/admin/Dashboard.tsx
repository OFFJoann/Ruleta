import { useQuery } from '@tanstack/react-query';
import { Award, CalendarDays, CircleDollarSign, Gift, Loader2, PackageOpen, Ticket, Users } from 'lucide-react';
import { api } from '../../services/api';
import { statusColors, statusLabels } from '../../constants';
import type { Stats } from '../../types';

const cards = [
  { key: 'total', label: 'Participaciones', icon: Users, color: 'from-purple-500 to-fuchsia-500' },
  { key: 'today', label: 'Hoy', icon: CalendarDays, color: 'from-cyan-500 to-blue-500' },
  { key: 'delivered', label: 'Premios entregados', icon: Gift, color: 'from-pink-500 to-rose-500' },
  { key: 'available', label: 'Premios disponibles', icon: PackageOpen, color: 'from-emerald-500 to-teal-500' },
  { key: 'exhausted', label: 'Categorías agotadas', icon: Award, color: 'from-amber-500 to-orange-500' },
  { key: 'courtesies', label: 'Cortesías entregadas', icon: Ticket, color: 'from-violet-500 to-purple-500' },
  { key: 'discounts', label: 'Descuentos entregados', icon: CircleDollarSign, color: 'from-lime-500 to-green-500' },
] as const;

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get<Stats>('/admin/stats')).data,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={36} /></div>;
  }

  const maxParticipations = Math.max(1, ...data.byPrize.map((prize) => prize.participations));

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-black tracking-wide">DASHBOARD</h1>
        <p className="mt-1 text-xs text-white/40">Resumen en tiempo real de la promoción</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="card-dark flex items-center gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-display text-2xl font-black">{data[key]}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="card-dark">
          <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-wider text-white/80">Estadísticas por premio</h2>
          <div className="space-y-4">
            {data.byPrize.length === 0 && <p className="text-xs text-white/35">Aún no hay premios configurados.</p>}
            {data.byPrize.map((prize) => (
              <div key={prize.id}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium text-white/80">{prize.icon} {prize.name}</span>
                  <span className="text-white/40">{prize.participations} giros · {prize.delivered}/{prize.quantity === 0 ? '∞' : prize.quantity}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(3, (prize.participations / maxParticipations) * 100)}%`,
                      background: `linear-gradient(90deg, ${prize.color}, ${prize.color}88)`,
                      boxShadow: `0 0 12px ${prize.color}88`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-dark overflow-x-auto">
          <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-wider text-white/80">Últimos ganadores</h2>
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-white/35">
              <tr><th className="pb-3">Participante</th><th className="pb-3">Premio</th><th className="pb-3">Código</th><th className="pb-3">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.recent.map((row) => (
                <tr key={row.code} className="text-white/70">
                  <td className="py-2.5">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-[10px] text-white/30">{new Date(row.created_at).toLocaleString('es')}</p>
                  </td>
                  <td className="py-2.5">{row.prize_name_snapshot}</td>
                  <td className="py-2.5 font-mono text-[10px] text-[color:var(--secondary)]">{row.code}</td>
                  <td className="py-2.5"><span className={`badge border ${statusColors[row.status] ?? ''}`}>{statusLabels[row.status] ?? row.status}</span></td>
                </tr>
              ))}
              {data.recent.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-white/30">Sin participaciones aún</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
