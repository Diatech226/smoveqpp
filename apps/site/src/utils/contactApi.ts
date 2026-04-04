import { RUNTIME_CONFIG } from '../config/runtimeConfig';

export interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  message: string;
  code?: string;
}

interface ApiEnvelope {
  success?: boolean;
  error?: { code?: string; message?: string } | null;
}

const CONTACT_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/contact`;

export async function submitContactForm(payload: ContactFormPayload): Promise<ContactSubmissionResult> {
  const response = await fetch(CONTACT_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope | null;

  if (!response.ok || body?.success !== true) {
    return {
      success: false,
      code: body?.error?.code || `CONTACT_${response.status}`,
      message: body?.error?.message || "Nous n'avons pas pu envoyer votre message. Veuillez réessayer.",
    };
  }

  return {
    success: true,
    message: 'Message envoyé avec succès. Nous vous répondrons rapidement.',
  };
}
