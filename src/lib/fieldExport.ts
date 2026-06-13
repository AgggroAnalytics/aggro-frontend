import { getAccessToken } from '@/auth/keycloak';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive calendar month in UTC. */
export function datePresetLastMonth(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0));
  return { dateFrom: ymd(from), dateTo: ymd(end) };
}

export function datePresetLast30Days(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);
  return { dateFrom: ymd(from), dateTo: ymd(to) };
}

export async function downloadFieldExport(params: {
  fieldId: string;
  format: 'csv' | 'geojson';
  kind: 'analytics' | 'tiles';
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090').replace(/\/$/, '');
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Нет токена авторизации' };
  }
  const q = new URLSearchParams({ format: params.format, kind: params.kind });
  if (params.format === 'csv' && params.kind === 'analytics') {
    if (params.dateFrom) q.set('date_from', params.dateFrom);
    if (params.dateTo) q.set('date_to', params.dateTo);
  }
  const url = `${base}/fields/${params.fieldId}/export?${q.toString()}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition');
    let fn = `field-export.${params.format === 'csv' ? 'csv' : 'geojson'}`;
    const m = cd?.match(/filename="([^"]+)"/);
    if (m) fn = m[1];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fn;
    a.click();
    URL.revokeObjectURL(a.href);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'export failed' };
  }
}
