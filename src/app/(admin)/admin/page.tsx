'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Image from 'next/image';

interface Space {
  id: string;
  name: string;
  nameEn: string | null;
  type: string;
  description: string | null;
  descriptionEn: string | null;
  pricePerHour: number;
  isActive: boolean;
  imageUrl: string | null;
}

function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('invalid-image'));
  if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('image-too-large'));
  return createImageBitmap(file).then((bitmap) => {
    const scale = Math.min(1, 1280 / bitmap.width, 800 / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('invalid-image');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('invalid-image')), 'image/jpeg', 0.78));
  }).then((blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('invalid-image'));
    reader.onerror = () => reject(new Error('invalid-image'));
    reader.readAsDataURL(blob);
  }));
}

export default function AdminPage() {
  const { t, language } = useLanguage();
  const spaceTypeLabel = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes('meeting')) return t.admin.meetingRoom;
    if (normalized.includes('desk')) return t.admin.desk;
    if (normalized.includes('office') || normalized.includes('booth')) return t.admin.privateOffice;
    return type;
  };
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState('DESK');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingImageId, setSavingImageId] = useState<string | null>(null);
  const [imageDrafts, setImageDrafts] = useState<Record<string, string>>({});
  const [translationDrafts, setTranslationDrafts] = useState<Record<string, { nameEn: string; descriptionEn: string }>>({});
  const [savingTranslationId, setSavingTranslationId] = useState<string | null>(null);

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/spaces');
      if (!res.ok) throw new Error(t.admin.loadError);
      const data = await res.json();
      setSpaces(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.admin.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/spaces')
      .then(async (res) => {
        if (!res.ok) throw new Error(t.admin.loadError);
        return res.json() as Promise<Space[]>;
      })
      .then((data) => { if (active) setSpaces(data); })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : t.admin.loadError);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t.admin.loadError]);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          nameEn,
          type,
          description,
          descriptionEn,
          imageUrl,
          pricePerHour: parseFloat(pricePerHour),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.admin.createError);
      }

      setSuccess(t.admin.createSuccess);
      setName('');
      setNameEn('');
      setDescription('');
      setDescriptionEn('');
      setImageUrl('');
      setPricePerHour('');
      fetchSpaces();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.admin.createError);
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm(t.admin.deactivateConfirm)) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/spaces/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo desactivar el espacio');
      }

      setSuccess(t.admin.deactivateSuccess);
      fetchSpaces();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.admin.deactivateError);
    }
  };

  const handleSaveImage = async (id: string) => {
    setSavingImageId(id);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/spaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageDrafts[id] ?? '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.admin.imageSaveError);
      setSuccess(t.admin.imageSaved);
      await fetchSpaces();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.admin.imageSaveError);
    } finally {
      setSavingImageId(null);
    }
  };

  const handleSaveTranslations = async (space: Space) => {
    const draft = translationDrafts[space.id] ?? {
      nameEn: space.nameEn ?? '',
      descriptionEn: space.descriptionEn ?? '',
    };
    setSavingTranslationId(space.id);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/spaces/${space.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.admin.translationSaveError);
      setSuccess(t.admin.translationSaved);
      await fetchSpaces();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.admin.translationSaveError);
    } finally {
      setSavingTranslationId(null);
    }
  };

  const handleImageFile = async (file: File | undefined, onRead: (image: string) => void) => {
    if (!file) return;
    try {
      onRead(await readImageFile(file));
    } catch (err: unknown) {
      const key = err instanceof Error ? err.message : 'invalid-image';
      setError(key === 'image-too-large' ? t.admin.imageTooLarge : t.admin.invalidImage);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          {t.admin.title}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {t.admin.subtitle}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Formulario de Creación */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 mb-4">{t.admin.create}</h2>
        <form onSubmit={handleCreateSpace} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t.admin.name}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.admin.namePlaceholder}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t.admin.nameEnglish}</label>
            <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t.admin.type}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="DESK">{t.admin.desk}</option>
              <option value="MEETING_ROOM">{t.admin.meetingRoom}</option>
              <option value="PRIVATE_OFFICE">{t.admin.privateOffice}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t.admin.price}</label>
            <input
              type="number"
              step="0.01"
              required
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              placeholder="15.00"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">{t.admin.description}</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.admin.descriptionPlaceholder}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">{t.admin.descriptionEnglish}</label>
            <textarea rows={2} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">{t.admin.imageUrl}</label>
            <input
              type="text"
              inputMode="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t.admin.imageUrlPlaceholder}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <label className="mt-2 block text-xs text-slate-400">
              {t.admin.uploadImage}
              <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(event) => void handleImageFile(event.target.files?.[0], setImageUrl)} />
            </label>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="py-3 px-6 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition shadow-lg shadow-amber-900/20 disabled:opacity-50"
            >
              {creating ? t.admin.saving : t.admin.save}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Espacios Existentes */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4">{t.admin.registered}</h2>
        {loading ? (
          <div className="text-slate-400">{t.admin.loading}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl"
              >
                {space.imageUrl && <Image src={space.imageUrl} alt={space.name} width={720} height={360} unoptimized className="mb-4 h-36 w-full rounded-xl object-cover" />}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {spaceTypeLabel(space.type)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        space.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {space.isActive ? t.admin.active : t.admin.inactive}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{language === 'en' && space.nameEn ? space.nameEn : space.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{language === 'en' && space.descriptionEn ? space.descriptionEn : space.description}</p>
                  <div className="mt-4 text-amber-400 font-bold">${space.pricePerHour} / hora</div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-medium text-slate-300">{t.admin.nameEnglish}</label>
                  <input
                    type="text"
                    value={translationDrafts[space.id]?.nameEn ?? space.nameEn ?? ''}
                    onChange={(event) => setTranslationDrafts((drafts) => ({ ...drafts, [space.id]: { nameEn: event.target.value, descriptionEn: drafts[space.id]?.descriptionEn ?? space.descriptionEn ?? '' } }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                  />
                  <label className="block text-xs font-medium text-slate-300">{t.admin.descriptionEnglish}</label>
                  <textarea
                    rows={2}
                    value={translationDrafts[space.id]?.descriptionEn ?? space.descriptionEn ?? ''}
                    onChange={(event) => setTranslationDrafts((drafts) => ({ ...drafts, [space.id]: { nameEn: drafts[space.id]?.nameEn ?? space.nameEn ?? '', descriptionEn: event.target.value } }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTranslations(space)}
                    disabled={savingTranslationId === space.id}
                    className="w-full rounded-lg border border-cyan-500/30 bg-cyan-600/20 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-50"
                  >
                    {savingTranslationId === space.id ? t.admin.saving : t.admin.saveTranslations}
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-medium text-slate-300">{t.admin.imageUrl}</label>
                  <input
                    type="text"
                    inputMode="url"
                    value={imageDrafts[space.id] ?? space.imageUrl ?? ''}
                    onChange={(event) => setImageDrafts((drafts) => ({ ...drafts, [space.id]: event.target.value }))}
                    placeholder={t.admin.imageUrlPlaceholder}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                  />
                  <label className="block text-xs text-slate-400">
                    {t.admin.uploadImage}
                    <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(event) => void handleImageFile(event.target.files?.[0], (image) => setImageDrafts((drafts) => ({ ...drafts, [space.id]: image })))} />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSaveImage(space.id)}
                    disabled={savingImageId === space.id}
                    className="w-full rounded-lg border border-cyan-500/30 bg-cyan-600/20 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-50"
                  >
                    {savingImageId === space.id ? t.admin.saving : t.admin.saveImage}
                  </button>
                </div>

                {space.isActive && (
                  <button
                    onClick={() => handleDeactivate(space.id)}
                    className="mt-4 w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold rounded-xl text-xs transition"
                  >
                    {t.admin.deactivate}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
