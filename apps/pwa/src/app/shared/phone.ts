/** 10 dígitos MX → E.164 (+52…). Si ya trae lada internacional se respeta. */
export function toE164Mx(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  return `+52${digits.slice(-10)}`;
}

export function isMxMobile(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('52'));
}

export function maskDestination(dest: string): string {
  if (dest.includes('@')) {
    const [user, domain] = dest.split('@');
    return `${user.slice(0, 2)}•••@${domain}`;
  }
  return `•••• ${dest.replace(/\D/g, '').slice(-4)}`;
}
