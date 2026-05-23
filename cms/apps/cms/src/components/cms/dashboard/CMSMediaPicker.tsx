import { toMediaReferenceValue } from '../../../features/media/assetReference';
import { resolveMediaUrl } from '../../../utils/mediaResolver';
import type { MediaFile } from '../../../domain/contentSchemas';

type Props = {
  label: string;
  value: string;
  mediaFiles: MediaFile[];
  onChange: (value: string) => void;
  allowClear?: boolean;
};

export function CMSMediaPicker({ label, value, mediaFiles, onChange, allowClear = true }: Props) {
  const preview = resolveMediaUrl(value, mediaFiles);
  return (
    <div className="space-y-2">
      <label className="text-[13px] text-[#6f7f85]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2">
        <option value="">Aucun média</option>
        {mediaFiles.map((file) => (
          <option key={file.id} value={toMediaReferenceValue(file.id)}>{file.label || file.name}</option>
        ))}
      </select>
      {allowClear ? <button type="button" onClick={() => onChange('')} className="text-[12px] underline">Effacer</button> : null}
      {preview ? <img src={preview} alt={label} className="h-[90px] w-full rounded object-cover border border-[#e4edf1]" loading="lazy" /> : <p className="text-[12px] text-[#8a969b]">Aperçu indisponible</p>}
    </div>
  );
}
