const DEFAULT_REDIRECT_PATH = "/dashboard";

export function resolveAppRedirectUrl(
  url: string | null | undefined,
  fallback = DEFAULT_REDIRECT_PATH,
  currentOrigin?: string
) {
  const fallbackPath = toAppRelativePath(fallback, currentOrigin) ?? DEFAULT_REDIRECT_PATH;

  return toAppRelativePath(url, currentOrigin) ?? fallbackPath;
}

function toAppRelativePath(value: string | null | undefined, currentOrigin?: string) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return null;
  }

  if (rawValue.startsWith("/")) {
    return rawValue.startsWith("//") ? null : rawValue;
  }

  if (!currentOrigin) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawValue);

    if (parsedUrl.origin !== currentOrigin) {
      return null;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
}
