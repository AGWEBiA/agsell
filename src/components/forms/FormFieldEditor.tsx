import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Telefone' },
  { value: 'number', label: 'Número' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'select', label: 'Seleção' },
  { value: 'radio', label: 'Opção única (Radio)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
];

interface Props {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

interface OptionsInputProps {
  options: string[];
  onCommit: (options: string[]) => void;
}

function OptionsInput({ options, onCommit }: OptionsInputProps) {
  const [text, setText] = useState(options.join(', '));

  useEffect(() => {
    setText(options.join(', '));
  }, [options]);

  const commit = (value: string) => {
    const parsed = value.split(',').map((s) => s.trim()).filter(Boolean);
    onCommit(parsed);
  };

  return (
    <Input
      className="h-8 text-sm"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit(text);
        }
      }}
      placeholder="Opção 1, Opção 2, Opção 3"
    />
  );
}

export function FormFieldEditor({ fields, onChange }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const addField = () => {
    const index = fields.length + 1;
    onChange([...fields, { name: `field_${index}`, label: `Campo ${index}`, type: 'text', required: false }]);
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    const updated = fields.map((f, i) => i === idx ? { ...f, ...updates } : f);
    onChange(updated);
  };

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const newFields = [...fields];
    const [moved] = newFields.splice(dragIdx, 1);
    newFields.splice(targetIdx, 0, moved);
    onChange(newFields);
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Campos do Formulário</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="h-3 w-3 mr-1" />Adicionar Campo
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum campo adicionado. Clique em "Adicionar Campo".</p>
      )}

      {fields.map((field, idx) => (
        <Card
          key={idx}
          className={`border-border transition-all ${
            dragIdx === idx ? 'opacity-50' : ''
          } ${overIdx === idx && dragIdx !== idx ? 'border-primary border-dashed' : ''}`}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
        >
          <CardContent className="pt-3 pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">{field.name}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeField(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input className="h-8 text-sm" value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nome (ID)</Label>
                <Input className="h-8 text-sm" value={field.name} onChange={(e) => updateField(idx, { name: e.target.value.replace(/\s/g, '_').toLowerCase() })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={field.type} onValueChange={(v) => {
                  const updates: Partial<FormField> = { type: v };
                  if ((v === 'radio' || v === 'select' || v === 'checkbox') && (!field.options || field.options.length === 0)) {
                    updates.options = ['Opção 1', 'Opção 2', 'Opção 3'];
                  }
                  updateField(idx, updates);
                }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Placeholder</Label>
                <Input className="h-8 text-sm" value={field.placeholder || ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} />
              </div>
            </div>

            {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
              <div className="space-y-1">
                <Label className="text-xs">Opções (separadas por vírgula)</Label>
                <OptionsInput
                  options={field.options || []}
                  onCommit={(options) => updateField(idx, { options })}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={field.required || false} onCheckedChange={(c) => updateField(idx, { required: c })} />
              <Label className="text-xs">Obrigatório</Label>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
