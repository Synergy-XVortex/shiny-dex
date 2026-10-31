import { useState, type FormEvent } from 'react';
import { useSync } from './syncContext';

const TIME_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

/** Settings section: sign-in by e-mailed code, then synchronisation status and actions. */
export function AccountSection() {
  const sync = useSync();

  return (
    <section aria-labelledby="account-title" className="flex flex-col gap-3">
      <h2 id="account-title" className="text-ink-subtle text-[13px] font-bold tracking-wider uppercase">
        Compte et synchronisation
      </h2>
      {sync.phase === 'unconfigured' ? (
        <p className="text-ink-muted text-sm">La synchronisation n'est pas configurée dans cette version de l'app.</p>
      ) : sync.phase === 'signed-out' ? (
        <SignInForm />
      ) : (
        <SignedIn />
      )}
    </section>
  );
}

function SignedIn() {
  const { phase, email, lastSyncedAt, pendingCount, errorMessage, syncNow, signOut } = useSync();

  let statusLine: string;
  if (phase === 'syncing') statusLine = 'Synchronisation en cours…';
  else if (phase === 'offline') statusLine = 'Hors ligne : les modifications seront envoyées au retour du réseau.';
  else if (phase === 'forbidden') statusLine = errorMessage ?? 'Ce compte ne peut pas modifier la collection.';
  else if (phase === 'error') statusLine = `La dernière synchronisation a échoué : ${errorMessage ?? 'erreur inconnue'}`;
  else if (lastSyncedAt) statusLine = `Synchronisé le ${TIME_FORMAT.format(lastSyncedAt)}.`;
  else statusLine = 'Pas encore synchronisé.';

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        Connecté avec <span className="font-bold break-all">{email}</span>
      </p>
      <p role="status" className={`text-sm ${phase === 'error' || phase === 'forbidden' ? 'text-ink font-semibold' : 'text-ink-muted'}`}>
        {statusLine}
        {pendingCount > 0 && phase !== 'syncing' && (
          <> {plural(pendingCount, 'modification en attente', 'modifications en attente')}.</>
        )}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={phase === 'syncing'}
          className="bg-inverse text-on-inverse h-11 cursor-pointer rounded-2xl text-[13px] font-bold disabled:cursor-default disabled:opacity-60"
        >
          Synchroniser
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="bg-surface-sunken h-11 cursor-pointer rounded-2xl text-[13px] font-bold"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function SignInForm() {
  const { requestSignIn, verifyCode } = useSync();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await requestSignIn(email.trim());
      setStep('code');
    });
  };

  const submitCode = (event: FormEvent) => {
    event.preventDefault();
    void run(() => verifyCode(email.trim(), code.trim()));
  };

  const inputClass =
    'bg-surface border-line focus:border-ink h-12 rounded-2xl border-[1.5px] px-3.5 text-base outline-none';
  const buttonClass =
    'bg-inverse text-on-inverse h-12 cursor-pointer rounded-2xl text-sm font-extrabold disabled:cursor-default disabled:opacity-60';

  return step === 'email' ? (
    <form onSubmit={submitEmail} className="flex flex-col gap-3">
      <p className="text-ink-muted text-sm">
        Connecte-toi pour retrouver tes statuts sur tous tes appareils et alimenter ta vitrine publique.
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Adresse e-mail
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>
      {error && <p role="alert" className="text-sm font-semibold">{error}</p>}
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy ? 'Envoi…' : 'Recevoir un code de connexion'}
      </button>
    </form>
  ) : (
    <form onSubmit={submitCode} className="flex flex-col gap-3">
      <p className="text-ink-muted text-sm">
        Un e-mail a été envoyé à <span className="text-ink font-bold">{email}</span>. Ouvre son lien sur cet appareil, ou
        saisis ci-dessous le code s'il en contient un.
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Code reçu par e-mail
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          className={`${inputClass} tracking-[0.3em]`}
        />
      </label>
      {error && <p role="alert" className="text-sm font-semibold">{error}</p>}
      <button type="submit" disabled={busy} className={buttonClass}>
        {busy ? 'Vérification…' : 'Se connecter'}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep('email');
          setCode('');
          setError(null);
        }}
        className="text-ink-muted h-10 cursor-pointer text-sm font-semibold underline"
      >
        Changer d'adresse
      </button>
    </form>
  );
}
