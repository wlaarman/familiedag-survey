import { put, del } from '@vercel/blob';

export async function uploadPhoto(
  file: File,
  folder: string = 'photos'
): Promise<string> {
  const filename = `${folder}/${Date.now()}-${file.name}`;

  const blob = await put(filename, file, {
    access: 'public',
  });

  return blob.url;
}

export async function deletePhoto(url: string): Promise<void> {
  await del(url);
}
