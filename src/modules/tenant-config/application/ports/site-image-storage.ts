export type StoredImage = {
  contentType: string;
  size: number;
};

export type SiteImageStorage = {
  createUploadUrl(input: { key: string; contentType: string; size: number }): Promise<string>;
  inspect(key: string): Promise<StoredImage | null>;
  remove(key: string): Promise<void>;
};
