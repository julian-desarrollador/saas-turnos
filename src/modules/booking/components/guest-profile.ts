import { useSyncExternalStore } from "react";

export type GuestProfile = {
  firstName: string;
  phone: string;
};

function storageKey(slug: string): string {
  return `saas-turnos:${slug}:guest`;
}

export function writeGuestProfile(slug: string, profile: GuestProfile): void {
  window.localStorage.setItem(storageKey(slug), JSON.stringify(profile));
  window.dispatchEvent(new Event(storageKey(slug)));
}

const emptyGuest: GuestProfile = { firstName: "", phone: "" };

export function useGuestProfile(slug: string): GuestProfile {
  const raw = useSyncExternalStore(
    (notify) => {
      const key = storageKey(slug);
      const onChange = () => notify();
      window.addEventListener(key, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(key, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => window.localStorage.getItem(storageKey(slug)) ?? "",
    () => "",
  );
  return raw ? readStored(raw) : emptyGuest;
}

function readStored(raw: string): GuestProfile {
  try {
    const parsed = JSON.parse(raw) as Partial<GuestProfile>;
    return {
      firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return emptyGuest;
  }
}

export function clearGuestProfile(slug: string): void {
  window.localStorage.removeItem(storageKey(slug));
  window.dispatchEvent(new Event(storageKey(slug)));
}
