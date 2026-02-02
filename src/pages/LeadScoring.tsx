import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Target,
  Mail,
  MousePointerClick,
  Eye,
  FileText,
  MessageSquare,
  Globe,
  Tag,
  DollarSign,
} from 'lucide-react';

// Mock data
const scoringRules = [
  { id: 1, name: 'Email Aberto', event: 'email_opened', points: 5, isActive: true, icon: Eye },
  { id: 2, name: 'Email Clicado', event: 'email_clicked', points: 10, isActive: true, icon: MousePointerClick },
  { id: 3, name: 'Formulário Submetido', event: 'form_submitted', points: 20, isActive: true, icon: FileText },
  { id: 4, name: 'WhatsApp Respondido', event: 'whatsapp_received', points: 15, isActive: true, icon: MessageSquare },
  { id: 5, name: 'Página Visitada', event: 'page_visited', points: 3, isActive: false, icon: Globe },
  { id: 6, name: 'Tag Aplicada', event: 'tag_added', points: 8, isActive: true, icon: Tag },
  { id: 7, name: 'Compra Realizada', event: 'purchase', points: 50, isActive: true, icon: DollarSign },
];

const segments = [
  { name: 'Frio', range: '0-30', count: 245, color: 'bg-blue-500' },
  { name: 'Morno', range: '31-70', count: 156, color: 'bg-yellow-500' },
  { name: 'Quente', range: '71-100', count: 89, color: 'bg-red-500' },
];

const topLeads = [
  { name: 'João Silva', score: 92, company: 'Tech Corp' },
  { name: 'Maria Santos', score: 85, company: 'Digital Solutions' },
  { name: 'Carlos Lima', score: 78, company: 'Inovação SA' },
  { name: 'Ana Oliveira', score: 72, company: 'StartUp XYZ' },
  { name: 'Pedro Costa', score: 71, company: 'Empresa ABC' },
];

export default function LeadScoring() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Scoring</h1>
          <p className="text-muted-foreground">Configure regras de pontuação para qualificar leads</p>
        </div>
      </div>

      {/* Segments Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {segments.map((segment) => (
          <Card key={segment.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold">{segment.count}</p>
                  <p className="text-sm text-muted-foreground">Leads {segment.name}s</p>
                </div>
                <div className={`h-12 w-12 rounded-full ${segment.color} flex items-center justify-center`}>
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Score: {segment.range}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scoring Rules */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Pontuação</CardTitle>
              <CardDescription>
                Defina quantos pontos cada ação adiciona ao score do lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scoringRules.map((rule) => {
                  const Icon = rule.icon;
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          rule.isActive ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Icon className={`h-5 w-5 ${rule.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">{rule.event}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`points-${rule.id}`} className="text-sm text-muted-foreground">
                            Pontos:
                          </Label>
                          <Input
                            id={`points-${rule.id}`}
                            type="number"
                            value={rule.points}
                            className="w-20"
                            disabled={!rule.isActive}
                          />
                        </div>
                        <Switch checked={rule.isActive} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Top Leads</CardTitle>
            <CardDescription>Leads com maior pontuação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topLeads.map((lead, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  </div>
                  <Badge
                    className={lead.score >= 80 ? 'bg-red-500' : lead.score >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}
                  >
                    {lead.score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
