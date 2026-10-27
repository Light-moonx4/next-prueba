'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookingFormClient({ spaceId, pricePerHour }: { spaceId: string; pricePerHour: number }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cálculo estimado de horas y precio en cliente (la validación real y final ocurre en servidor)
  const getEstimatedTotal = () => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const diffHours = (endH + endM / 60) - (startH + startM / 60);
    return diffHours > 0 ? (diffHours * pricePerHour).toFixed(2) : 0;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(`${date}T${endTime}:00`);
      if (!date || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
        throw new Error(t.booking.invalidDate);
      }
      if (start <= new Date()) {
        throw new Error(t.booking.pastDate);
      }
      if (start.getTime() - Date.now() > 30 * 24 * 60 * 60 * 1000) {
        throw new Error(t.booking.tooFarAhead);
      }
      if (end <= start) {
        throw new Error(t.booking.invalidRange);
      }
      const durationHours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
      if (durationHours < 1 || durationHours > 4) {
        throw new Error(t.booking.invalidDuration);
      }
      if (start.getMinutes() !== 0 || end.getMinutes() !== 0) {
        throw new Error(t.booking.fullHoursOnly);
      }
      if (start.getHours() < 7 || end.getHours() > 21 || (end.getHours() === 21 && end.getMinutes() > 0)) {
        throw new Error(t.booking.outsideServiceHours);
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const ruleMessages: Record<string, string> = {
          BOOKING_IN_PAST: t.booking.pastDate,
          BOOKING_TOO_FAR_AHEAD: t.booking.tooFarAhead,
          BOOKING_DURATION_INVALID: t.booking.invalidDuration,
          BOOKING_NOT_FULL_HOURS: t.booking.fullHoursOnly,
          BOOKING_OUTSIDE_SERVICE_HOURS: t.booking.outsideServiceHours,
        };
        throw new Error(ruleMessages[data.code] || data.error || t.booking.invalidDate);
      }

      setSuccess(t.booking.successMsg);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.booking.invalidDate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleBooking} className="space-y-4">
      {error && <div className="p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-500/20 border border-green-500 text-green-300 rounded-lg text-sm">{success}</div>}

      <div>
        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">{t.booking.dateLabel}</label>
        <input
          type="date"
          required
          min={getLocalDateString(new Date())}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 bg-[var(--input-surface)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">{t.booking.startTimeLabel}</label>
          <input
            type="time"
            required
            min="07:00"
            max="21:00"
            step={3600}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--input-surface)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">{t.booking.endTimeLabel}</label>
          <input
            type="time"
            required
            min="08:00"
            max="21:00"
            step={3600}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--input-surface)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--surface-border)] flex justify-between items-center">
        <span className="text-sm text-[var(--muted-foreground)]">{t.booking.totalEstimated}</span>
        <span className="text-xl font-bold text-cyan-400">${getEstimatedTotal()}</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-900/20 disabled:opacity-50"
      >
        {loading ? t.booking.processingBtn : t.booking.confirmBtn}
      </button>
    </form>
  );
}
