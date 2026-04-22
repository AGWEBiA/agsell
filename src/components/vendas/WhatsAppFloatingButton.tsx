import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5522992545278';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá, meu nome é [seu nome]. Estou na página da AG SELL e preciso de mais informações.')}`;

export function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-white font-semibold shadow-lg shadow-black/30 hover:bg-[#1ebe5b] transition-all hover:scale-105 group"
    >
      <MessageCircle className="h-6 w-6 fill-white stroke-white" />
      <span className="hidden sm:inline text-sm">Atendimento</span>
    </a>
  );
}
