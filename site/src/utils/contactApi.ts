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
  ok?: boolean;
  message?: string;
  success?: boolean;
  data?: {
    submissionId?: string;
    message?: string;
  } | null;
  error?: { code?: string; message?: string } | null;
}

const CONTACT_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/contact`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePayload(payload: ContactFormPayload): ContactFormPayload {
  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || '',
    subject: payload.subject.trim(),
    message: payload.message.trim(),
    source: payload.source?.trim() || 'site',
    contextSlug: payload.contextSlug?.trim(),
    contextLabel: payload.contextLabel?.trim(),
  };
}

function validatePayload(payload: ContactFormPayload): ContactSubmissionResult | null {
  if (payload.name.length < 2) {
    return { success: false, code: 'CONTACT_INVALID_NAME', message: 'Veuillez renseigner votre nom.' };
  }

  if (!payload.email && !payload.phone) {
    return { success: false, code: 'CONTACT_MISSING_REPLY_CHANNEL', message: 'Veuillez renseigner votre email.' };
  }

  if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
    return { success: false, code: 'CONTACT_INVALID_EMAIL', message: 'Veuillez renseigner une adresse email valide.' };
  }

  if (payload.message.length < 10) {
    return { success: false, code: 'CONTACT_INVALID_MESSAGE', message: 'Votre message doit contenir au moins 10 caractères.' };
  }

  return null;
}

export async function submitContactForm(payload: ContactFormPayload): Promise<ContactSubmissionResult> {
  const normalizedPayload = normalizePayload(payload);
  const validationError = validatePayload(normalizedPayload);
  if (validationError) return validationError;

  const response = await fetch(CONTACT_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPayload),
  }).catch(() => null);

  if (!response) {
    return {
      success: false,
      code: 'CONTACT_NETWORK_ERROR',
      message: "Le service de contact est indisponible pour le moment. Veuillez réessayer.",
    };
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope | null;

  const accepted = body?.ok === true || body?.success === true;

  if (!response.ok || !accepted) {
    return {
      success: false,
      code: body?.error?.code || `CONTACT_${response.status}`,
      message: body?.error?.message || "Nous n'avons pas pu envoyer votre message. Veuillez réessayer.",
    };
  }

  if (body?.success === true && body?.ok !== true && !body?.data?.submissionId) {
    return {
      success: false,
      code: 'CONTACT_PERSISTENCE_MISSING',
      message: "Votre message n'a pas pu être enregistré. Merci de réessayer.",
    };
  }

  return {
    success: true,
    message: body.message || body.data?.message || 'Message reçu avec succès.',
  };
}
