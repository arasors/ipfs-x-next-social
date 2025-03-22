import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Edit, Trash2, History } from 'lucide-react';
import { Message } from '@/models/Message';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ChatBubbleProps = {
  message: Message;
  isOwn: boolean;
  sender?: {
    name?: string;
    address: string;
    avatar?: string;
  };
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onViewHistory?: (messageId: string) => void;
};

export function ChatBubble({ 
  message, 
  isOwn, 
  sender,
  onEdit,
  onDelete,
  onViewHistory
}: ChatBubbleProps) {
  const [showTime, setShowTime] = useState(false);
  
  const toggleTime = () => setShowTime(!showTime);
  
  // Format the sender's name or address
  const senderName = sender?.name || (sender?.address ? `${sender.address.slice(0, 6)}...${sender.address.slice(-4)}` : 'Unknown');
  
  // Get the first letter of the sender's name for the avatar fallback
  const avatarFallback = senderName.charAt(0).toUpperCase();
  
  // Format the timestamp
  const formattedTime = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });
  
  // Determine if the message has editable content
  const hasEditableContent = Boolean(message.content && message.content.trim());
  
  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      onClick={toggleTime}
    >
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[85%]`}>
        {/* Avatar */}
        {!isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={sender?.avatar} alt={senderName} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        )}
        
        {/* Message content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name for group chats (hidden by default) */}
          {!isOwn && (
            <span className="text-xs text-muted-foreground mb-1">{senderName}</span>
          )}
          
          {/* Message bubble */}
          <div className="flex group">
            <div
              className={`rounded-lg py-2 px-3 break-words ${
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted text-foreground rounded-bl-none'
              }`}
            >
              {/* Message content */}
              {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
              
              {/* Media attachments */}
              {message.mediaItems && message.mediaItems.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {message.mediaItems.map((media, index) => (
                    <div key={index} className="relative">
                      {media.mimeType.startsWith('image/') ? (
                        <img
                          src={`https://ipfs.io/ipfs/${media.cid}`}
                          alt="Media"
                          className="max-w-full rounded-md cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // onOpenMedia?.(index);
                          }}
                        />
                      ) : media.mimeType.startsWith('video/') ? (
                        <video
                          src={`https://ipfs.io/ipfs/${media.cid}`}
                          controls
                          className="max-w-full rounded-md"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="p-3 bg-background rounded-md">
                          <a
                            href={`https://ipfs.io/ipfs/${media.cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Attachment
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Edited indicator */}
              {message.isEdited && (
                <span className="text-xs opacity-70 ml-1">(edited)</span>
              )}
              
              {/* Message time - always visible on mobile, toggle on desktop */}
              {(showTime || window.innerWidth < 640) && (
                <div className={`text-xs mt-1 ${isOwn ? 'text-right' : ''} opacity-70`}>
                  {formattedTime}
                </div>
              )}
            </div>
            
            {/* Message actions (for own messages) */}
            {isOwn && onEdit && onDelete && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 -mr-1">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hasEditableContent && (
                      <DropdownMenuItem onClick={() => onEdit(message.id, message.content || '')}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => onDelete(message.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    
                    {message.isEdited && onViewHistory && (
                      <DropdownMenuItem onClick={() => onViewHistory(message.id)}>
                        <History className="h-4 w-4 mr-2" />
                        View edit history
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Message delivery status */}
          {isOwn && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground mt-1">
                    {message.read ? 'Read' : 'Delivered'}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {message.read ? 'Read' : 'Delivered'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
} 