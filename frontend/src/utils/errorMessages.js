const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const UNSAFE_MESSAGE_PATTERN = new RegExp([
  'traceback',
  'stack trace',
  '\\bfile\\s+"',
  '\\b[A-Za-z]:\\\\',
  '\\\\backend\\\\',
  '\\\\node_modules\\\\',
  '/(app|home|users|usr|var|tmp|mnt|etc|opt|workspace)/',
  '\\b(sqlite3|sqlalchemy|psycopg2|psycopg|operationalerror|integrityerror|programmingerror|databaseerror)\\b',
  '\\b(select|insert|update|delete|alter|drop)\\s+.+\\s+(from|into|table|where)\\b'
].join('|'), 'i');

export const getSafeServerMessage = (message, fallback = DEFAULT_ERROR_MESSAGE) => {
  if (typeof message !== 'string' || !message.trim()) return fallback;
  if (UNSAFE_MESSAGE_PATTERN.test(message)) return fallback;
  return message;
};

export const getSafeApiErrorMessage = (error, fallback = DEFAULT_ERROR_MESSAGE) => {
  const status = error?.response?.status;
  if (status >= 500) return fallback;

  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail) || (detail && typeof detail === 'object')) return fallback;

  if (status === 401 && detail === 'Could not validate credentials') {
    return 'Authentication required. Please sign up or log in first.';
  }

  return getSafeServerMessage(detail, fallback);
};

export const logClientRequestFailure = (context, error) => {
  const status = error?.response?.status;
  const method = error?.config?.method?.toUpperCase();
  const url = error?.config?.url;
  console.warn(`${context}${status ? ` (status ${status})` : ''}${method && url ? `: ${method} ${url}` : ''}`);
};