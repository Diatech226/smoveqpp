import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import { logDebug, logWarn } from './observability';

export type SiteAnalyticsEventName =
  | 'route_viewed'
  | 'cta_clicked'
  | 'blog_article_opened'
  | 'project_detail_opened'
  | 'service_detail_opened'
  | 'contact_form_submitted';

export interface SiteAnalyticsEvent {
  name: SiteAnalyticsEventName;
  route: string;
  ctaId?: string;
  targetRoute?: string;
  entityId?: string;
  entityType?: 'blog' | 'project' | 'service' | 'contact';
  success?: boolean;
  metadata?: Record<string, unknown>;
}

const ENDPOINT = `${RUNTIME_CONFIG.apiBaseUrl}/content/public/events`;

function emitWithBeacon(payload: Record<string, unknown>): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false;
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(ENDPOINT, blob);
  } catch {
    return false;
  }
}

export function trackSiteEvent(event: SiteAnalyticsEvent): void {
  const payload = {
    ...event,
    happenedAt: new Date().toISOString(),
  };

  logDebug({ scope: 'analytics', event: event.name, details: payload });

  if (emitWithBeacon(payload)) return;

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => {
    logWarn({ scope: 'analytics', event: 'event_delivery_failed', details: { name: event.name }, error });
  });
}
