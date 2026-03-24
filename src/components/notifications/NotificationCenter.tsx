import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  UserPlus,
  DollarSign,
  AlertTriangle,
  Calendar,
  Zap,
  Mail,
  MessageSquare,
  WifiOff,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  Notification,
} from '@/hooks/useNotifications';

const notificationIcons: Record<string, React.ReactNode> = {
  new_lead: <UserPlus className="h-4 w-4 text-blue-500" />,
  deal_won: <DollarSign className="h-4 w-4 text-green-500" />,
  deal_lost: <DollarSign className="h-4 w-4 text-red-500" />,
  task_due: <Calendar className="h-4 w-4 text-orange-500" />,
  task_overdue: <AlertTriangle className="h-4 w-4 text-destructive" />,
  automation: <Zap className="h-4 w-4 text-purple-500" />,
  email: <Mail className="h-4 w-4 text-blue-500" />,
  whatsapp: <MessageSquare className="h-4 w-4 text-emerald-500" />,
  whatsapp_disconnected: <WifiOff className="h-4 w-4 text-destructive" />,
  system: <Bell className="h-4 w-4 text-muted-foreground" />,
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => markAsRead.mutate(notification.id)}
                onDelete={() => deleteNotification.mutate(notification.id)}
              />
            ))}
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary cursor-pointer"
              onClick={() => navigate('/notifications')}
            >
              Ver todas as notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const icon = notificationIcons[notification.type] || notificationIcons.system;

  return (
    <div
      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
        !notification.is_read ? 'bg-muted/30' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
      <div className="flex gap-1">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
