'use client';

import { useState, useRef } from 'react';

interface AdminPhotoUploadProps {
  responseId: number;
  field: 'foto_1_url' | 'foto_2_url';
  currentUrl?: string | null;
  label: string;
}

export default function AdminPhotoUpload({ responseId, field, currentUrl, label }: AdminPhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // Upload to Vercel Blob
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || 'Upload mislukt');
      }
      const { url } = await uploadRes.json();

      // Save URL to database
      const patchRes = await fetch('/api/responses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: responseId, field, url }),
      });
      if (!patchRes.ok) {
        throw new Error('Opslaan in database mislukt');
      }

      setPhotoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    setError(null);

    try {
      const patchRes = await fetch('/api/responses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: responseId, field, url: null }),
      });
      if (!patchRes.ok) {
        throw new Error('Verwijderen mislukt');
      }
      setPhotoUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setUploading(false);
    }
  };

  if (photoUrl) {
    return (
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-2">{label}</p>
        <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="block group">
          <img src={photoUrl} alt={label} className="w-40 h-40 object-cover rounded-xl shadow-md group-hover:ring-2 group-hover:ring-blue-400 transition-all" />
          <span className="text-xs text-blue-600 mt-1 block group-hover:underline">Bekijk volledig</span>
        </a>
        <button
          onClick={handleRemove}
          disabled={uploading}
          className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Bezig...' : 'Verwijder foto'}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm text-slate-500 mb-2">{label}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <span className="text-sm">Uploaden...</span>
        ) : (
          <>
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs">Foto uploaden</span>
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
