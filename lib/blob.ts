import { del } from '@vercel/blob';

export async function deleteListingImage(url: string): Promise<void> {
  await del(url);
}
