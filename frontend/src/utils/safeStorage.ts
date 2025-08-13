// Safe storage utility for UI preferences only
// Never use for state of record - all critical data must come from APIs

export const safeStorage = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors
      }
    }
  },

  del(key: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    }
  },

  // Clear all storage (for admin/debug purposes only)
  clearAll(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage errors
      }
    }
  }
};

// Allowed UI preference keys - everything else should use APIs
export const ALLOWED_UI_KEYS = [
  'theme',
  'panelLayout',
  'dismissedTooltips',
  'uiPreferences',
  'terminalFontSize',
  'chatCollapsed'
] as const;

export type AllowedUIKey = typeof ALLOWED_UI_KEYS[number];

// Safe UI preferences helper
export const uiPrefs = {
  get(key: AllowedUIKey): string | null {
    return safeStorage.get(`ui_${key}`);
  },

  set(key: AllowedUIKey, value: string): void {
    safeStorage.set(`ui_${key}`, value);
  },

  del(key: AllowedUIKey): void {
    safeStorage.del(`ui_${key}`);
  }
};