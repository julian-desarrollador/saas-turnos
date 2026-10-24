export const brandColors = [
  "slate",
  "rose",
  "amber",
  "emerald",
  "sky",
  "violet",
  "stone",
  "zinc",
] as const;

export type BrandColor = (typeof brandColors)[number];

export type SiteProfile = {
  headline: string;
  about: string;
  brandColor: BrandColor;
  instagram: string | null;
  published: boolean;
};

export type SiteImageSlot = "logo" | "cover";

export type SiteImages = {
  logoKey: string | null;
  coverKey: string | null;
  photoKeys: string[];
};

export type SiteSnapshot = {
  tenantName: string;
  profile: SiteProfile | null;
  images: SiteImages;
  address: string | null;
  phone: string | null;
  services: {
    name: string;
    durationMinutes: number;
    priceAmount: number;
    isActive: boolean;
  }[];
  professionals: { displayName: string; isActive: boolean }[];
  hours: { dayOfWeek: number; startTime: string; endTime: string }[];
};

export type SiteStore = {
  load(tenantId: string): Promise<SiteSnapshot | null>;
  save(tenantId: string, profile: SiteProfile): Promise<void>;
  /** Devuelve la clave que ocupaba ese lugar, para borrarla del almacenamiento. */
  setImage(tenantId: string, slot: SiteImageSlot, key: string | null): Promise<string | null>;
  /** Devuelve false si la galería ya tiene `max` fotos. */
  addPhoto(tenantId: string, key: string, max: number): Promise<boolean>;
  removePhoto(tenantId: string, key: string): Promise<boolean>;
  countPhotos(tenantId: string): Promise<number>;
};
