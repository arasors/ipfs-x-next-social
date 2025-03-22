"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMessageStore } from '@/store/messageStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, PlusCircle, Image as ImageIcon, X, MoreVertical, Edit, Trash2, History, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Lightbox, LightboxModal } from '@/components/ui/lightbox';
import { MediaPicker } from '@/components/MediaPicker';
import { uploadToIPFS } from '@/lib/ipfs-upload';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatBubble } from '@/components/ChatBubble';
import { ChatInput } from '@/components/ChatInput';
import { ContactCard } from '@/components/ContactCard';
import { BackButton } from '@/components/BackButton';
import { Loader2 } from 'lucide-react';
import { syncMessages } from '@/lib/syncMessages';
import { Message } from '@/models/Message';

type ConversationViewProps = {
  chatId?: string;
};

export function ConversationView({ chatId }: ConversationViewProps) {
  const router = useRouter();
  const params = useParams();
  const [messageContent, setMessageContent] = useState('');
  const [mediaItems, setMediaItems] = useState<{ cid: string; mimeType: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditHistory, setShowEditHistory] = useState<string | null>(null);
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState<string | null>(null);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    chats, 
    messages, 
    selectedChatId,
    selectChat,
    markMessagesAsRead,
    deleteMessage,
    deleteChat,
    editMessage,
    sendMessage,
    getMessageEditHistory
  } = useMessageStore();
  
  // Kullanıcının bilgilerini localStorage'dan alıyoruz çünkü userStore'a tam erişimimiz yok
  const userAddress = localStorage.getItem('walletAddress') || '';
  const userDisplayName = localStorage.getItem('userDisplayName') || '';
  const userAvatar = localStorage.getItem('userAvatar') || '';
  
  // Geçici olarak kullanıcı bilgisi
  const user = {
    address: userAddress,
    name: userDisplayName
  };
  
  // Geçici olarak kullanıcılar listesi
  const usersByAddress: Record<string, { address: string, name?: string, avatar?: string }> = {};
  
  // Fallback to URL param if no chatId is provided as prop
  const resolvedChatId = chatId || (params?.chatId as string);
  
  const chat = chats[resolvedChatId];
  const chatMessages = messages[resolvedChatId] || [];
  
  // Determine the recipient address (the one that isn't the current user)
  const recipientAddress = chat?.participants.find(
    (address) => user && address !== user.address
  ) || '';
  
  const recipient = usersByAddress[recipientAddress] || { address: recipientAddress };
  
  useEffect(() => {
    if (resolvedChatId && resolvedChatId !== selectedChatId) {
      selectChat(resolvedChatId);
    }
  }, [resolvedChatId, selectedChatId, selectChat]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark messages as read when the chat is viewed
    if (resolvedChatId && user) {
      const unreadMessages = chatMessages.filter(
        msg => !msg.read && msg.senderAddress !== user.address
      );
      
      if (unreadMessages.length > 0) {
        markMessagesAsRead(resolvedChatId);
        
        // Ensure messages are synced with OrbitDB after marking as read
        syncMessages(Date.now() - 60000); // Sync recent messages
      }
    }
  }, [resolvedChatId, chatMessages, user, markMessagesAsRead]);
  
  // Handle case where chat doesn't exist
  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that either text or media is present
    if (!messageContent.trim() && mediaItems.length === 0) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await sendMessage({
        chatId: resolvedChatId,
        content: messageContent.trim(),
        mediaItems: mediaItems,
      });
      
      // Reset form
      setMessageContent('');
      setMediaItems([]);
      
      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMediaPicked = async (files: File[]) => {
    setMediaPickerOpen(false);
    if (!files.length) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newMediaItems = await Promise.all(
        files.map(async (file) => {
          const result = await uploadToIPFS(file);
          return {
            cid: result.cid,
            mimeType: result.mimeType
          };
        })
      );
      
      setMediaItems([...mediaItems, ...newMediaItems]);
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Failed to upload media. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const removeMediaItem = (index: number) => {
    setMediaItems(mediaItems.filter((_, i) => i !== index));
  };
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  // Group messages by date
  const messagesByDate: { [date: string]: typeof chatMessages } = {};
  chatMessages.forEach(message => {
    const date = new Date(message.timestamp).toDateString();
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });
  
  // Helper to check if this is a self conversation (messaging yourself)
  const isSelfConversation = chat?.participants.length === 1 || 
                             (chat?.participants.length === 2 && 
                              chat.participants[0] === chat.participants[1]);

  // Use the appropriate profile based on whether this is a self conversation
  const displayProfile = isSelfConversation ? user : recipient;
  
  // Gather all image media items for the lightbox
  const allImageItems = chatMessages
    .flatMap(msg => msg.mediaItems || [])
    .filter(item => item.mimeType.startsWith('image/'))
    .map(item => ({ src: `https://ipfs.io/ipfs/${item.cid}`, alt: 'Media' }));
    
  // Handle message edit
  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };
  
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };
  
  const handleSaveEdit = () => {
    if (editingMessageId && editContent.trim()) {
      editMessage(resolvedChatId, editingMessageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
    }
  };
  
  // Handle message deletion
  const handleDeleteMessage = () => {
    if (confirmDeleteMessage) {
      deleteMessage(resolvedChatId, confirmDeleteMessage);
      setConfirmDeleteMessage(null);
    }
  };
  
  // Handle chat deletion
  const handleDeleteChat = () => {
    if (confirmDeleteChat) {
      deleteChat(resolvedChatId);
      setConfirmDeleteChat(false);
    }
  };
  
  // Get message edit history
  const getHistoryForMessage = (messageId: string) => {
    return getMessageEditHistory(resolvedChatId, messageId);
  };
  
  const isOwnMessage = (message: Message) => {
    return message.senderAddress === user.address;
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center">
        <div className="sm:hidden mr-2">
          <BackButton onClick={() => router.push('/messages')} />
        </div>
        
        {recipient ? (
          <ContactCard 
            user={recipient} 
            compact
            showStatus
          />
        ) : (
          <div className="flex items-center space-x-2">
            <div className="bg-muted w-10 h-10 rounded-full"></div>
            <div>
              <p className="font-medium">
                {recipientAddress ? `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}` : 'Unknown'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isFetchingMessages ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex justify-center py-10">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <>
            {Object.entries(messagesByDate).map(([date, dateMessages]) => (
              <div key={date} className="space-y-4">
                <div className="flex justify-center">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {date === new Date().toDateString() ? 'Today' : date}
                  </span>
                </div>
                
                {dateMessages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwnMessage(message)}
                    sender={usersByAddress[message.senderAddress]}
                  />
                ))}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <ChatInput
        chatId={resolvedChatId}
        recipientAddress={recipientAddress}
      />
      
      {/* Edit history dialog */}
      <Dialog open={showEditHistory !== null} onOpenChange={(open) => !open && setShowEditHistory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
            <DialogDescription>
              Previous versions of this message:
            </DialogDescription>
          </DialogHeader>
          {showEditHistory && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getHistoryForMessage(showEditHistory)?.map((history, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="mb-2 text-sm">{history.content}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(history.timestamp), 'PPpp')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete message confirmation dialog */}
      <Dialog open={confirmDeleteMessage !== null} onOpenChange={(open) => !open && setConfirmDeleteMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteMessage(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMessage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete chat confirmation dialog */}
      <Dialog open={confirmDeleteChat} onOpenChange={setConfirmDeleteChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entire conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteChat(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChat}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Message input area */}
      <div className="border-t p-3">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {mediaItems.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {mediaItems.map((media, index) => (
              <div key={index} className="relative">
                {media.mimeType.startsWith('image/') ? (
                  <div className="relative w-16 h-16">
                    <img 
                      src={`https://ipfs.io/ipfs/${media.cid}`} 
                      alt="Media preview" 
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeMediaItem(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 bg-muted p-2 rounded-md">
                    <ImageIcon size={16} />
                    <span className="text-xs truncate max-w-[100px]">Attachment</span>
                    <button
                      type="button"
                      onClick={() => removeMediaItem(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setMediaPickerOpen(true)}
            disabled={isSubmitting}
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
          
          <Textarea
            ref={textareaRef}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 max-h-32"
            disabled={isSubmitting}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          
          <Button 
            type="submit" 
            size="icon" 
            disabled={isSubmitting || (!messageContent.trim() && mediaItems.length === 0)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      {mediaPickerOpen && (
        <MediaPicker 
          onClose={() => setMediaPickerOpen(false)}
          onSubmit={handleMediaPicked}
          maxFiles={5}
          accept="image/*,video/*,audio/*,application/pdf"
        />
      )}
      
      {lightboxOpen && allImageItems.length > 0 && (
        <LightboxModal
          images={allImageItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </div>
  );
} 