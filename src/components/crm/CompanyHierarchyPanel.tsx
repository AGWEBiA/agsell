import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, GitBranch } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function CompanyHierarchyPanel() {
  const { data: companies = [] } = useCompanies();
  const qc = useQueryClient();
  const [childId, setChildId] = useState('');
  const [parentId, setParentId] = useState('');

  const tree = useMemo(() => {
    const byParent: Record<string, any[]> = {};
    companies.forEach((c: any) => {
      const p = c.parent_company_id || 'root';
      (byParent[p] = byParent[p] || []).push(c);
    });
    return byParent;
  }, [companies]);

  const setParent = async () => {
    if (!childId) return;
    const newParent = parentId && parentId !== '__none__' ? parentId : null;
    const { error } = await supabase.from('companies').update({ parent_company_id: newParent }).eq('id', childId);
    if (error) { toast.error(error.message); return; }
    toast.success('Hierarquia atualizada');
    qc.invalidateQueries({ queryKey: ['companies'] });
    setChildId(''); setParentId('');
  };

  const renderTree = (parentKey: string, level = 0): JSX.Element[] => {
    const list = tree[parentKey] || [];
    return list.flatMap((c: any) => [
      <div key={c.id} style={{ paddingLeft: level * 24 }} className="flex items-center gap-2 py-1.5 border-b text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{c.name}</span>
        {tree[c.id]?.length > 0 && <span className="text-xs text-muted-foreground">({tree[c.id].length} filiais)</span>}
      </div>,
      ...renderTree(c.id, level + 1),
    ]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4" /> Definir Empresa-mãe</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">Empresa filha</label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Empresa-mãe (vazio = raiz)</label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="Sem matriz" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sem matriz —</SelectItem>
                  {companies.filter((c: any) => c.id !== childId).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={setParent} disabled={!childId}>Salvar Hierarquia</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Árvore de Empresas</CardTitle></CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada.</p>
          ) : renderTree('root')}
        </CardContent>
      </Card>
    </div>
  );
}
