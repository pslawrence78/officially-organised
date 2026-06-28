export const SUPABASE_URL_ENV = "VITE_SUPABASE_URL";
export const SUPABASE_PUBLISHABLE_KEY_ENV = "VITE_SUPABASE_PUBLISHABLE_KEY";

export type SupabaseConfigurationStatus = "configured" | "missing" | "invalid";

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export interface SupabaseAvailability {
  configured: boolean;
  status: SupabaseConfigurationStatus;
  label: string;
  detail: string;
  missing: string[];
}

export type EnvSource = Record<string, string | undefined>;

function readEnv(env: EnvSource = import.meta.env as unknown as EnvSource): { url?: string; publishableKey?: string } {
  return {
    url: env[SUPABASE_URL_ENV]?.trim(),
    publishableKey: env[SUPABASE_PUBLISHABLE_KEY_ENV]?.trim(),
  };
}

function isValidSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function getSupabaseConfig(env?: EnvSource): SupabaseConfig | null {
  const { url, publishableKey } = readEnv(env);
  if (!isValidSupabaseUrl(url) || !publishableKey) return null;
  return { url, publishableKey };
}

export function isSupabaseConfigured(env?: EnvSource): boolean {
  return getSupabaseConfig(env) !== null;
}

export function getSupabaseAvailability(env?: EnvSource): SupabaseAvailability {
  const { url, publishableKey } = readEnv(env);
  const missing = [
    url ? null : SUPABASE_URL_ENV,
    publishableKey ? null : SUPABASE_PUBLISHABLE_KEY_ENV,
  ].filter((value): value is string => Boolean(value));

  if (missing.length) {
    return {
      configured: false,
      status: "missing",
      label: "Not configured",
      detail: "Supabase sync is disabled. Local-first planning still works on this device.",
      missing,
    };
  }

  if (!isValidSupabaseUrl(url)) {
    return {
      configured: false,
      status: "invalid",
      label: "Invalid configuration",
      detail: "The Supabase URL must be an HTTPS project URL ending in .supabase.co.",
      missing: [],
    };
  }

  return {
    configured: true,
    status: "configured",
    label: "Configured",
    detail: "Supabase is available for sign-in foundations. Data sync is not active in this tranche.",
    missing: [],
  };
}
