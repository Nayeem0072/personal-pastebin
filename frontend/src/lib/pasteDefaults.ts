const LANG_KEY = "paste_default_language";
const PRIV_KEY = "paste_default_privacy";

export const getDefaultLanguage = () => localStorage.getItem(LANG_KEY) ?? "plaintext";
export const setDefaultLanguage = (v: string) => localStorage.setItem(LANG_KEY, v);
export const getDefaultPrivacy  = () => localStorage.getItem(PRIV_KEY) ?? "public";
export const setDefaultPrivacy  = (v: string) => localStorage.setItem(PRIV_KEY, v);
