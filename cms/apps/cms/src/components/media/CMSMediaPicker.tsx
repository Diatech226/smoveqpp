import { useMemo, useState } from 'react';
import type { MediaFile } from '../../domain/contentSchemas';
import { toMediaReferenceValue } from '../../features/media/assetReference';
import { resolveMediaUrl } from '../../utils/mediaResolver';
import { uploadMedia } from '../../api/mediaApi';

type Props = {
  mediaFiles: MediaFile[];
  value?: string;
  onChange: (reference: string) => void;
  onMediaListRefresh?: () => Promise<void>;
  label?: string;
};

export function CMSMediaPicker({ mediaFiles, value = '', onChange, onMediaListRefresh, label = 'Média' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const selected = useMemo(() => mediaFiles.find((file) => toMediaReferenceValue(file.id) === value || file.id === value), [mediaFiles, value]);
  const preview = resolveMediaUrl(value, mediaFiles);

  const onUpload = async (file?: File | null) => {
    if (!file || isUploading) return;
    setError('');
    setIsUploading(true);
    try {
      const uploaded = await uploadMedia(file, { title: file.name, alt: file.name });
      onMediaListRefresh && await onMediaListRefresh();
      onChange(toMediaReferenceValue(uploaded.id));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload média impossible.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[13px] text-[#6f7f85]">{label}</label>
      <button type="button" onClick={() => setIsOpen(true)} className="w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2 text-left text-[14px]">
        {selected ? selected.label || selected.name : 'Sélectionner un média'}
      </button>
      {preview ? <img src={preview} alt={selected?.alt || label} className="h-[100px] w-full rounded border border-[#e4edf1] object-cover" /> : null}
      {isOpen ? (
        <div className="space-y-2 rounded-[10px] border border-[#d8e4e8] bg-white p-3">
          <input type="file" onChange={(event) => { void onUpload(event.target.files?.[0]); event.currentTarget.value = ''; }} disabled={isUploading} />
          <div className="grid max-h-[220px] gap-2 overflow-auto md:grid-cols-2">
            {mediaFiles.map((file) => (
              <button key={file.id} type="button" onClick={() => { onChange(toMediaReferenceValue(file.id)); setIsOpen(false); }} className="rounded border border-[#e4edf1] p-2 text-left text-[12px]">
                <p className="truncate font-medium">{file.label || file.name}</p>
                <p className="truncate text-[#6f7f85]">{file.type} · {Math.round((file.size || 0) / 1024)} KB</p>
              </button>
            ))}
          </div>
          {error ? <p className="text-[12px] text-rose-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
