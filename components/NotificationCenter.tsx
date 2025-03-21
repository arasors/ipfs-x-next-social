"use client";

import { useState, useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Bell, Check, Trash2, Settings, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updateLastChecked
  } = useNotificationStore();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Bildirimler açıldığında son kontrol zamanını güncelle
  useEffect(() => {
    if (isOpen) {
      updateLastChecked();
    }
  }, [isOpen, updateLastChecked]);
  
  // Bildirim tipi için renk ve simge belirleme
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'like':
        return { icon: <Heart className="h-4 w-4 text-red-500" />, color: 'bg-red-100 dark:bg-red-900/20' };
      case 'comment':
        return { icon: <MessageSquare className="h-4 w-4 text-blue-500" />, color: 'bg-blue-100 dark:bg-blue-900/20' };
      case 'follow':
        return { icon: <UserPlus className="h-4 w-4 text-green-500" />, color: 'bg-green-100 dark:bg-green-900/20' };
      case 'mention':
        return { icon: <AtSign className="h-4 w-4 text-purple-500" />, color: 'bg-purple-100 dark:bg-purple-900/20' };
      case 'repost':
        return { icon: <Repeat className="h-4 w-4 text-indigo-500" />, color: 'bg-indigo-100 dark:bg-indigo-900/20' };
      case 'system':
        return { icon: <Info className="h-4 w-4 text-orange-500" />, color: 'bg-orange-100 dark:bg-orange-900/20' };
      default:
        return { icon: <Bell className="h-4 w-4 text-slate-500" />, color: 'bg-slate-100 dark:bg-slate-900/20' };
    }
  };
  
  // Bildirime tıklandığında ilgili sayfaya yönlendirme
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Gönderiye git
    if (notification.postId) {
      router.push(`/post/${notification.postId}`);
      setIsOpen(false);
    } 
    // Profil sayfasına git
    else if (notification.type === 'follow' && notification.actorAddress) {
      router.push(`/profile/${notification.actorAddress}`);
      setIsOpen(false);
    }
  };
  
  // Tarih formatını düzenleme
  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: tr 
    });
  };
  
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="px-1">
          <div className="flex items-center justify-between">
            <SheetTitle>Bildirimler</SheetTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={markAllAsRead} title="Tümünü okundu olarak işaretle">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={clearAllNotifications} title="Tüm bildirimleri temizle">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => router.push('/settings/notifications')} title="Bildirim ayarları">
                <Settings className="h-4 w-4" />
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="unread" className="flex-1 flex flex-col mt-2">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="unread" className="relative">
              Okunmamış
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Tümü</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="flex-1 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1">
              {unreadNotifications.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {unreadNotifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onMarkAsRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                      formatDate={formatDate}
                      getStyle={getNotificationStyle}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Okunmamış bildiriminiz yok
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="flex-1 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1">
              {notifications.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {notifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onMarkAsRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                      formatDate={formatDate}
                      getStyle={getNotificationStyle}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Henüz bildiriminiz yok
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <SheetFooter className="pt-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/notifications')}
          >
            Tüm Bildirimleri Görüntüle
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Bildirim öğesi bileşeni
function NotificationItem({ 
  notification, 
  onClick, 
  onMarkAsRead, 
  onRemove, 
  formatDate,
  getStyle
}: {
  notification: any;
  onClick: () => void;
  onMarkAsRead: () => void;
  onRemove: () => void;
  formatDate: (timestamp: number) => string;
  getStyle: (type: string) => { icon: React.ReactNode; color: string };
}) {
  const { icon, color } = getStyle(notification.type);
  
  return (
    <div 
      className={`p-3 rounded-lg border ${notification.isRead ? 'bg-background' : `${color} border-primary/10`} hover:bg-accent/50 cursor-pointer transition-colors`}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-xs text-muted-foreground">{formatDate(notification.timestamp)}</p>
            <div 
              className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {!notification.isRead && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMarkAsRead}>
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Eksik simgeler için import
import { Heart, MessageSquare, Info, UserPlus, AtSign, Repeat } from 'lucide-react'; 