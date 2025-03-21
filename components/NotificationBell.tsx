"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import Link from "next/link";

interface NotificationBellProps {
  showIcon?: boolean;
  iconSize?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function NotificationBell({ 
  showIcon = true, 
  iconSize = 'md', 
  showLabel = false,
  className = '',
  side = "right"
}: NotificationBellProps) {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    updateLastChecked 
  } = useNotificationStore();
  
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only run on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    
    // When opening the notification panel, mark the current time
    if (isOpen) {
      updateLastChecked();
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Get icon size based on prop
  const getIconSize = () => {
    switch (iconSize) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={`relative ${className}`} disabled>
        {showIcon && <Bell className={getIconSize()} />}
        {showLabel && <span className="ml-2">Notifications</span>}
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size={showLabel ? "default" : "icon"} className={`relative ${className}`}>
          {showIcon && <Bell className={getIconSize()} />}
          {showLabel && <span className="ml-2">Notifications</span>}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="w-full sm:max-w-md p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            {notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onOpenChange={setOpen}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 px-4 text-center">
                <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            )}
          </ScrollArea>
          
          {notifications.length > 0 && (
            <SheetFooter className="border-t p-2 text-center flex justify-center">
              <Link 
                href="/notifications" 
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View all notifications
              </Link>
            </SheetFooter>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 