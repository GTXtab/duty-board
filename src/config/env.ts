const CLIENT_ID = /^[\w-]+\.apps\.googleusercontent\.com$/;

/** Google features are optional, but a mistyped id must fail loudly rather than at sign-in. */
export const readGoogleClientId = (raw: string | undefined): string | null => {
  const value = raw?.trim() ?? '';
  if (value === '') return null;
  if (!CLIENT_ID.test(value)) {
    throw new Error('VITE_GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com');
  }
  return value;
};
