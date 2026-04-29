import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomFields, useCustomFieldValues, useUpsertCustomFieldValue, type EntityType } from '@/hooks/useCustomFields';
import { Settings2, Loader2 } from 'lucide-react';

interface Props {
  entityType: EntityType;
  entityId: string;
}

export function CustomFieldsRenderer({ entityType, entityId }: Props) {
  const { data: defs, isLoading: l1 } = useCustomFields(entityType);
  const { data: values, isLoading: l2 } = useCustomFieldValues(entityType, entityId);
  const upsert = useUpsertCustomFieldValue();
  const [local, setLocal] = useState<Record<string, any>>({});

  useEffect(() => {
    if (values) {
      const map: Record<string, any> = {};
      values.forEach(v => { map[v.field_id] = v.value; });
      setLocal(map);
    }
  }, [values]);

  if (l1) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!defs || defs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Settings2 className="h-3 w-3" />
        Nenhum campo customizado · configure em Configurações &gt; CRM
      </div>
    );
  }

  const handleBlur = (fieldId: string, value: any) => {
    upsert.mutate({ fieldId, entityType, entityId, value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Campos personalizados</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {defs.map(f => (
          <div key={f.id} className="space-y-1">
            <Label className="text-xs">{f.field_label}{f.is_required && <span className="text-red-500"> *</span>}</Label>
            {(f.field_type === 'text' || f.field_type === 'url' || f.field_type === 'email') && (
              <Input className="h-8 text-sm" value={local[f.id] ?? ''}
                onChange={e => setLocal(p => ({ ...p, [f.id]: e.target.value }))}
                onBlur={e => handleBlur(f.id, e.target.value)} />
            )}
            {f.field_type === 'number' && (
              <Input type="number" className="h-8 text-sm" value={local[f.id] ?? ''}
                onChange={e => setLocal(p => ({ ...p, [f.id]: e.target.value }))}
                onBlur={e => handleBlur(f.id, Number(e.target.value) || 0)} />
            )}
            {f.field_type === 'date' && (
              <Input type="date" className="h-8 text-sm" value={local[f.id] ?? ''}
                onChange={e => setLocal(p => ({ ...p, [f.id]: e.target.value }))}
                onBlur={e => handleBlur(f.id, e.target.value)} />
            )}
            {f.field_type === 'boolean' && (
              <div className="h-8 flex items-center">
                <Switch checked={!!local[f.id]} onCheckedChange={v => { setLocal(p => ({ ...p, [f.id]: v })); handleBlur(f.id, v); }} />
              </div>
            )}
            {f.field_type === 'select' && (
              <Select value={local[f.id] ?? ''} onValueChange={v => { setLocal(p => ({ ...p, [f.id]: v })); handleBlur(f.id, v); }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {(f.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
