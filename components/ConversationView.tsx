"use client";

import { useState, useEffect, useRef } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useUserStore } from '@/store/userStore';
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

interface ConversationViewProps {
  chatId: string;
}

export function ConversationView({ chatId }: ConversationViewProps) {
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    getChat, 
    getChatMessages, 
    sendMessage, 
    markMessagesAsRead,
    deleteMessage,
    deleteChat,
    editMessage,
    getMessageEditHistory 
  } = useMessageStore();
  
  const getUserProfile = useUserStore(state => state.getUserProfile);
  
  const chat = getChat(chatId);
  const messages = getChatMessages(chatId);
  
  // Get other participant's address (for display purposes)
  const currentUserAddress = localStorage.getItem('walletAddress') || '';
  const otherParticipantAddress = chat?.participants.find(p => p !== currentUserAddress) || currentUserAddress; // Default to current user if no other participant
  
  // Use state for profile to avoid triggering getOrCreateUser during render
  const [otherParticipant, setOtherParticipant] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Fetch the profile in useEffect instead of during render
  useEffect(() => {
    // Fetch other participant's profile
    if (otherParticipantAddress) {
      const profile = getUserProfile(otherParticipantAddress);
      setOtherParticipant(profile);
    }

    // Fetch current user's profile for self-messaging cases
    if (currentUserAddress) {
      const userProfile = getUserProfile(currentUserAddress);
      setCurrentUserProfile(userProfile);
    }
  }, [otherParticipantAddress, currentUserAddress, getUserProfile]);
  
  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (chatId) {
      markMessagesAsRead(chatId);
    }
  }, [chatId, markMessagesAsRead]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
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
        chatId,
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
  
  const getDisplayName = (address: string) => {
    if (address === currentUserAddress) return 'You';
    
    const profile = getUserProfile(address);
    return profile?.displayName || profile?.username || address.substring(0, 8) + '...';
  };
  
  // Group messages by date
  const messagesByDate: { [date: string]: typeof messages } = {};
  messages.forEach(message => {
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
  const displayProfile = isSelfConversation ? currentUserProfile : otherParticipant;
  
  if (!chat) return <div className="p-4">Chat not found</div>;
  
  // Gather all image media items for the lightbox
  const allImageItems = messages
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
      editMessage(chatId, editingMessageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
    }
  };
  
  // Handle message deletion
  const handleDeleteMessage = () => {
    if (confirmDeleteMessage) {
      deleteMessage(chatId, confirmDeleteMessage);
      setConfirmDeleteMessage(null);
    }
  };
  
  // Handle chat deletion
  const handleDeleteChat = () => {
    if (confirmDeleteChat) {
      deleteChat(chatId);
      setConfirmDeleteChat(false);
    }
  };
  
  // Get message edit history
  const getHistoryForMessage = (messageId: string) => {
    return getMessageEditHistory(chatId, messageId);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat header with options */}
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar>
          <AvatarImage 
            src={displayProfile?.profileImageCID ? 
              `https://ipfs.io/ipfs/${displayProfile.profileImageCID}` : 
              undefined
            } 
          />
          <AvatarFallback>
            {displayProfile?.displayName?.[0] || 
              displayProfile?.username?.[0] || 
              otherParticipantAddress[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">
            {displayProfile?.displayName || 
              displayProfile?.username || 
              otherParticipantAddress.substring(0, 8) + '...'}
          </h3>
          {displayProfile?.username && (
            <p className="text-sm text-muted-foreground">
              @{displayProfile.username}
            </p>
          )}
        </div>
        
        {/* Add chat options menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDeleteChat(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
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
      
      {/* Messages area with edit support */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messagesByDate).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {date === new Date().toDateString() ? 'Today' : date}
              </span>
            </div>
            
            {dateMessages.map((message) => {
              const isCurrentUser = message.senderAddress === currentUserAddress;
              const messageClasses = isCurrentUser 
                ? "ml-auto bg-primary text-primary-foreground" 
                : "mr-auto bg-muted";
              
              // Show edit interface if this message is being edited
              if (isCurrentUser && editingMessageId === message.id) {
                return (
                  <div 
                    key={message.id} 
                    className="ml-auto max-w-[80%]"
                  >
                    <div className="bg-primary text-primary-foreground rounded-lg p-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] bg-background text-foreground border rounded mb-2"
                        placeholder="Edit your message..."
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handleSaveEdit}
                          disabled={!editContent.trim()}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div 
                  key={message.id} 
                  className={`max-w-[80%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div className={`rounded-lg p-3 ${messageClasses} relative group`}>
                    <div className="break-words whitespace-pre-wrap">
                      {message.content}
                      {message.isEdited && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs ml-1 opacity-70">(edited)</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">This message was edited</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    
                    {message.mediaItems && message.mediaItems.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {message.mediaItems.map((media, idx) => {
                          const imageIndex = allImageItems.findIndex(
                            img => img.src === `https://ipfs.io/ipfs/${media.cid}`
                          );
                          
                          if (media.mimeType.startsWith('image/')) {
                            return (
                              <div 
                                key={media.cid}
                                className="relative cursor-pointer"
                                onClick={() => imageIndex >= 0 && openLightbox(imageIndex)}
                              >
                                <img 
                                  src={`https://ipfs.io/ipfs/${media.cid}`}
                                  alt="Media"
                                  className="w-full h-auto rounded-md object-cover max-h-48"
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div 
                                key={media.cid}
                                className="flex items-center justify-center p-4 border rounded-md bg-background text-center"
                              >
                                <a 
                                  href={`https://ipfs.io/ipfs/${media.cid}`} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline flex items-center gap-2"
                                >
                                  <ImageIcon size={16} />
                                  <span>View Attachment</span>
                                </a>
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                    
                    {/* Message actions for the current user's messages */}
                    {isCurrentUser && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartEdit(message.id, message.content)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit message
                            </DropdownMenuItem>
                            {message.isEdited && (
                              <DropdownMenuItem onClick={() => setShowEditHistory(message.id)}>
                                <History className="mr-2 h-4 w-4" />
                                View edit history
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setConfirmDeleteMessage(message.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${
                      isCurrentUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    {isCurrentUser && message.read && (
                      <span className="text-xs">• Read</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
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