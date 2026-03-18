import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GroupRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) { setStatus('error'); setError('Link inválido'); return; }

    const redirect = async () => {
      try {
        // Use fetch directly to pass slug as path param
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/group-rotator/${slug}`, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Grupo não encontrado');
        }

        const result = await res.json();
        setGroupName(result.group_name);
        setStatus('redirecting');

        // Redirect after a brief delay
        setTimeout(() => {
          window.location.href = result.redirect_url;
        }, 1500);
      } catch (e: any) {
        setStatus('error');
        setError(e.message || 'Erro ao buscar grupo');
      }
    };

    redirect();
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold">Encontrando o melhor grupo...</h1>
            <p className="text-muted-foreground">Aguarde um momento</p>
          </>
        )}
        {status === 'redirecting' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold">Você foi direcionado ao {groupName}!</h1>
            <p className="text-muted-foreground">Redirecionando para o WhatsApp...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">Ops!</h1>
            <p className="text-muted-foreground">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
