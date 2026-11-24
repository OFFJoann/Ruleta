import { ImagePlus, Loader2, Trash2, Video } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage } from '../../services/api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label: string;
  allowVideo?: boolean;
  accept?: string;
  hint?: string;
}

export function Uploader({ value, onChange, label, allowVideo = false, accept, hint }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await api.post<{ url: string }>('/admin/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(response.data.url);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setUploading(false);
    }
  };

  const isVideo = /\.(mp4|webm)$/i.test(value);
  const isAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(value);

  return (
    <div>
      <span className="label-dark">{label}</span>
      <div className="flex items-center gap-2">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-black/20 px-3 py-2.5 text-xs text-white/55 transition hover:border-[color:var(--primary)] hover:text-white">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : allowVideo ? <Video size={15} /> : <ImagePlus size={15} />}
          {uploading ? 'Subiendo…' : 'Seleccionar archivo'}
          <input
            type="file"
            className="sr-only"
            accept={accept ?? (allowVideo ? 'image/*,video/mp4,video/webm' : 'image/*')}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = '';
            }}
          />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="rounded-lg border border-red-400/25 bg-red-400/10 p-2.5 text-red-300 transition hover:bg-red-400/20" title="Quitar">
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <input className="input-dark mt-2 text-[11px]" placeholder="O pega una URL" value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <p className="mt-1 text-[10px] text-white/30">{hint}</p>}
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
      {value && (
        <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {isVideo ? (
            <video src={value} controls muted className="max-h-32 w-full object-contain" />
          ) : isAudio ? (
            <audio src={value} controls className="w-full p-2" />
          ) : (
            <img src={value} alt="Vista previa" className="max-h-32 w-full object-contain" />
          )}
        </div>
      )}
    </div>
  );
}
