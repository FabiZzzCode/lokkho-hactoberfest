import { useRef, useState } from 'react';
import { callAgent } from '../../api.js';
import { runAgent } from '../../advisor/runAgent.js';
import { MAX_QUESTION_CHARS } from '../../advisor/config.js';
import { applyProposal } from './proposals.js';
import { Card, Notice, Spinner } from '../../components/ui.jsx';
import { useT } from '../../i18n/index.jsx';

const QUICK = ['reach', 'predict', 'each', 'retake'];

function Steps({ steps }) {
  const { t } = useT();
  if (!steps.length) return null;
  return <ul className="steps" aria-label={t('advisor.steps')}>{steps.map((s, i) => <li key={i} className="chip">✓ {t(`advisor.tool.${s.tool}`)}</li>)}</ul>;
}

function Proposal({ proposal, onApply, onDismiss }) {
  const { t } = useT();
  const text = proposal.type === 'setGoal'
    ? t('advisor.proposal.goal', { goal: proposal.goalCgpa })
    : t('advisor.proposal.course', { course: proposal.name, grade: proposal.grade });
  return (
    <div className="proposal" role="group" aria-label={t('advisor.proposal.title')}>
      <p><strong>{t('advisor.proposal.title')}</strong> {text}</p>
      <div className="actions">
        <button className="btn primary small" onClick={onApply}>{t('advisor.apply')}</button>
        <button className="btn small" onClick={onDismiss}>{t('advisor.dismiss')}</button>
      </div>
    </div>
  );
}

export default function Advisor({ profile, onSave }) {
  const { t } = useT();
  const [messages, setMessages] = useState([]); // {role:'user'|'bot', text, steps, proposals, grounded, ungrounded}
  const [live, setLive] = useState(null); // steps of the running question
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const ask = async (question) => {
    const q = question.trim();
    if (!q || live) return;
    setError(null); setText('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLive([]);
    const r = await runAgent({
      question: q, language: profile.language, ctx: { profile, today: new Date() }, call: callAgent,
      onStep: (s) => setLive((l) => [...l, s]),
    });
    setLive(null);
    if (r.error) return setError(r.error.message);
    setMessages((m) => [...m, { role: 'bot', text: r.answer, steps: r.steps, proposals: r.proposals.map((p) => ({ ...p, state: 'open' })), grounded: r.grounded, ungrounded: r.ungrounded }]);
  };

  const setProposalState = (mi, pi, state) =>
    setMessages((ms) => ms.map((m, i) => (i !== mi ? m : { ...m, proposals: m.proposals.map((p, j) => (j === pi ? { ...p, state } : p)) })));
  const apply = (mi, pi, proposal) => { onSave(applyProposal(profileRef.current, proposal)); setProposalState(mi, pi, 'applied'); };

  return (
    <Card title={t('advisor.title')}>
      <p className="muted">{t('advisor.intro')}</p>
      <div className="quick" role="group" aria-label={t('advisor.quick')}>
        {QUICK.map((k) => <button key={k} className="btn" disabled={!!live} onClick={() => ask(t(`advisor.q.${k}`))}>{t(`advisor.q.${k}`)}</button>)}
      </div>

      <div className="chat" aria-live="polite">
        {messages.length === 0 && !live && <p className="muted empty">{t('advisor.empty')}</p>}
        {messages.map((m, mi) => m.role === 'user' ? (
          <p key={mi} className="msg msg-user">{m.text}</p>
        ) : (
          <div key={mi} className="msg msg-bot">
            <Steps steps={m.steps} />
            <p className="answer">{m.text}</p>
            <p className="badge">{t('ai.label')}</p>
            {!m.grounded && <p className="chip chip-warn" role="status">⚠ {t('advisor.ungrounded', { numbers: m.ungrounded.join(', ') })}</p>}
            {m.proposals.map((p, pi) => p.state === 'open'
              ? <Proposal key={pi} proposal={p} onApply={() => apply(mi, pi, p)} onDismiss={() => setProposalState(mi, pi, 'dismissed')} />
              : <p key={pi} className="muted">{t(`advisor.${p.state}`)}</p>)}
          </div>
        ))}
        {live && (
          <div className="msg msg-bot">
            <Steps steps={live} />
            <Spinner label={t('advisor.thinking')} />
          </div>
        )}
      </div>
      {error && <Notice kind="error">{error} {t('ai.manual')}</Notice>}

      <form className="row ask" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input className="grow" maxLength={MAX_QUESTION_CHARS} aria-label={t('advisor.input')} placeholder={t('advisor.placeholder')} value={text} onChange={(e) => setText(e.target.value)} disabled={!!live} />
        <button className="btn primary" type="submit" disabled={!!live || !text.trim()}>{t('advisor.send')}</button>
      </form>
      <p className="muted small-text">{t('advisor.note')}</p>
    </Card>
  );
}
