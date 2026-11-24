import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../services/api';
import { defaultTheme } from '../../constants';
import type { Theme } from '../../types';
import { Uploader } from './Uploader';

const sections = ['General', 'Fondos', 'Ruleta', 'Centro / Video', 'Sonidos', 'Textos'] as const;

const fontOptions = [
  'Montserrat, system-ui, sans-serif',
  'Orbitron, Montserrat, sans-serif',
  'Impact, system-ui, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
];

export function VisualEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-theme'],
    queryFn: async () => (await api.get<Theme>('/admin/settings/theme')).data,
  });
  const [form, setForm] = useState<Theme>(defaultTheme);
  const [section, setSection] = useState<(typeof sections)[number]>('General');
  const [message, setMessage] = useState('');

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async () => { await api.put('/admin/settings/theme', form); },
    onSuccess: () => {
      setMessage('✓ Cambios guardados. Recarga la página pública para verlos.');
      queryClient.invalidateQueries({ queryKey: ['wheel'] });
    },
    onError: (caught) => setMessage(`✗ ${errorMessage(caught)}`),
  });

  const update = <K extends keyof Theme>(key: K, value: Theme[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setMessage('');
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={36} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">EDITOR VISUAL</h1>
          <p className="mt-1 text-xs text-white/40">Personaliza toda la experiencia sin modificar código</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs text-white/70 transition hover:bg-white/5">
          <Eye size={15} /> Ver página pública
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card-dark">
          <div className="mb-5 flex flex-wrap gap-1 border-b border-white/10 pb-3">
            {sections.map((item) => (
              <button
                key={item}
                onClick={() => setSection(item)}
                className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${section === item ? 'bg-[color:var(--primary)]/20 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {section === 'General' && (
              <>
                <div><label className="label-dark">Nombre de la discoteca</label><input className="input-dark" value={form.clubName} onChange={(e) => update('clubName', e.target.value)} /></div>
                <div><label className="label-dark">Título principal</label><input className="input-dark" value={form.headline} onChange={(e) => update('headline', e.target.value)} /></div>
                <div><label className="label-dark">Subtítulo</label><input className="input-dark" value={form.subheadline} onChange={(e) => update('subheadline', e.target.value)} /></div>
                <Uploader label="Logo" value={form.logoUrl} onChange={(url) => update('logoUrl', url)} />
                <div>
                  <label className="label-dark">Tipografía</label>
                  <select className="input-dark" value={form.fontFamily} onChange={(e) => update('fontFamily', e.target.value)}>
                    {fontOptions.map((font) => <option key={font} value={font}>{font.split(',')[0]}</option>)}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2"><input type="checkbox" checked={form.effectsEnabled} onChange={(e) => update('effectsEnabled', e.target.checked)} /><span className="text-xs text-white/70">Efectos de iluminación</span></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={form.confettiEnabled} onChange={(e) => update('confettiEnabled', e.target.checked)} /><span className="text-xs text-white/70">Confeti al ganar</span></div>
                </div>
              </>
            )}

            {section === 'Fondos' && (
              <>
                <Uploader label="Imagen de fondo de la página" value={form.backgroundUrl} onChange={(url) => update('backgroundUrl', url)} hint="Se usa si no hay video de fondo." />
                <Uploader label="Video de fondo de la página" value={form.backgroundVideoUrl} onChange={(url) => update('backgroundVideoUrl', url)} allowVideo hint="MP4 o WEBM. Se reproduce en bucle y silenciado." />
                <Uploader label="Imagen de fondo de la ruleta" value={form.wheelBackgroundUrl} onChange={(url) => update('wheelBackgroundUrl', url)} />
              </>
            )}

            {section === 'Ruleta' && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label-dark">Color primario</label><div className="flex gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} /><input className="input-dark" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} /></div></div>
                  <div><label className="label-dark">Color secundario</label><div className="flex gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded" value={form.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} /><input className="input-dark" value={form.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} /></div></div>
                  <div><label className="label-dark">Color de acento</label><div className="flex gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} /><input className="input-dark" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} /></div></div>
                  <div><label className="label-dark">Color de la flecha</label><div className="flex gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded" value={form.pointerColor} onChange={(e) => update('pointerColor', e.target.value)} /><input className="input-dark" value={form.pointerColor} onChange={(e) => update('pointerColor', e.target.value)} /></div></div>
                  <div><label className="label-dark">Color del texto</label><div className="flex gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded" value={form.textColor} onChange={(e) => update('textColor', e.target.value)} /><input className="input-dark" value={form.textColor} onChange={(e) => update('textColor', e.target.value)} /></div></div>
                </div>
                <div><label className="label-dark">Texto del botón de giro</label><input className="input-dark" value={form.spinButtonText} onChange={(e) => update('spinButtonText', e.target.value)} /></div>
              </>
            )}

            {section === 'Centro / Video' && (
              <>
                <div className="rounded-lg border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/5 p-3 text-[11px] leading-relaxed text-white/50">
                  El centro puede mostrar una imagen o un video. El video tiene prioridad, se reproduce en bucle, sin sonido y se adapta al círculo. Mientras carga se muestra la imagen de respaldo.
                </div>
                <Uploader label="Video del centro (MP4)" value={form.wheelCenterVideoUrl} onChange={(url) => update('wheelCenterVideoUrl', url)} allowVideo />
                <Uploader label="Imagen del centro" value={form.wheelCenterImageUrl} onChange={(url) => update('wheelCenterImageUrl', url)} />
                <Uploader label="Imagen de respaldo (poster)" value={form.wheelCenterPosterUrl} onChange={(url) => update('wheelCenterPosterUrl', url)} hint="Se muestra mientras carga el video." />
                {form.wheelCenterVideoUrl && (
                  <video key={form.wheelCenterVideoUrl} src={form.wheelCenterVideoUrl} poster={form.wheelCenterPosterUrl || undefined} controls muted loop className="mx-auto aspect-square w-48 rounded-full border-4 border-white/20 object-cover" />
                )}
              </>
            )}

            {section === 'Sonidos' && (
              <>
                <Uploader label="Sonido de giro" value={form.spinSoundUrl} onChange={(url) => update('spinSoundUrl', url)} accept="audio/*" hint="Sube un archivo de audio (MP3/WAV) o pega una URL." />
                <Uploader label="Sonido de celebración" value={form.winSoundUrl} onChange={(url) => update('winSoundUrl', url)} accept="audio/*" hint="Si se deja vacío se genera un acorde con Web Audio." />
              </>
            )}

            {section === 'Textos' && (
              <>
                <div><label className="label-dark">Términos y condiciones</label><textarea className="input-dark min-h-28" value={form.termsText} onChange={(e) => update('termsText', e.target.value)} /></div>
                <div><label className="label-dark">Texto del pie de página</label><input className="input-dark" value={form.footerText} onChange={(e) => update('footerText', e.target.value)} /></div>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
            <button className="btn-neon" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar cambios
            </button>
            {message && <span className={`text-xs ${message.startsWith('✓') ? 'text-emerald-300' : 'text-red-300'}`}>{message}</span>}
          </div>
        </div>

        <div className="card-dark h-fit">
          <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-white/60">Vista previa de colores</h3>
          <div className="space-y-3">
            <div className="h-20 rounded-xl" style={{ background: `linear-gradient(120deg, ${form.primaryColor}, ${form.secondaryColor}, ${form.accentColor})` }} />
            <button className="btn-neon w-full" style={{ background: `linear-gradient(110deg, ${form.primaryColor}, ${form.accentColor})` }}>{form.spinButtonText}</button>
            <div className="rounded-lg border border-white/10 p-3 text-center font-display font-black tracking-wide" style={{ color: form.textColor, fontFamily: form.fontFamily }}>{form.clubName}</div>
            <div className="flex items-center gap-2 text-[11px] text-white/40"><span className="h-4 w-4 rounded-full" style={{ background: form.pointerColor }} /> Color del indicador</div>
          </div>
          <p className="mt-5 text-[10px] leading-relaxed text-white/30">Los cambios se guardan en la base de datos y se aplican en la página pública al recargarla.</p>
        </div>
      </div>
    </div>
  );
}
