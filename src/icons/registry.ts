// Every icon of the app. Names are literals: the Iconify Babel plugin reads this file at build time.
export const icons = {
  home: { linear: 'solar:home-2-linear', bold: 'solar:home-2-bold' },
  modules: { linear: 'solar:book-2-linear', bold: 'solar:book-2-bold' },
  schedule: { linear: 'solar:calendar-linear', bold: 'solar:calendar-bold' },
  messages: {
    linear: 'solar:chat-round-dots-linear',
    bold: 'solar:chat-round-dots-bold',
  },
  pqrs: {
    linear: 'solar:clipboard-text-linear',
    bold: 'solar:clipboard-text-bold',
  },
  more: {
    linear: 'solar:hamburger-menu-linear',
    bold: 'solar:hamburger-menu-linear',
  },
  user: { linear: 'solar:user-linear', bold: 'solar:user-bold' },
  userAdd: { linear: 'solar:user-plus-linear', bold: 'solar:user-plus-bold' },
  email: { linear: 'solar:letter-linear', bold: 'solar:letter-bold' },
  password: {
    linear: 'solar:lock-password-linear',
    bold: 'solar:lock-password-bold',
  },
  key: { linear: 'solar:key-linear', bold: 'solar:key-bold' },
  show: { linear: 'solar:eye-linear', bold: 'solar:eye-bold' },
  hide: { linear: 'solar:eye-closed-linear', bold: 'solar:eye-closed-linear' },
  signIn: { linear: 'solar:login-3-linear', bold: 'solar:login-3-bold' },
  signOut: { linear: 'solar:logout-2-linear', bold: 'solar:logout-2-bold' },
  back: {
    linear: 'solar:arrow-left-linear',
    bold: 'solar:arrow-left-linear',
  },
  copy: { linear: 'solar:copy-linear', bold: 'solar:copy-bold' },
  send: { linear: 'solar:plain-linear', bold: 'solar:plain-bold' },
  success: {
    linear: 'solar:check-circle-linear',
    bold: 'solar:check-circle-bold',
  },
  warning: {
    linear: 'solar:danger-triangle-linear',
    bold: 'solar:danger-triangle-bold',
  },
  error: {
    linear: 'solar:close-circle-linear',
    bold: 'solar:close-circle-bold',
  },
  info: {
    linear: 'solar:info-circle-linear',
    bold: 'solar:info-circle-bold',
  },
  chevronDown: {
    linear: 'solar:alt-arrow-down-linear',
    bold: 'solar:alt-arrow-down-bold',
  },
  search: {
    linear: 'solar:magnifier-linear',
    bold: 'solar:magnifier-bold',
  },
  closeCircle: {
    linear: 'solar:close-circle-linear',
    bold: 'solar:close-circle-bold',
  },
  // Decorative brand pattern only: the mdi set is allowed for these three (D-049).
  leaf: { linear: 'mdi:leaf', bold: 'mdi:leaf' },
  feather: { linear: 'mdi:feather', bold: 'mdi:feather' },
  openBook: {
    linear: 'mdi:book-open-page-variant',
    bold: 'mdi:book-open-page-variant',
  },
} as const;

export type IconName = keyof typeof icons;
