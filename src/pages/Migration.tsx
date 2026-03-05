import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Upload, Globe, FileJson, FileSpreadsheet, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { MigrationCSVImport } from '@/components/migration/MigrationCSVImport';
import { MigrationJSONImport } from '@/components/migration/MigrationJSONImport';
import { MigrationAPIConnect } from '@/components/migration/MigrationAPIConnect';

const platforms = [
  { id: 'activecampaign', name: 'ActiveCampaign', apiSupport: true, color: 'bg-blue-500' },
  { id: 'rdstation', name: 'RD Station', apiSupport: true, color: 'bg-purple-500' },
  { id: 'sellflux', name: 'SellFlux', apiSupport: false, color: 'bg-orange-500' },
  { id: 'mailchimp', name: 'Mailchimp', apiSupport: false, color: 'bg-yellow-500' },
  { id: 'hubspot', name: 'HubSpot', apiSupport: false, color: 'bg-orange-600' },
  { id: 'other', name: 'Outra Plataforma', apiSupport: false, color: 'bg-muted' },
];

export default function Migration() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const platform = platforms.find(p => p.id === selectedPlatform);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Migração</h1>
        <p className="text-muted-foreground mt-1">
          Importe seus dados de outras plataformas para a AG Sell de forma simples e completa.
        </p>
      </div>

      {!selectedPlatform ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                De qual plataforma você quer migrar?
              </CardTitle>
              <CardDescription>
                Selecione a plataforma de origem para ver as opções de importação disponíveis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left group"
                  >
                    <div className={`h-10 w-10 rounded-lg ${p.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{p.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {p.apiSupport ? (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" /> Migração via API
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Upload className="h-3 w-3 mr-1" /> CSV / JSON
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O que pode ser migrado?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: FileSpreadsheet, label: 'Contatos & Tags', desc: 'CSV ou API automática', status: 'available' },
                  { icon: FileJson, label: 'Templates de E-mail', desc: 'HTML bruto ou JSON', status: 'available' },
                  { icon: Zap, label: 'Automações & Funis', desc: 'Estrutura JSON completa', status: 'available' },
                  { icon: Globe, label: 'Sequências de E-mail', desc: 'Steps, delays e conteúdo', status: 'available' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                    <item.icon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Disponível
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedPlatform(null)}>
            ← Voltar para seleção de plataforma
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className={`h-10 w-10 rounded-lg ${platform?.color} flex items-center justify-center text-white font-bold`}>
              {platform?.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">Migrar de {platform?.name}</h2>
              <p className="text-sm text-muted-foreground">
                Escolha o método de importação
              </p>
            </div>
          </div>

          <Tabs defaultValue={platform?.apiSupport ? 'api' : 'csv'}>
            <TabsList>
              {platform?.apiSupport && (
                <TabsTrigger value="api">
                  <Zap className="h-4 w-4 mr-1" /> Migração via API
                </TabsTrigger>
              )}
              <TabsTrigger value="csv">
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Importar CSV
              </TabsTrigger>
              <TabsTrigger value="json">
                <FileJson className="h-4 w-4 mr-1" /> Importar JSON
              </TabsTrigger>
            </TabsList>

            {platform?.apiSupport && (
              <TabsContent value="api">
                <MigrationAPIConnect platformId={selectedPlatform} platformName={platform.name} />
              </TabsContent>
            )}
            <TabsContent value="csv">
              <MigrationCSVImport platformName={platform?.name || ''} />
            </TabsContent>
            <TabsContent value="json">
              <MigrationJSONImport platformName={platform?.name || ''} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
