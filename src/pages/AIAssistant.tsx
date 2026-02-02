import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function AIAssistant() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold">Assistente IA</h1><p className="text-muted-foreground">IA para atendimento automatizado</p></div>
      <Card><CardContent className="pt-6 text-center py-12"><Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Assistente de IA em desenvolvimento...</p></CardContent></Card>
    </div>
  );
}
