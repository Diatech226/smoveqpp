import { RUNTIME_CONFIG } from '../config/runtimeConfig';

interface ApiEnvelope {
  success?: boolean;
  error?: { code?: string; message?: string } | null;
}

export interface NewsletterSubscribeResult {
  success: boolean;
  code?: string;
  message: string;
  action?: 'created' | 'reactivated' | 'already_active';
}

const NEWSLETTER_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/newsletter`;

export async function submitNewsletterSubscription(email: string, source = 'footer'): Promise<NewsletterSubscribeResult> {
  const response = await fetch(NEWSLETTER_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  }).catch(() => null);

  if (!response) {
    return {
      success: false,
      code: 'NEWSLETTER_NETWORK_ERROR',
      message: 'Le service newsletter est indisponible. Merci de réessayer.',
    };
  }

  const body = (await response.json().catch(() => null)) as (ApiEnvelope & { data?: { action?: NewsletterSubscribeResult['action']; message?: string } }) | null;

  if (!response.ok || body?.success !== true) {
    return {
      success: false,
      code: body?.error?.code || `NEWSLETTER_${response.status}`,
      message: body?.error?.message || "Impossible d'enregistrer votre inscription.",
    };
  }

  return {
    success: true,
    action: body?.data?.action,
    message:
      body?.data?.action === 'already_active'
        ? 'Cet email est déjà inscrit à la newsletter.'
        : 'Inscription newsletter confirmée.',
  };
}
