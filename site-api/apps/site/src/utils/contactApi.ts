import { RUNTIME_CONFIG } from '../config/runtimeConfig';

export interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  source?: string;
  contextSlug?: string;
  contextLabel?: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  message: string;
  code?: string;
}

interface ApiEnvelope {
  success?: boolean;
  data?: {
    submissionId?: string;
    message?: string;
  } | null;
  error?: { code?: string; message?: string } | null;
}

const CONTACT_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/contact`;

export async function submitContactForm(payload: ContactFormPayload): Promise<ContactSubmissionResult> {
  const response = await fetch(CONTACT_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!response) {
    return {
      success: false,
      code: 'CONTACT_NETWORK_ERROR',
      message: "Le service de contact est indisponible pour le moment. Veuillez réessayer.",
    };
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope | null;

  if (!response.ok || body?.success !== true) {
    return {
      success: false,
      code: body?.error?.code || `CONTACT_${response.status}`,
      message: body?.error?.message || "Nous n'avons pas pu envoyer votre message. Veuillez réessayer.",
    };
  }

  if (!body?.data?.submissionId) {
    return {
      success: false,
      code: 'CONTACT_PERSISTENCE_MISSING',
      message: "Votre message n'a pas pu être enregistré. Merci de réessayer.",
    };
  }

  return {
    success: true,
    message: body.data?.message || 'Message envoyé avec succès. Nous vous répondrons rapidement.',
  };
}
