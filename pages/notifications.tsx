"use client";

import { useEffect, useState } from "react";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationItem } from "@/components/NotificationItem";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddTestNotifications } from "@/components/AddTestNotifications";

export default function NotificationsPage() {
  const { 
    notifications, 
    clearAllNotifications, 
    markAllAsRead, 
    getNotificationsByType,
    updateLastChecked 
  } = useNotificationStore();
  
  const [activeTab, setActiveTab] = useState("all");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    updateLastChecked();
  }, [updateLastChecked]);
  
  if (!mounted) {
    return null;
  }
  
  const getFilteredNotifications = () => {
    if (activeTab === "all") {
      return notifications;
    }
    return getNotificationsByType(activeTab as any);
  };
  
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <MainLayout>
      <div className="container max-w-3xl py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
            
            <AddTestNotifications />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your notifications.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearAllNotifications()}>
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="like">Likes</TabsTrigger>
            <TabsTrigger value="comment">Comments</TabsTrigger>
            <TabsTrigger value="follow">Follows</TabsTrigger>
            <TabsTrigger value="mention">Mentions</TabsTrigger>
            <TabsTrigger value="repost">Reposts</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {filteredNotifications.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="divide-y rounded-lg border">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground mt-1">
                  {activeTab === "all" 
                    ? "You don't have any notifications yet." 
                    : `You don't have any ${activeTab} notifications.`}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 