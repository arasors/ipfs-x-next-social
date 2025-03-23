"use client";

import { useEffect, useState } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useUserStore } from '@/store/userStore';
import { MessageList } from '@/components/MessageList';
import { ConversationView } from '@/components/ConversationView';
import { NewMessageButton } from '@/components/NewMessageButton';
import { AuthGuard } from '@/components/AuthGuard';
import { syncMessages } from '@/lib/syncMessages';
import { Loader2 } from 'lucide-react';

export default function MessagesPage() {
  const { chats, fetchChats, selectedChatId, selectChat } = useMessageStore();
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const fetchUserData = useUserStore((state) => state.fetchUsersByAddresses);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setIsSyncing(true);
      
      try {
        console.log('Loading messages...');
        
        // First load local data (for quick UI updates)
        await fetchChats();
        
        // Sync with server via API
        const newSyncTime = await syncMessages(lastSyncTime);
        setLastSyncTime(newSyncTime);
        
        // Get unique participant addresses from all chats
        const participantAddresses = new Set<string>();
        Object.values(chats).forEach(chat => {
          chat.participants.forEach(address => {
            participantAddresses.add(address);
          });
        });
        
        // Fetch user data for all participants
        if (participantAddresses.size > 0) {
          await fetchUserData(Array.from(participantAddresses));
        }
        
        console.log('Messages loaded successfully');
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };
    
    loadData();
    
    // Set up interval to refresh chats periodically
    const intervalId = setInterval(async () => {
      try {
        setIsSyncing(true);
        // Sync with the server and API periodically
        const newSyncTime = await syncMessages(lastSyncTime);
        setLastSyncTime(newSyncTime);
      } catch (error) {
        console.error('Error syncing messages:', error);
      } finally {
        setIsSyncing(false);
      }
    }, 30000); // Sync every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchChats, fetchUserData, lastSyncTime, chats]);
  
  return (
    <AuthGuard>
      <div className="container mx-auto p-4 h-[calc(100vh-80px)] overflow-hidden relative">
        {isSyncing && (
          <div className="absolute top-1 right-1 z-10 flex items-center bg-background/80 text-xs text-muted-foreground rounded p-1">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            <span>Syncing messages...</span>
          </div>
        )}
        
        <div className="flex h-full gap-4">
          {/* Sidebar with message list */}
          <div className="w-full sm:w-1/3 lg:w-1/4 bg-background border rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Messages</h2>
              <NewMessageButton />
            </div>
            
            <div className="flex-grow overflow-y-auto">
              <MessageList
                chats={Object.values(chats)} 
                selectedChatId={selectedChatId} 
                onSelectChat={selectChat} 
                isLoading={loading}
              />
            </div>
          </div>
          
          {/* Main conversation view */}
          <div className="hidden sm:block sm:w-2/3 lg:w-3/4 bg-background border rounded-lg overflow-hidden">
            {selectedChatId ? (
              <ConversationView chatId={selectedChatId} />
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6">
                <div>
                  <p className="text-muted-foreground text-lg mb-4">
                    Select a conversation or start a new one
                  </p>
                  <NewMessageButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 