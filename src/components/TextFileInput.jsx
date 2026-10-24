import { useState } from 'react';
import { useT } from '../i18n/index.jsx';

const MAX_BYTES = 200_000;

/** Reads a plain text file in the browser (nothing is uploaded) and hands its text to the page. */
export default function TextFileInput({ onText, label }) {
  const { t } = useT();
  const [err, setErr] = useState(false);
  const pick = async (file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) return setErr(true);
    setErr(false);
    onText(await file.text());
  };
  return (
    <label className="field"><span>{label ?? t('file.label')}</span>
      <input type="file" accept=".txt,.csv,.tsv,text/plain,text/csv" onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
      <small>{err ? t('file.big') : t('file.help')}</small>
    </label>
  );
}
