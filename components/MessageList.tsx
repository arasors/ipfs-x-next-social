"use client";

import { useState, useEffect } from 'react';
import { Chat } from '@/models/Message';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/userStore';

interface MessageListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  isLoading?: boolean;
}

export function MessageList({ chats, selectedChatId, onSelectChat, isLoading = false }: MessageListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const getUserProfile = useUserStore(state => state.getUserProfile);
  const currentUserAddress = localStorage.getItem('walletAddress') || '';
  
  // Use state to store participant profiles
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, any>>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  // Fetch profiles in useEffect instead of during render
  useEffect(() => {
    const profiles: Record<string, any> = {};
    
    // Get current user profile for self-chats
    const userProfile = getUserProfile(currentUserAddress);
    setCurrentUserProfile(userProfile);
    
    chats.forEach(chat => {
      // Check if this is a self-chat (messaging yourself)
      const isSelfChat = 
        chat.participants.length === 1 || 
        (chat.participants.length === 2 && chat.participants[0] === chat.participants[1]);
      
      if (isSelfChat) {
        // No need to fetch again, we already have currentUserProfile
      } else {
        // Find the other participant (not the current user)
        const otherParticipant = chat.participants.find(p => p !== currentUserAddress);
        if (otherParticipant) {
          profiles[otherParticipant] = getUserProfile(otherParticipant);
        }
      }
    });
    
    setParticipantProfiles(profiles);
  }, [chats, currentUserAddress, getUserProfile]);
  
  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if this is a self-chat
    const isSelfChat = 
      chat.participants.length === 1 || 
      (chat.participants.length === 2 && chat.participants[0] === chat.participants[1]);
    
    if (isSelfChat) {
      // Search in current user's profile
      const nameMatch = 
        (currentUserProfile?.displayName?.toLowerCase().includes(searchLower)) ||
        (currentUserProfile?.username?.toLowerCase().includes(searchLower));
      
      // Check if search term is in last message
      const messageMatch = chat.lastMessage?.content.toLowerCase().includes(searchLower);
      
      return nameMatch || messageMatch;
    } else {
      // Find the other participant (not the current user)
      const otherParticipant = chat.participants.find(p => p !== currentUserAddress);
      if (!otherParticipant) return false;
      
      const profile = participantProfiles[otherParticipant];
      
      // Check if search term is in participant name
      const nameMatch = 
        (profile?.displayName?.toLowerCase().includes(searchLower)) ||
        (profile?.username?.toLowerCase().includes(searchLower));
      
      // Check if search term is in last message
      const messageMatch = chat.lastMessage?.content.toLowerCase().includes(searchLower);
      
      return nameMatch || messageMatch;
    }
  });
  
  // Sort chats by last message time
  const sortedFilteredChats = [...filteredChats].sort((a, b) => {
    const timeA = a.lastMessage?.timestamp || 0;
    const timeB = b.lastMessage?.timestamp || 0;
    return timeB - timeA;
  });
  
  // Helper to get participant name
  const getParticipantName = (chat: Chat) => {
    // Check if this is a self-chat
    const isSelfChat = 
      chat.participants.length === 1 || 
      (chat.participants.length === 2 && chat.participants[0] === chat.participants[1]);
    
    if (isSelfChat) {
      return currentUserProfile?.displayName || 
             currentUserProfile?.username || 
             "You (self)";
    }
    
    const otherParticipant = chat.participants.find(p => p !== currentUserAddress);
    if (!otherParticipant) return "Unknown";
    
    const profile = participantProfiles[otherParticipant];
    if (!profile) return otherParticipant.substring(0, 8) + '...';
    return profile.displayName || profile.username || otherParticipant.substring(0, 8) + '...';
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search messages..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="mt-4 space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-md animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted-foreground/20"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted-foreground/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (filteredChats.length === 0) {
    return (
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search messages..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <p className="text-muted-foreground mb-2">No conversations found</p>
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                Clear search
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search messages..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="divide-y">
        {sortedFilteredChats.map((chat) => {
          // Check if this is a self-chat
          const isSelfChat = 
            chat.participants.length === 1 || 
            (chat.participants.length === 2 && chat.participants[0] === chat.participants[1]);
          
          // Determine which profile to display
          const profile = isSelfChat 
            ? currentUserProfile 
            : participantProfiles[chat.participants.find(p => p !== currentUserAddress) || ''];
          
          return (
            <div 
              key={chat.id} 
              className={`p-4 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedChatId === chat.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <Avatar>
                <AvatarImage 
                  src={profile?.profileImageCID ? 
                    `https://ipfs.io/ipfs/${profile.profileImageCID}` : 
                    undefined
                  } 
                />
                <AvatarFallback>
                  {isSelfChat && <User className="h-5 w-5" />}
                  {!isSelfChat && (profile?.displayName?.[0] || profile?.username?.[0] || '?')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium truncate">
                    {isSelfChat ? 'You (self)' : getParticipantName(chat)}
                  </h3>
                  
                  {chat.lastMessage && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(chat.lastMessage.timestamp), 
                        { addSuffix: true }
                      )}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground truncate">
                    {chat.lastMessage?.content && (
                      chat.lastMessage.content.length > 30 
                        ? chat.lastMessage.content.substring(0, 30) + '...' 
                        : chat.lastMessage.content
                    )}
                  </div>
                  
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 