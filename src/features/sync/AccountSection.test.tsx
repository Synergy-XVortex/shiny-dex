import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountSection } from './AccountSection';
import { SyncProvider } from './SyncProvider';

type AuthListener = (event: string, session: Session | null) => void;

/** Just enough of the Supabase client for the sign-in flow and a sync round. */
function fakeClient() {
  let listener: AuthListener = () => {};
  const session = { user: { email: 'clement@example.com' } } as Session;
  const emptyQuery = {
    select: () => emptyQuery,
    order: () => emptyQuery,
    limit: () => emptyQuery,
    gt: () => emptyQuery,
    then: (resolve: (value: unknown) => void) => resolve({ data: [], count: 1, error: null }),
  };
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: vi.fn((callback: AuthListener) => {
      listener = callback;
      return { data: { subscription: { unsubscribe: () => {} } } };
    }),
    signInWithOtp: vi.fn(async () => ({ error: null })),
    verifyOtp: vi.fn(async () => {
      listener('SIGNED_IN', session);
      return { error: null };
    }),
    signOut: vi.fn(async () => {
      listener('SIGNED_OUT', null);
      return { error: null };
    }),
  };
  const client = {
    auth,
    from: () => emptyQuery,
    rpc: vi.fn(async () => ({ error: null })),
  } as unknown as SupabaseClient;
  return { client, auth };
}

describe('AccountSection', () => {
  it('signs in with the e-mailed code, then shows the account', async () => {
    const user = userEvent.setup();
    const { client, auth } = fakeClient();
    render(
      <SyncProvider client={client}>
        <AccountSection />
      </SyncProvider>,
    );

    await user.type(screen.getByLabelText('Adresse e-mail'), 'clement@example.com');
    await user.click(screen.getByRole('button', { name: 'Recevoir un code de connexion' }));
    expect(auth.signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({ email: 'clement@example.com' }));

    await user.type(await screen.findByLabelText('Code reçu par e-mail'), '123456');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'clement@example.com', token: '123456', type: 'email' });

    expect(await screen.findByText('clement@example.com')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Synchronisé le'));

    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(await screen.findByLabelText('Adresse e-mail')).toBeInTheDocument();
  });

  it('explains when synchronisation is not configured', () => {
    render(
      <SyncProvider client={null}>
        <AccountSection />
      </SyncProvider>,
    );
    expect(screen.getByText(/pas configurée/)).toBeInTheDocument();
  });
});
