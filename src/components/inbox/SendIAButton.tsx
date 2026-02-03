import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendIAButtonProps {
  conversationId: string;
  contactName: string;
  lastMessages: Array<{ content: string; sender_type: string }>;
  onSendMessage: (content: string) => void;
}

export function SendIAButton({ conversationId, contactName, lastMessages, onSendMessage }: SendIAButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [editedSuggestion, setEditedSuggestion] = useState('');

  const generateSuggestion = async () => {
    setIsGenerating(true);
    try {
      const context = lastMessages.slice(-5).map(m => ({
        role: m.sender_type === 'user' ? 'assistant' : 'user',
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            ...context,
            {
              role: 'user',
              content: `Com base no histórico acima, sugira uma resposta profissional e amigável para o cliente ${contactName}. Seja conciso e direto.`,
            },
          ],
          context: {
            isAutoReply: true,
          },
        },
      });

      if (error) throw error;

      const generatedMessage = data?.message || 'Não foi possível gerar uma sugestão.';
      setSuggestion(generatedMessage);
      setEditedSuggestion(generatedMessage);
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast.error('Erro ao gerar sugestão de resposta');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!suggestion) {
      generateSuggestion();
    }
  };

  const handleSend = () => {
    if (!editedSuggestion.trim()) return;
    onSendMessage(editedSuggestion);
    setIsOpen(false);
    setSuggestion('');
    setEditedSuggestion('');
    toast.success('Mensagem enviada com SendIA!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleOpen}
          className="relative"
        >
          <Bot className="h-4 w-4" />
          <Sparkles className="h-2 w-2 absolute -top-0.5 -right-0.5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            SendIA
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </DialogTitle>
          <DialogDescription>
            Resposta inteligente gerada por IA para {contactName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Gerando sugestão inteligente...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Sugestão de resposta</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={generateSuggestion}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerar
                  </Button>
                </div>
                <Textarea
                  value={editedSuggestion}
                  onChange={(e) => setEditedSuggestion(e.target.value)}
                  placeholder="A sugestão aparecerá aqui..."
                  className="min-h-[150px] resize-none"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  💡 Você pode editar a sugestão antes de enviar. A IA usa o contexto da conversa para gerar respostas relevantes.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isGenerating || !editedSuggestion.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
