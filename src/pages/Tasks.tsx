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
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';

// Mock data
const mockTasks = [
  { id: 1, title: 'Follow-up com João Silva', description: 'Ligar para apresentar proposta comercial', type: 'call', contact: 'João Silva', dueDate: '2026-02-02', priority: 'high', status: 'pending' },
  { id: 2, title: 'Enviar proposta para Digital Solutions', description: 'Enviar proposta comercial por email', type: 'email', contact: 'Maria Santos', dueDate: '2026-02-03', priority: 'medium', status: 'pending' },
  { id: 3, title: 'Reunião de apresentação', description: 'Reunião online para demo do produto', type: 'meeting', contact: 'Carlos Lima', dueDate: '2026-02-04', priority: 'high', status: 'pending' },
  { id: 4, title: 'Atualizar cadastro do cliente', description: 'Atualizar dados de contato', type: 'other', contact: 'Ana Oliveira', dueDate: '2026-02-01', priority: 'low', status: 'completed' },
  { id: 5, title: 'Responder mensagem WhatsApp', description: 'Cliente aguardando resposta', type: 'follow_up', contact: 'Pedro Costa', dueDate: '2026-02-02', priority: 'medium', status: 'pending' },
];

const taskTypes = [
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'meeting', label: 'Reunião', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'follow_up', label: 'Follow-up', icon: User },
  { value: 'other', label: 'Outro', icon: Circle },
];

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: '',
    contact: '',
    dueDate: '',
    priority: 'medium',
  });

  const pendingTasks = mockTasks.filter((t) => t.status === 'pending');
  const completedTasks = mockTasks.filter((t) => t.status === 'completed');
  const overdueTasks = pendingTasks.filter(
    (t) => new Date(t.dueDate) < new Date()
  );

  const handleCreateTask = () => {
    console.log('Creating task:', newTask);
    setIsDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      type: '',
      contact: '',
      dueDate: '',
      priority: 'medium',
    });
  };

  const TaskCard = ({ task }: { task: typeof mockTasks[0] }) => {
    const TypeIcon = taskTypes.find((t) => t.value === task.type)?.icon || Circle;
    const isOverdue = task.status === 'pending' && new Date(task.dueDate) < new Date();

    return (
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-destructive' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === 'completed'}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                <Badge className={priorityColors[task.priority as keyof typeof priorityColors]} variant="secondary">
                  {priorityLabels[task.priority as keyof typeof priorityLabels]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{task.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {taskTypes.find((t) => t.value === task.type)?.label}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.contact}
                </div>
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                </div>
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
                <Label htmlFor="title">Título</Label>
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
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newTask.type}
                    onValueChange={(value) => setNewTask({ ...newTask, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Input
                    id="contact"
                    value={newTask.contact}
                    onChange={(e) => setNewTask({ ...newTask, contact: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTask}>Criar Tarefa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Tasks List */}
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
          {pendingTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>
        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
