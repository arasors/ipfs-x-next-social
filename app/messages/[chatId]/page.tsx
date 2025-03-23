"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMessageStore } from '@/store/messageStore';
import { ConversationView } from '@/components/ConversationView';
import { AuthGuard } from '@/components/AuthGuard';
import { syncMessages } from '@/lib/syncMessages';
import { MessageList } from '@/components/MessageList';
import { NewMessageButton } from '@/components/NewMessageButton';

interface MessagePageProps {
  params: {
    chatId: string;
  };
}

export default function MessagePage({ params }: MessagePageProps) {
  const { chatId } = params;
  const { selectChat, chats } = useMessageStore();
  const router = useRouter();
  
  useEffect(() => {
    const initializeChat = async () => {
      // Sync messages first to ensure we have the most recent data
      await syncMessages(Date.now() - 3600000); // Sync the last hour
      
      // Check if the chat exists
      if (chatId) {
        // If the chat exists in our store, select it
        if (chats[chatId]) {
          selectChat(chatId);
        } else {
          // If the chat doesn't exist, redirect to the main messages page
          router.push('/messages');
        }
      }
    };
    
    initializeChat();
  }, [chatId, selectChat]);
  
  return (
    <AuthGuard>
      <div className="container mx-auto p-4 h-[calc(100vh-80px)] overflow-hidden">

      <div className="flex h-full gap-4 w-full">
          {/* Sidebar with message list */}
          <div className="w-full sm:w-1/3 lg:w-1/4 bg-background border rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Messages</h2>
              <NewMessageButton />
            </div>
            
            <div className="flex-grow overflow-y-auto">
              <MessageList
                chats={Object.values(chats)} 
                selectedChatId={chatId} 
                onSelectChat={selectChat} 
                isLoading={false}
              />
            </div>
          </div>


        <div className="h-full bg-background border rounded-lg overflow-hidden flex-1">
          <ConversationView chatId={chatId} />
        </div>

        </div>
      </div>
    </AuthGuard>
  );
} 