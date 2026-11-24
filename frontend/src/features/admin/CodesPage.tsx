import { BadgeCheck, Loader2, Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage } from '../../services/api';
import { statusColors, statusLabels } from '../../constants';

interface ValidationResult {
  id: number;
  name: string;
  phone: string;
  prize_name_snapshot: string;
  code: string;
  status: string;
  created_at: string;
  redeemed_at: string | null;
  valid: boolean;
}

export function CodesPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.post<ValidationResult>('/admin/codes/validate', { code });
      setResult(response.data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  const redeem = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post<ValidationResult>('/admin/codes/redeem', { code });
      setResult(response.data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black tracking-wide">VALIDACIÓN DE CÓDIGOS</h1>
        <p className="mt-1 text-xs text-white/40">Verifica y canjea premios en la entrada de la discoteca</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
        <div className="card-dark">
          <form onSubmit={validate} className="space-y-4">
            <div>
              <label className="label-dark">Código del premio</label>
              <input
                className="input-dark font-mono text-lg uppercase tracking-widest"
                placeholder="RULETA-2026-A8F29K"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                required
              />
            </div>
            <button className="btn-neon w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Validar código
            </button>
          </form>

          {error && <p className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"><XCircle size={15} /> {error}</p>}

          {result && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className={`badge border ${statusColors[result.status] ?? ''}`}>{statusLabels[result.status] ?? result.status}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${result.valid ? 'text-emerald-300' : 'text-amber-300'}`}>
                  <BadgeCheck size={15} /> {result.valid ? 'Válido para canje' : 'No disponible'}
                </span>
              </div>
              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div><p className="text-white/35">Ganador</p><p className="mt-0.5 font-semibold text-white/85">{result.name}</p></div>
                <div><p className="text-white/35">WhatsApp</p><p className="mt-0.5 font-semibold text-white/85">{result.phone}</p></div>
                <div><p className="text-white/35">Premio</p><p className="mt-0.5 font-semibold text-white/85">{result.prize_name_snapshot}</p></div>
                <div><p className="text-white/35">Generado</p><p className="mt-0.5 text-white/60">{new Date(result.created_at).toLocaleString('es')}</p></div>
              </div>
              {result.redeemed_at && <p className="mt-3 text-[11px] text-white/40">Canjeado: {new Date(result.redeemed_at).toLocaleString('es')}</p>}
              {result.valid && (
                <button className="btn-neon mt-5 w-full" onClick={redeem} disabled={loading}>
                  <BadgeCheck size={16} /> Marcar como canjeado
                </button>
              )}
            </div>
          )}
        </div>

        <div className="card-dark h-fit">
          <h3 className="mb-3 font-display text-sm font-bold">Proceso de validación</h3>
          <ol className="space-y-3 text-xs leading-relaxed text-white/55">
            <li><span className="mr-2 font-bold text-[color:var(--primary)]">1.</span> El ganador muestra su código único desde la pantalla de premio.</li>
            <li><span className="mr-2 font-bold text-[color:var(--primary)]">2.</span> Validamos el código: se muestran sus datos y el premio.</li>
            <li><span className="mr-2 font-bold text-[color:var(--primary)]">3.</span> Al entregar el premio, se marca como canjeado.</li>
            <li><span className="mr-2 font-bold text-[color:var(--primary)]">4.</span> Un código <strong className="text-white/80">nunca</strong> puede utilizarse dos veces.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
