export const ASSET_ORIGIN = "https://5i5mh6u76qnydv0j.public.blob.vercel-storage.com";

export const asset = (path: string) => `${ASSET_ORIGIN}/${path.replace(/^\/+/, "")}`;
