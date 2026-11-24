import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Eye, EyeOff, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../services/api';
import type { Prize } from '../../types';
import { Uploader } from './Uploader';

type PrizeForm = Pick<Prize,
  'name' | 'description' | 'image_url' | 'icon' | 'color' | 'probability' | 'quantity' |
  'is_unlimited' | 'delivered' | 'active' | 'is_consolation' | 'position' |
  'result_title' | 'result_message' | 'result_description' | 'celebration_image_url' |
  'claim_instructions' | 'expires_at' | 'terms' | 'whatsapp_button_text' |
  'whatsapp_number' | 'whatsapp_message'
>;

const emptyPrize: PrizeForm = {
  name: '', description: '', image_url: '', icon: '🎁', color: '#a855f7',
  probability: 10, quantity: 1, is_unlimited: false, delivered: 0, active: true,
  is_consolation: false, position: 0, result_title: '¡FELICIDADES!', result_message: '',
  result_description: '', celebration_image_url: '', claim_instructions: '',
  expires_at: '', terms: '', whatsapp_button_text: 'RESERVAR POR WHATSAPP',
  whatsapp_number: '', whatsapp_message: '',
};

const tabs = ['Premio', 'Probabilidad e inventario', 'Resultado', 'WhatsApp'] as const;

export function PrizesManager() {
  const queryClient = useQueryClient();
  const { data: prizes, isLoading } = useQuery({
    queryKey: ['admin-prizes'],
    queryFn: async () => (await api.get<Prize[]>('/admin/prizes')).data,
  });
  const [editing, setEditing] = useState<PrizeForm | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Premio');
  const [error, setError] = useState('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-prizes'] });

  const save = useMutation({
    mutationFn: async (form: PrizeForm) => {
      if ('id' in form && typeof (form as PrizeForm & { id: number }).id === 'number') {
        await api.put(`/admin/prizes/${(form as PrizeForm & { id: number }).id}`, form);
      } else {
        await api.post('/admin/prizes', form);
      }
    },
    onSuccess: () => { setEditing(null); setError(''); refresh(); },
    onError: (caught) => setError(errorMessage(caught)),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await api.patch(`/admin/prizes/${id}/active`, { active });
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/admin/prizes/${id}`); },
    onSuccess: refresh,
    onError: (caught) => window.alert(errorMessage(caught)),
  });

  const openEdit = (prize: Prize) => {
    setTab('Premio');
    setError('');
    setEditing({
      ...emptyPrize,
      ...prize,
      is_unlimited: Boolean(prize.is_unlimited),
      active: Boolean(prize.active),
      is_consolation: Boolean(prize.is_consolation),
      id: prize.id,
    } as PrizeForm);
  };

  const update = <K extends keyof PrizeForm>(key: K, value: PrizeForm[K]) => {
    setEditing((previous) => (previous ? { ...previous, [key]: value } : previous));
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={36} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">GESTIÓN DE PREMIOS</h1>
          <p className="mt-1 text-xs text-white/40">Define premios, probabilidades, inventario y mensajes</p>
        </div>
        <button className="btn-neon" onClick={() => { setEditing({ ...emptyPrize }); setError(''); }}>
          <Plus size={16} /> Nuevo premio
        </button>
      </div>

      <div className="card-dark overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/35">
            <tr>
              <th className="px-5 py-3.5">Premio</th>
              <th className="px-3 py-3.5">Prob. original</th>
              <th className="px-3 py-3.5">Prob. efectiva</th>
              <th className="px-3 py-3.5">Inventario</th>
              <th className="px-3 py-3.5">Orden</th>
              <th className="px-3 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {prizes?.map((prize) => (
              <tr key={prize.id} className={!prize.available ? 'opacity-50' : ''}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ background: `${prize.color}33` }}>{prize.icon}</span>
                    <div>
                      <p className="font-semibold text-white/90">{prize.name}</p>
                      <p className="text-[10px] text-white/35">{prize.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 font-mono text-white/70">{prize.probability}%</td>
                <td className="px-3 py-3.5 font-mono font-bold text-[color:var(--secondary)]">{prize.effectiveProbability.toFixed(1)}%</td>
                <td className="px-3 py-3.5 text-white/60">
                  {prize.is_unlimited ? 'Ilimitado' : `${prize.delivered} / ${prize.quantity}`}
                  {!prize.is_unlimited && prize.delivered >= prize.quantity && <span className="ml-1.5 text-[9px] text-amber-300">AGOTADO</span>}
                </td>
                <td className="px-3 py-3.5 text-white/50">{prize.position}</td>
                <td className="px-3 py-3.5">
                  <span className={`badge border ${prize.active ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-white/15 bg-white/5 text-white/45'}`}>
                    {prize.active ? 'Activo' : 'Desactivado'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <button className="rounded-md p-2 text-white/40 transition hover:bg-white/10 hover:text-white" onClick={() => openEdit(prize)} title="Editar"><Edit3 size={15} /></button>
                    <button
                      className="rounded-md p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                      onClick={() => toggle.mutate({ id: prize.id, active: !prize.active })}
                      title={prize.active ? 'Desactivar' : 'Activar'}
                    >
                      {prize.active ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button className="rounded-md p-2 text-red-300/50 transition hover:bg-red-500/10 hover:text-red-300" onClick={() => { if (window.confirm(`¿Eliminar "${prize.name}"?`)) remove.mutate(prize.id); }} title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {prizes?.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-white/30">No hay premios. Crea el primero.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <div className="glass-strong my-6 w-full max-w-2xl rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="font-display text-base font-bold">{'id' in editing ? 'EDITAR PREMIO' : 'NUEVO PREMIO'}</h2>
              <button onClick={() => setEditing(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-6 pt-3">
              {tabs.map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`whitespace-nowrap border-b-2 px-3 pb-2.5 text-[11px] font-semibold transition ${tab === item ? 'border-[color:var(--primary)] text-white' : 'border-transparent text-white/35 hover:text-white/70'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <form
              className="max-h-[65vh] space-y-4 overflow-y-auto p-6"
              onSubmit={(event) => { event.preventDefault(); save.mutate(editing); }}
            >
              {tab === 'Premio' && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="label-dark">Nombre del premio</label><input className="input-dark" value={editing.name} onChange={(e) => update('name', e.target.value)} required /></div>
                    <div><label className="label-dark">Icono / emoji</label><input className="input-dark" value={editing.icon} onChange={(e) => update('icon', e.target.value)} maxLength={20} /></div>
                  </div>
                  <div><label className="label-dark">Descripción</label><input className="input-dark" value={editing.description} onChange={(e) => update('description', e.target.value)} /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label-dark">Color del segmento</label>
                      <div className="flex gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent" value={editing.color} onChange={(e) => update('color', e.target.value)} /><input className="input-dark" value={editing.color} onChange={(e) => update('color', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="label-dark">Orden en la ruleta</label>
                      <input className="input-dark" type="number" min={0} value={editing.position} onChange={(e) => update('position', Number(e.target.value))} />
                    </div>
                  </div>
                  <Uploader label="Imagen del premio" value={editing.image_url} onChange={(url) => update('image_url', url)} />
                  <div className="flex gap-5">
                    <label className="flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={editing.active} onChange={(e) => update('active', e.target.checked)} /> Premio activo</label>
                    <label className="flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={editing.is_consolation} onChange={(e) => update('is_consolation', e.target.checked)} /> Es consolación</label>
                  </div>
                </>
              )}

              {tab === 'Probabilidad e inventario' && (
                <>
                  <div>
                    <label className="label-dark">Probabilidad original: {editing.probability}%</label>
                    <input type="range" min={0} max={100} step={0.5} className="w-full" value={editing.probability} onChange={(e) => update('probability', Number(e.target.value))} />
                    <input className="input-dark mt-2" type="number" min={0} max={100} step={0.5} value={editing.probability} onChange={(e) => update('probability', Number(e.target.value))} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="label-dark">Cantidad total</label><input className="input-dark" type="number" min={0} value={editing.quantity} onChange={(e) => update('quantity', Number(e.target.value))} disabled={editing.is_unlimited} /></div>
                    <div><label className="label-dark">Ya entregados</label><input className="input-dark" type="number" min={0} value={editing.delivered} onChange={(e) => update('delivered', Number(e.target.value))} /></div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={editing.is_unlimited} onChange={(e) => update('is_unlimited', e.target.checked)} /> Premio ilimitado (ej. "Sigue participando")</label>
                  <p className="text-[10px] text-white/35">Los entregados se ajustan automáticamente en cada giro. Si los editas manualmente, no pueden ser menos que las participaciones registradas ni superar el total.</p>
                  <div className="rounded-lg border border-[color:var(--secondary)]/20 bg-[color:var(--secondary)]/5 p-3 text-[11px] leading-relaxed text-white/50">
                    El sistema recalcula las probabilidades efectivas en cada giro. Al agotarse una categoría, su peso se redistribuye entre las opciones restantes. Los premios entregados se descuentan en una transacción atómica.
                  </div>
                </>
              )}

              {tab === 'Resultado' && (
                <>
                  <div><label className="label-dark">Título del resultado</label><input className="input-dark" value={editing.result_title} onChange={(e) => update('result_title', e.target.value)} placeholder="¡FELICIDADES!" /></div>
                  <div><label className="label-dark">Mensaje principal</label><textarea className="input-dark min-h-20" value={editing.result_message} onChange={(e) => update('result_message', e.target.value)} /></div>
                  <div><label className="label-dark">Descripción</label><textarea className="input-dark min-h-16" value={editing.result_description} onChange={(e) => update('result_description', e.target.value)} /></div>
                  <Uploader label="Imagen o GIF de celebración" value={editing.celebration_image_url} onChange={(url) => update('celebration_image_url', url)} />
                  <div><label className="label-dark">Instrucciones para reclamar</label><input className="input-dark" value={editing.claim_instructions} onChange={(e) => update('claim_instructions', e.target.value)} /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="label-dark">Vencimiento</label><input className="input-dark" value={editing.expires_at} onChange={(e) => update('expires_at', e.target.value)} placeholder="30 días" /></div>
                    <div><label className="label-dark">Condiciones de uso</label><input className="input-dark" value={editing.terms} onChange={(e) => update('terms', e.target.value)} /></div>
                  </div>
                </>
              )}

              {tab === 'WhatsApp' && (
                <>
                  <div><label className="label-dark">Texto del botón</label><input className="input-dark" value={editing.whatsapp_button_text} onChange={(e) => update('whatsapp_button_text', e.target.value)} /></div>
                  <div><label className="label-dark">Número (sin espacios, con código país)</label><input className="input-dark" value={editing.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} placeholder="573001234567" /></div>
                  <div>
                    <label className="label-dark">Mensaje precargado</label>
                    <textarea className="input-dark min-h-28" value={editing.whatsapp_message} onChange={(e) => update('whatsapp_message', e.target.value)} placeholder="Hola, gané [PREMIO] en [CLUB]. Mi código es [CODIGO]." />
                    <p className="mt-1.5 text-[10px] text-white/35">Variables: [CLUB] · [PREMIO] · [CODIGO] · [NOMBRE]</p>
                  </div>
                </>
              )}

              {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-white/60 hover:text-white" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn-neon" disabled={save.isPending}>{save.isPending ? <Loader2 size={15} className="animate-spin" /> : null} Guardar premio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
