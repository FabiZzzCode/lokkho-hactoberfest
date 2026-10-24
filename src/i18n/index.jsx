import { createContext, useContext, useMemo } from 'react';
import en from './en.json';
import bn from './bn.json';

const DICTS = { en, bn };
const I18nContext = createContext({ t: (k) => k, lang: 'en' });

export function I18nProvider({ lang, children }) {
  const value = useMemo(() => {
    const dict = DICTS[lang] ?? en;
    // Fall back to English, then to the key, so a missing translation never breaks the page.
    const t = (key, vars = {}) =>
      (dict[key] ?? en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
    return { t, lang };
  }, [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export const useT = () => useContext(I18nContext);
