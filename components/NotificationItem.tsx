"use client";

import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotificationStore } from "@/store/notificationStore";
import { Notification } from "@/models/Notification";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onOpenChange?: (open: boolean) => void;
}

export function NotificationItem({ notification, onOpenChange }: NotificationItemProps) {
  const { markAsRead } = useNotificationStore();
  
  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (onOpenChange) {
      onOpenChange(false);
    }
  };
  
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'repost':
        return <Heart className="h-4 w-4 text-purple-500" />;
      case 'mention':
        return <MessageCircle className="h-4 w-4 text-amber-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };
  
  const formattedTime = formatDistanceToNow(new Date(notification.timestamp), {
    addSuffix: true,
    locale: tr,
  });
  
  // Determine link based on notification type
  const getNotificationLink = () => {
    if (notification.postId) {
      return `/post/${notification.postId}`;
    }
    if (notification.type === 'follow' && notification.actorAddress) {
      return `/profile/${notification.actorAddress}`;
    }
    return '#';
  };
  
  // Get initials for avatar fallback
  const getInitials = () => {
    return notification.actorName 
      ? notification.actorName.substring(0, 2).toUpperCase() 
      : "UN";
  };
  
  return (
    <Link
      href={getNotificationLink()}
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors ${
        !notification.isRead ? "bg-muted/20" : ""
      }`}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={notification.metadata?.avatar || ""} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {notification.actorName || "Unknown user"}
          </p>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="flex-shrink-0">{getNotificationIcon()}</span>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        </div>
      </div>
      
      {!notification.isRead && (
        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </Link>
  );
} 