import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Phone, PhoneOff, PhoneCall, PhoneForwarded, Mic, MicOff,
  Volume2, VolumeX, Pause, Play, X, Loader2, Clock, User
} from 'lucide-react';
import { useVoip } from '@/hooks/useVoip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CallState = 'idle' | 'dialing' | 'ringing' | 'connected' | 'on-hold' | 'ended';

interface SoftphoneProps {
  contactPhone?: string;
  contactName?: string;
  contactId?: string;
  dealId?: string;
  onCallEnd?: (callId: string) => void;
}

export function Softphone({ contactPhone, contactName, contactId, dealId, onCallEnd }: SoftphoneProps) {
  const { makeCall, registerCall } = useVoip();
  const [callState, setCallState] = useState<CallState>('idle');
  const [phoneNumber, setPhoneNumber] = useState(contactPhone || '');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get VoIP provider config
  const { data: providerConfig } = useQuery({
    queryKey: ['platform_settings', 'voip_provider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'voip_provider')
        .maybeSingle();
      if (error) throw error;
      return data?.value as Record<string, unknown> | null;
    },
  });

  const isWebRTCEnabled = providerConfig?.enabled === true && providerConfig?.provider !== 'none';

  useEffect(() => {
    if (contactPhone) setPhoneNumber(contactPhone);
  }, [contactPhone]);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleDial = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Informe o número de telefone');
      return;
    }

    if (isWebRTCEnabled) {
      // Phase 2: WebRTC call via provider
      setCallState('dialing');
      try {
        const { data, error } = await supabase.functions.invoke('voip-call', {
          body: { action: 'initiate', phoneNumber, contactId, dealId },
        });
        if (error) throw error;
        
        // Simulate connection for now (real WebRTC will use Twilio/Vonage SDK)
        setTimeout(() => setCallState('ringing'), 1000);
        setTimeout(() => setCallState('connected'), 3000);
        toast.success('Chamada iniciada via WebRTC');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao iniciar chamada WebRTC');
        setCallState('idle');
      }
    } else {
      // Phase 1 fallback: tel: link
      makeCall(phoneNumber, contactId);
      setCallState('connected');
      setCallDuration(0);
    }
  };

  const handleHangup = () => {
    setCallState('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Register the call with duration
    registerCall.mutate({
      phone_number: phoneNumber.replace(/\D/g, ''),
      contact_id: contactId,
      deal_id: dealId,
      notes: notes || undefined,
    });

    setTimeout(() => {
      setCallState('idle');
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOff(false);
      setNotes('');
    }, 2000);
  };

  const handleHold = () => {
    setCallState(callState === 'on-hold' ? 'connected' : 'on-hold');
  };

  const dialPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const stateColors: Record<CallState, string> = {
    idle: 'bg-muted',
    dialing: 'bg-yellow-500/10 border-yellow-500/30',
    ringing: 'bg-blue-500/10 border-blue-500/30',
    connected: 'bg-green-500/10 border-green-500/30',
    'on-hold': 'bg-orange-500/10 border-orange-500/30',
    ended: 'bg-red-500/10 border-red-500/30',
  };

  const stateLabels: Record<CallState, string> = {
    idle: 'Pronto',
    dialing: 'Discando...',
    ringing: 'Chamando...',
    connected: 'Em chamada',
    'on-hold': 'Em espera',
    ended: 'Encerrada',
  };

  return (
    <Card className={`w-full max-w-sm border-2 transition-colors ${stateColors[callState]}`}>
      <CardContent className="p-4 space-y-3">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Softphone</span>
          </div>
          <div className="flex items-center gap-2">
            {!isWebRTCEnabled && (
              <Badge variant="outline" className="text-xs">tel: link</Badge>
            )}
            {isWebRTCEnabled && (
              <Badge variant="default" className="text-xs bg-green-600">WebRTC</Badge>
            )}
            <Badge variant="secondary" className="text-xs">{stateLabels[callState]}</Badge>
          </div>
        </div>

        {/* Contact Info */}
        {contactName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{contactName}</span>
          </div>
        )}

        {/* Phone Input */}
        {callState === 'idle' && (
          <>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+55 11 99999-9999"
              className="text-center font-mono text-lg"
            />

            {/* Dial Pad */}
            <div className="grid grid-cols-3 gap-1">
              {dialPad.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="h-10 text-lg font-mono"
                  onClick={() => setPhoneNumber((p) => p + key)}
                >
                  {key}
                </Button>
              ))}
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={handleDial}
            >
              <Phone className="h-4 w-4" />
              Ligar
            </Button>
          </>
        )}

        {/* Active Call Controls */}
        {['dialing', 'ringing', 'connected', 'on-hold'].includes(callState) && (
          <>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-foreground">
                {phoneNumber}
              </p>
              {callState === 'connected' || callState === 'on-hold' ? (
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(callDuration)}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{stateLabels[callState]}</span>
                </div>
              )}
            </div>

            {/* Call Action Buttons */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isMuted ? 'destructive' : 'outline'}
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Desmutar' : 'Mutar'}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                variant={callState === 'on-hold' ? 'default' : 'outline'}
                size="icon"
                onClick={handleHold}
                title={callState === 'on-hold' ? 'Retomar' : 'Espera'}
              >
                {callState === 'on-hold' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>

              <Button
                variant={isSpeakerOff ? 'destructive' : 'outline'}
                size="icon"
                onClick={() => setIsSpeakerOff(!isSpeakerOff)}
                title={isSpeakerOff ? 'Ativar som' : 'Desativar som'}
              >
                {isSpeakerOff ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Notes during call */}
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações da chamada..."
              className="text-sm"
            />

            {/* Hang up */}
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={handleHangup}
            >
              <PhoneOff className="h-4 w-4" />
              Desligar
            </Button>
          </>
        )}

        {/* Ended State */}
        {callState === 'ended' && (
          <div className="text-center py-4">
            <PhoneOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Chamada encerrada</p>
            <p className="text-xs text-muted-foreground">{formatDuration(callDuration)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Floating softphone trigger for the Inbox sidebar */
export function SoftphoneTrigger({ contactPhone, contactName, contactId }: {
  contactPhone?: string;
  contactName?: string;
  contactId?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Phone className="h-3.5 w-3.5" />
          Ligar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Softphone
          contactPhone={contactPhone}
          contactName={contactName}
          contactId={contactId}
        />
      </PopoverContent>
    </Popover>
  );
}
