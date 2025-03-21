"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useMessageStore } from '@/store/messageStore';
import { useUserStore } from '@/store/userStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PenSquare } from 'lucide-react';
import { User } from '@/models/User';

// Define UserState type matching the interface in userStore.ts
interface UserState {
  users: Record<string, User>;
}

export function NewMessageButton() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { getOrCreateChat, selectChat } = useMessageStore();
  
  // Use the useCallback hook to memoize the selector function with proper typing
  const userSelector = useCallback((state: UserState): User[] => {
    const currentUserAddress = localStorage.getItem('walletAddress');
    const allUsers = Object.values(state.users);
    return allUsers.filter(user => user.address !== currentUserAddress);
  }, []);
  
  // Apply the memoized selector to useUserStore
  const userStore = useUserStore();
  const users = Object.values(userStore.users);
  const filteredUsers = search === '' 
    ? users 
    : users.filter((user: User) => {
        const searchLower = search.toLowerCase();
        return (
          (user.displayName?.toLowerCase().includes(searchLower) || false) ||
          (user.username?.toLowerCase().includes(searchLower) || false) ||
          user.address.toLowerCase().includes(searchLower)
        );
      });
      
  const handleSelectUser = (address: string) => {
    try {
      const chat = getOrCreateChat(address);
      selectChat(chat.id);
      setOpen(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PenSquare className="h-4 w-4" />
          <span className="hidden sm:inline">New Message</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        
        <Command>
          <CommandInput 
            placeholder="Search users..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map(user => (
                <CommandItem 
                  key={user.address}
                  onSelect={() => handleSelectUser(user.address)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar>
                      <AvatarImage 
                        src={user.profileImageCID ? 
                          `https://ipfs.io/ipfs/${user.profileImageCID}` : 
                          undefined
                        } 
                      />
                      <AvatarFallback>
                        {user.displayName?.[0] || user.username?.[0] || user.address[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {user.displayName || user.username || user.address.substring(0, 8) + '...'}
                      </p>
                      {user.username && (
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
} 