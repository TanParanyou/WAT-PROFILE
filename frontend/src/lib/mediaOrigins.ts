export type MediaSourceKind = "local" | "managed" | "external" | "invalid";

export interface ManagedMediaOriginOptions {
  allowHttp: boolean;
  requireAtLeastOne: boolean;
}

export function parseManagedMediaOrigins(
  raw: string | undefined,
  options: ManagedMediaOriginOptions,
): readonly string[] {
  const origins = new Set<string>();

  for (const entry of (raw ?? "").split(",").map((value) => value.trim()).filter(Boolean)) {
    if (entry.includes("*")) {
      throw new Error("Managed media origins cannot contain wildcards");
    }

    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      throw new Error(`Managed media origin is invalid: ${entry}`);
    }

    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error(`Managed media entry must be an origin: ${entry}`);
    }

    if (url.protocol !== "https:" && !(options.allowHttp && url.protocol === "http:")) {
      throw new Error(`Managed media origin has an unsafe protocol: ${entry}`);
    }

    origins.add(url.origin);
  }

  if (options.requireAtLeastOne && origins.size === 0) {
    throw new Error("NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS must contain at least one origin");
  }

  return [...origins];
}

export function getConfiguredManagedMediaOrigins(): readonly string[] {
  const production = process.env.NODE_ENV === "production";

  return parseManagedMediaOrigins(process.env.NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS, {
    allowHttp: !production,
    requireAtLeastOne: production,
  });
}

export function classifyMediaSource(
  source: string,
  managedOrigins = getConfiguredManagedMediaOrigins(),
): MediaSourceKind {
  if (source.startsWith("data:") || source.startsWith("blob:")) {
    return "local";
  }

  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return "invalid";
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "invalid";
  }

  return managedOrigins.includes(url.origin) ? "managed" : "external";
}
