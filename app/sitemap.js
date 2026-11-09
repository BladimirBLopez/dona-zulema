import { SITE } from '@/lib/site';

export default function sitemap() {
  return [{ url: SITE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
