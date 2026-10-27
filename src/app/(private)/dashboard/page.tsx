'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'CONFIRMED' | 'CANCELLED';
  space: {
    name: string;
    nameEn: string | null;
    type: string;
  };
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const spaceTypeLabel = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes('meeting')) return t.spaces.types.MEETING_ROOM;
    if (normalized.includes('desk')) return t.spaces.types.DESK;
    if (normalized.includes('office') || normalized.includes('booth')) return t.spaces.types.PRIVATE_OFFICE;
    return type;
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) {
        throw new Error(t.dashboard.loadError);
      }
      const data = await res.json();
      setBookings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.dashboard.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/bookings')
      .then(async (res) => {
        if (!res.ok) throw new Error(t.dashboard.loadError);
        return res.json() as Promise<Booking[]>;
      })
      .then((data) => { if (active) setBookings(data); })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : t.dashboard.loadError);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t.dashboard.loadError]);

  const handleCancel = async (id: string) => {
    if (!confirm(t.dashboard.cancelConfirm)) return;

    setCancellingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.dashboard.cancelError);
      }

      // Actualizar lista
      fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t.dashboard.cancelError);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {t.dashboard.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Link
          href="/spaces"
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-cyan-900/20"
        >
          {t.dashboard.newBooking}
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400">{t.dashboard.loading}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-lg mb-4">{t.dashboard.empty}</p>
          <Link
            href="/spaces"
            className="text-cyan-400 hover:underline font-medium text-sm"
          >
            {t.dashboard.explore}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            const isConfirmed = booking.status === 'CONFIRMED';

            return (
              <div
                key={booking.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {spaceTypeLabel(booking.space.type)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        isConfirmed
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {booking.status === 'CONFIRMED' ? t.dashboard.confirmed : t.dashboard.cancelled}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 mb-1">
                    {language === 'en' && booking.space.nameEn ? booking.space.nameEn : booking.space.name}
                  </h3>

                  <div className="text-sm text-slate-400 space-y-1 my-4 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500">{t.dashboard.date}</span>{' '}
                      <strong className="text-slate-200">{start.toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{t.dashboard.hours}</span>{' '}
                      <strong className="text-slate-200">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{t.dashboard.total}</span>{' '}
                      <strong className="text-cyan-400">${booking.totalPrice}</strong>
                    </div>
                  </div>
                </div>

                {isConfirmed && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold rounded-xl text-sm transition disabled:opacity-50 mt-2"
                  >
                    {cancellingId === booking.id ? t.dashboard.cancelling : t.dashboard.cancel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
