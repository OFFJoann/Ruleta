import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, Save, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../services/api';

interface Promotion {
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  maxPerPhone: number;
  cooldownMinutes: number;
  finishedMessage: string;
}
interface WhatsApp {
  number: string;
  buttonText: string;
  message: string;
}

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const { data: promotionData } = useQuery({
    queryKey: ['admin-promotion'],
    queryFn: async () => (await api.get<Promotion>('/admin/settings/promotion')).data,
  });
  const { data: whatsappData } = useQuery({
    queryKey: ['admin-whatsapp-settings'],
    queryFn: async () => (await api.get<WhatsApp>('/admin/settings/whatsapp')).data,
  });

  const [promotion, setPromotion] = useState<Promotion>({
    enabled: true, startsAt: '', endsAt: '', maxPerPhone: 3, cooldownMinutes: 60, finishedMessage: '',
  });
  const [whatsapp, setWhatsapp] = useState<WhatsApp>({ number: '', buttonText: '', message: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { if (promotionData) setPromotion(promotionData); }, [promotionData]);
  useEffect(() => { if (whatsappData) setWhatsapp(whatsappData); }, [whatsappData]);

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      await api.put(`/admin/settings/${key}`, value);
    },
    onSuccess: () => {
      setMessage('✓ Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['wheel'] });
    },
    onError: (caught) => setMessage(`✗ ${errorMessage(caught)}`),
  });

  const changePassword = useMutation({
    mutationFn: async () => { await api.post('/admin/password', password); },
    onSuccess: () => { setPassword({ currentPassword: '', newPassword: '' }); setMessage('✓ Contraseña actualizada'); },
    onError: (caught) => setMessage(`✗ ${errorMessage(caught)}`),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black tracking-wide">AJUSTES DE LA PROMOCIÓN</h1>
        <p className="mt-1 text-xs text-white/40">Control de participaciones, vigencia y contacto</p>
      </div>

      {message && <p className={`rounded-lg border px-4 py-2.5 text-xs ${message.startsWith('✓') ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-red-400/25 bg-red-400/10 text-red-300'}`}>{message}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-dark space-y-4">
          <div className="flex items-center gap-2"><Settings2 size={17} className="text-[color:var(--primary)]" /><h2 className="font-display text-sm font-bold">Control de participación</h2></div>
          <label className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/75">
            <input type="checkbox" checked={promotion.enabled} onChange={(e) => setPromotion({ ...promotion, enabled: e.target.checked })} />
            Ruleta habilitada para participar
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label-dark">Fecha y hora de inicio</label><input className="input-dark" type="datetime-local" value={promotion.startsAt ? String(promotion.startsAt).slice(0, 16) : ''} onChange={(e) => setPromotion({ ...promotion, startsAt: e.target.value })} /></div>
            <div><label className="label-dark">Fecha y hora de fin</label><input className="input-dark" type="datetime-local" value={promotion.endsAt ? String(promotion.endsAt).slice(0, 16) : ''} onChange={(e) => setPromotion({ ...promotion, endsAt: e.target.value })} /></div>
            <div><label className="label-dark">Intentos máximos por número de WhatsApp</label><input className="input-dark" type="number" min={1} value={promotion.maxPerPhone} onChange={(e) => setPromotion({ ...promotion, maxPerPhone: Number(e.target.value) })} /></div>
            <div><label className="label-dark">Espera entre giros (minutos)</label><input className="input-dark" type="number" min={0} value={promotion.cooldownMinutes} onChange={(e) => setPromotion({ ...promotion, cooldownMinutes: Number(e.target.value) })} /></div>
          </div>
          <p className="rounded-lg border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/5 p-3 text-[11px] leading-relaxed text-white/50">
            Cada número puede girar como máximo {promotion.maxPerPhone} veces en total, incluidos los giros de "Sigue participando". El contador es acumulado histórico: aunque se agoten premios o cambie la configuración, el límite se mantiene. El servidor lo valida antes de cada giro.
          </p>
          <div><label className="label-dark">Mensaje al finalizar</label><textarea className="input-dark min-h-16" value={promotion.finishedMessage} onChange={(e) => setPromotion({ ...promotion, finishedMessage: e.target.value })} /></div>
          <button className="btn-neon" onClick={() => saveSetting.mutate({ key: 'promotion', value: promotion })} disabled={saveSetting.isPending}>
            <Save size={15} /> Guardar ajustes
          </button>
        </div>

        <div className="card-dark space-y-4">
          <h2 className="font-display text-sm font-bold">WhatsApp por defecto</h2>
          <div><label className="label-dark">Número (código país + número)</label><input className="input-dark" value={whatsapp.number} onChange={(e) => setWhatsapp({ ...whatsapp, number: e.target.value })} placeholder="573001234567" /></div>
          <div><label className="label-dark">Texto del botón</label><input className="input-dark" value={whatsapp.buttonText} onChange={(e) => setWhatsapp({ ...whatsapp, buttonText: e.target.value })} /></div>
          <div>
            <label className="label-dark">Mensaje predeterminado</label>
            <textarea className="input-dark min-h-24" value={whatsapp.message} onChange={(e) => setWhatsapp({ ...whatsapp, message: e.target.value })} />
            <p className="mt-1 text-[10px] text-white/35">Variables: [CLUB] · [PREMIO] · [CODIGO] · [NOMBRE]. Cada premio puede override estos valores.</p>
          </div>
          <button className="btn-neon" onClick={() => saveSetting.mutate({ key: 'whatsapp', value: whatsapp })} disabled={saveSetting.isPending}>
            <Save size={15} /> Guardar WhatsApp
          </button>
        </div>
      </div>

      <div className="card-dark max-w-xl space-y-4">
        <div className="flex items-center gap-2"><KeyRound size={17} className="text-[color:var(--primary)]" /><h2 className="font-display text-sm font-bold">Cambiar contraseña</h2></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label-dark">Contraseña actual</label><input className="input-dark" type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></div>
          <div><label className="label-dark">Nueva contraseña (mín. 8)</label><input className="input-dark" type="password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></div>
        </div>
        <button className="btn-neon" onClick={() => changePassword.mutate()} disabled={changePassword.isPending || !password.currentPassword || password.newPassword.length < 8}>
          {changePassword.isPending ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Actualizar contraseña
        </button>
      </div>
    </div>
  );
}
