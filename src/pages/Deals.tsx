import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  List, 
  Kanban as KanbanIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import DealsList from './DealsList';
import DealsKanban from './DealsKanban';

export default function Deals() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    const saved = localStorage.getItem('crm-deals-view-mode');
    return (saved as 'list' | 'kanban') || 'list';
  });

  useEffect(() => {
    localStorage.setItem('crm-deals-view-mode', viewMode);
  }, [viewMode]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Deals</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex border-b border-border w-full md:w-auto">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors',
              viewMode === 'list'
                ? 'border-[#c0392b] text-[#c0392b]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors',
              viewMode === 'kanban'
                ? 'border-[#c0392b] text-[#c0392b]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <KanbanIcon className="h-4 w-4" />
            Kanban
          </button>
        </div>
      </div>

      {viewMode === 'list' ? <DealsList /> : <DealsKanban />}
    </div>
  );
}
