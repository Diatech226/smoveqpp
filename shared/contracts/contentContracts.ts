import contentContracts from './contentContracts.js';

type ContentContracts = {
  SLUG_PATTERN: RegExp;
  MEDIA_REFERENCE_PREFIX: 'media:';
  normalizeSlug: (value: string | undefined, fallback?: string, defaultSlug?: string) => string;
  isValidSlug: (value: string | undefined) => boolean;
  isHttpUrl: (value: string | undefined) => boolean;
  isValidOptionalHttpUrl: (value: string | undefined) => boolean;
  isValidContentHref: (value: string | undefined) => boolean;
  isMediaReference: (value: string | undefined) => boolean;
  mediaIdFromReference: (value: string) => string;
  toMediaReference: (mediaId: string) => string;
  mediaReferenceExists: (value: string | undefined, hasMediaById: (mediaId: string) => boolean) => boolean;
  isValidMediaFieldValue: (
    value: string | undefined,
    options?: { allowInlineText?: boolean; hasMediaById?: (mediaId: string) => boolean },
  ) => boolean;
  requiredTrimmed: (value: unknown) => string;
  hasMinTrimmedLength: (value: unknown, min: number) => boolean;
  normalizeStringArray: (value: unknown) => string[];
};

const contracts = contentContracts as ContentContracts;

export const {
  SLUG_PATTERN,
  MEDIA_REFERENCE_PREFIX,
  normalizeSlug,
  isValidSlug,
  isHttpUrl,
  isValidOptionalHttpUrl,
  isValidContentHref,
  isMediaReference,
  mediaIdFromReference,
  toMediaReference,
  mediaReferenceExists,
  isValidMediaFieldValue,
  requiredTrimmed,
  hasMinTrimmedLength,
  normalizeStringArray,
} = contracts;

