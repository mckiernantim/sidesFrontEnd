import { environment } from 'src/environments/environment';

export function getFirebaseImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const bucket = environment.firebaseConfig.storageBucket;
  return `https://storage.googleapis.com/${bucket}/${path}`;
} 