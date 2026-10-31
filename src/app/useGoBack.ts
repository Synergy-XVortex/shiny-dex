import { useNavigate } from 'react-router-dom';

/**
 * Back to wherever the user came from, which keeps the list's scroll
 * position; straight to the Pokédex when the page was opened directly.
 */
export function useGoBack(): () => void {
  const navigate = useNavigate();
  return () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate('/');
  };
}
