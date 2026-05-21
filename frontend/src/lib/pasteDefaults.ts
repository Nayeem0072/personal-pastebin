const LANG_KEY  = "paste_default_language";
const PRIV_KEY  = "paste_default_privacy";
const GROUP_KEY = "paste_default_group_id";

export const getDefaultLanguage = () => localStorage.getItem(LANG_KEY) ?? "plaintext";
export const setDefaultLanguage = (v: string) => localStorage.setItem(LANG_KEY, v);
export const getDefaultPrivacy  = () => localStorage.getItem(PRIV_KEY) ?? "public";
export const setDefaultPrivacy  = (v: string) => localStorage.setItem(PRIV_KEY, v);

export const getDefaultGroupId = (): number | null => {
  const v = localStorage.getItem(GROUP_KEY);
  return v !== null ? Number(v) : null;
};
export const setDefaultGroupId = (id: number | null): void => {
  if (id === null) localStorage.removeItem(GROUP_KEY);
  else localStorage.setItem(GROUP_KEY, String(id));
};
