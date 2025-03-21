"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; 
import { useNotificationStore } from "@/store/notificationStore";
import { Notification } from "@/models/Notification";
import { Loader2 } from "lucide-react";

export function AddTestNotifications() {
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotificationStore();
  
  const handleGenerateTestNotifications = async () => {
    setLoading(true);
    
    try {
      // Get the current user's address from localStorage
      const recipientAddress = localStorage.getItem('walletAddress');
      
      if (!recipientAddress) {
        toast.error("You need to connect your wallet first");
        setLoading(false);
        return;
      }
      
      // Call the API to generate test notifications
      const response = await fetch('/api/notifications/generate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientAddress,
          count: 5, // Generate 5 test notifications
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate test notifications');
      }
      
      // Add the generated notifications to the store
      if (data.notifications && Array.isArray(data.notifications)) {
        data.notifications.forEach((notification: Notification) => {
          addNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actorAddress: notification.actorAddress,
            actorName: notification.actorName,
            recipientAddress: notification.recipientAddress,
            postId: notification.postId,
            postContentCID: notification.postContentCID,
            metadata: notification.metadata
          });
        });
        
        toast.success(`Added ${data.notifications.length} test notifications`);
      }
    } catch (error) {
      console.error('Error generating test notifications:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate test notifications');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleGenerateTestNotifications} 
      variant="outline" 
      size="sm"
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Test Notifications'
      )}
    </Button>
  );
} 