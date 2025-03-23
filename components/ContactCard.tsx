import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Check, MoreHorizontal, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserStore } from '@/store/userStore';

type ContactCardProps = {
  user: {
    name?: string;
    address: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away';
    lastSeen?: number;
    nickname?: string;
  };
  onMessageClick?: () => void;
  onProfileClick?: () => void;
  onEditNickname?: (address: string) => void;
  compact?: boolean;
  showStatus?: boolean;
  actions?: React.ReactNode;
  selected?: boolean;
};

export function ContactCard({
  user,
  onMessageClick,
  onProfileClick,
  onEditNickname,
  compact = false,
  showStatus = false,
  actions,
  selected = false,
}: ContactCardProps) {
  const { getContactNickname } = useUserStore();
  
  // Get nickname if available
  const nickname = user.nickname || getContactNickname?.(user.address);
  
  // Format user display name with nickname prioritized
  const displayName = nickname || user.name || (user.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'Unknown');
  
  // Get avatar fallback (first letter of name or address)
  const avatarFallback = ((nickname || user.name)?.charAt(0) || user.address?.charAt(0) || '?').toUpperCase();
  
  // Format last seen time if available
  const lastSeenText = user.lastSeen 
    ? formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })
    : '';
  
  // Determine status color
  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
  }[user.status || 'offline'];
  
  const handleEditNickname = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditNickname) {
      onEditNickname(user.address);
    }
  };
  
  return (
    <div 
      className={`flex items-center gap-3 w-full p-2 ${compact ? '' : 'p-3'} rounded-lg transition-colors
      ${selected ? 'bg-muted' : 'hover:bg-muted/50 cursor-pointer'}`}
      onClick={onProfileClick}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <Avatar className={compact ? "h-10 w-10" : "h-12 w-12"}>
          <AvatarImage src={user.avatar} alt={displayName} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        
        {showStatus && (
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColor}`} />
        )}
      </div>
      
      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {displayName}
            {nickname && !compact && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 text-xs text-muted-foreground">(Nickname)</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a custom nickname you set</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </p>
          
          {selected && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>
        
        {showStatus && (
          <p className="text-xs text-muted-foreground truncate">
            {user.status === 'online' ? 'Online' : lastSeenText || 'Offline'}
          </p>
        )}
        
        {user.address && !compact && (
          <p className="text-xs text-muted-foreground truncate">
            {user.address}
          </p>
        )}
      </div>
      
      {/* Action buttons */}
      {actions && (
        <div onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
      
      {/* Default actions dropdown if no custom actions provided */}
      {!actions && (onMessageClick || onEditNickname) && (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-muted rounded-full">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onMessageClick && (
                <DropdownMenuItem onClick={onMessageClick}>
                  Message
                </DropdownMenuItem>
              )}
              {onEditNickname && (
                <DropdownMenuItem onClick={handleEditNickname}>
                  <Edit className="h-4 w-4 mr-2" />
                  Set Nickname
                </DropdownMenuItem>
              )}
              {onProfileClick && (
                <DropdownMenuItem onClick={onProfileClick}>
                  View Profile
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
} 