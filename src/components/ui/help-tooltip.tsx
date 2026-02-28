import React from 'react';
import { HelpCircle, Info, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpTooltipProps {
  content: string;
  variant?: 'help' | 'info' | 'tip';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function HelpTooltip({ content, variant = 'help', side = 'top', className }: HelpTooltipProps) {
  const Icon = variant === 'info' ? Info : variant === 'tip' ? Lightbulb : HelpCircle;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={`inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ${className}`}>
            <Icon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-sm">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  tips?: string[];
}

export function EmptyState({ icon, title, description, action, tips }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {action}
      {tips && tips.length > 0 && (
        <div className="mt-6 bg-muted/50 rounded-lg p-4 max-w-sm w-full">
          <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
            Dicas rápidas
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 text-left">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  helpText?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, helpText, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {helpText && <HelpTooltip content={helpText} variant="info" />}
        </div>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, helpText, required, children, className }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {helpText && <HelpTooltip content={helpText} />}
      </div>
      {children}
    </div>
  );
}
