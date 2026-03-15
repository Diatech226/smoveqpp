import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import type { Project, Service } from '../domain/contentSchemas';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

const CONTENT_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/content/public`;

async function request<T>(path: string): Promise<T | null> {
  const response = await fetch(`${CONTENT_BASE_URL}${path}`);
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!body?.success || !body.data) return null;
  return body.data;
}

export async function fetchPublicProjects(): Promise<Project[] | null> {
  const data = await request<{ projects: Project[] }>('/projects');
  return data?.projects ?? null;
}

export async function fetchPublicServices(): Promise<Service[] | null> {
  const data = await request<{ services: Service[] }>('/services');
  return data?.services ?? null;
}
