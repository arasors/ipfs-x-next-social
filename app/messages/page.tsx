"use client";

import { useEffect, useState } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useUserStore } from '@/store/userStore';
import { MessageList } from '@/components/MessageList';
import { ConversationView } from '@/components/ConversationView';
import { NewMessageButton } from '@/components/NewMessageButton';
import {AuthGuard} from '@/components/AuthGuard';

export default function MessagesPage() {
  const { chats, fetchChats, selectedChatId, selectChat } = useMessageStore();
  const [loading, setLoading] = useState(true);
  
  const fetchUserData = useUserStore((state) => state.fetchUsersByAddresses);
  
  useEffect(() => {
    const loadChats = async () => {
      setLoading(true);
      try {
        await fetchChats();
        
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
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
    
    // Set up interval to refresh chats periodically
    const intervalId = setInterval(() => {
      fetchChats();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchChats, fetchUserData]);
  
  return (
    <AuthGuard>
      <div className="container mx-auto p-4 h-[calc(100vh-80px)] overflow-hidden">
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