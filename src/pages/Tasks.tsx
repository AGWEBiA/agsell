import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  List,
  CalendarDays,
} from 'lucide-react';
import { useTasks, useCreateTask, useCompleteTask, useUncompleteTask, type CreateTaskData, type Task } from '@/hooks/useTasks';
import { useContacts } from '@/hooks/useContacts';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const priorityLabels = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export default function Tasks() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newTask, setNewTask] = useState<CreateTaskData & { type?: string }>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    contact_id: '',
  });

  const { data: tasks = [], isLoading } = useTasks();
  const { data: contacts = [] } = useContacts();
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const overdueTasks = pendingTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  );

  const handleCreateTask = async () => {
    if (!newTask.title) return;
    await createTask.mutateAsync({
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date || undefined,
      priority: newTask.priority,
      contact_id: newTask.contact_id || undefined,
    });
    setIsDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      contact_id: '',
    });
  };

  const handleToggleComplete = async (task: Task) => {
    if (task.status === 'completed') {
      await uncompleteTask.mutateAsync(task.id);
    } else {
      await completeTask.mutateAsync(task.id);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setNewTask((prev) => ({
      ...prev,
      due_date: date.toISOString().split('T')[0],
    }));
    setIsDialogOpen(true);
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = task.status === 'pending' && task.due_date && new Date(task.due_date) < new Date();
    const contactName = task.contact ? `${task.contact.first_name} ${task.contact.last_name || ''}` : null;

    return (
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-destructive' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={() => handleToggleComplete(task)}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                {task.priority && (
                  <Badge className={priorityColors[task.priority as keyof typeof priorityColors]} variant="secondary">
                    {priorityLabels[task.priority as keyof typeof priorityLabels]}
                  </Badge>
                )}
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {contactName && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {contactName}
                  </div>
                )}
                {task.due_date && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                    {isOverdue && <AlertTriangle className="h-3 w-3" />}
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tarefas</h1>
          <p className="text-muted-foreground">Gerencie suas tarefas e lembretes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
                <DialogDescription>
                  Crie uma nova tarefa ou lembrete
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Título da tarefa"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Descrição detalhada"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Data de Vencimento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact">Contato (opcional)</Label>
                  <Select
                    value={newTask.contact_id}
                    onValueChange={(value) => setNewTask({ ...newTask, contact_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTask} disabled={createTask.isPending || !newTask.title}>
                  {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Tarefa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
                <p className="text-sm text-muted-foreground">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on view mode */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === 'calendar' ? (
        <TaskCalendar onDayClick={handleDayClick} />
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({completedTasks.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-muted-foreground">Nenhuma tarefa pendente. Clique em "Nova Tarefa" para criar.</p>
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-muted-foreground">Nenhuma tarefa concluída ainda.</p>
                </CardContent>
              </Card>
            ) : (
              completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
