import { z } from 'zod';
import { getJsonSetting } from '@/lib/settings/store';

const emailListSchema = z.array(z.string().email()).min(1);

export async function getAdminAlertRecipients(): Promise<string[]> {
  const fromSettings = await getJsonSetting<any>('notifications.admin_emails_json', null);
  if (fromSettings) {
    const parsed = emailListSchema.safeParse(fromSettings);
    if (parsed.success) return parsed.data;
  }

  const env = process.env.ADMIN_EMAILS;
  if (env) {
    const list = env
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsed = emailListSchema.safeParse(list);
    if (parsed.success) return parsed.data;
  }

  return ['ops@floristmarket.ro'];
}
