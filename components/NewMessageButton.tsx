"use client";

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMessageStore } from '@/store/messageStore';
import { useUserStore } from '@/store/userStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PenSquare, User as UserIcon, Plus, UserPlus } from 'lucide-react';
import { User, Contact } from '@/models/User';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// Define UserState type matching the interface in userStore.ts
interface UserState {
  users: Record<string, User>;
  currentUser: User | null;
}

export function NewMessageButton() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customNickname, setCustomNickname] = useState('');
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts');
  
  const { getOrCreateChat, selectChat } = useMessageStore();
  const { addContact, updateContactNickname } = useUserStore();
  
  // Use the useCallback hook to memoize the selector function with proper typing
  const userSelector = useCallback((state: UserState): User[] => {
    const currentUserAddress = localStorage.getItem('walletAddress');
    const allUsers = Object.values(state.users);
    return allUsers.filter(user => user.address !== currentUserAddress);
  }, []);
  
  // Apply the memoized selector to useUserStore
  const userStore = useUserStore();
  const users = Object.values(userStore.users);
  const currentUserAddress = localStorage.getItem('walletAddress');
  const currentUser = userStore.users[currentUserAddress || ''];
  const userContacts = currentUser?.contacts || {};
  
  const filteredUsers = search === '' 
    ? users 
    : users.filter((user: User) => {
        const searchLower = search.toLowerCase();
        const contact = userContacts[user.address];
        const nickname = contact?.nickname?.toLowerCase();
        
        return (
          (nickname?.includes(searchLower) || false) ||
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
      resetForm();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create conversation');
    }
  };
  
  // Validate Ethereum address
  const validateAddress = (address: string) => {
    try {
      // Check if it's a valid Ethereum address
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  };
  
  // Handle custom address input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAddress(value);
    setIsAddressValid(validateAddress(value));
  };
  
  // Handle sending message to custom address
  const handleSendToCustomAddress = () => {
    if (!isAddressValid) return;
    
    try {
      // Add as contact if nickname is provided
      if (customNickname.trim()) {
        addContact(customAddress, customNickname.trim());
      }
      
      // Create chat and navigate to it
      const chat = getOrCreateChat(customAddress);
      selectChat(chat.id);
      setOpen(false);
      resetForm();
      
      toast.success('Conversation created successfully');
    } catch (error) {
      console.error('Error creating chat with custom address:', error);
      toast.error('Failed to create conversation');
    }
  };
  
  // Reset form state
  const resetForm = () => {
    setSearch('');
    setCustomAddress('');
    setCustomNickname('');
    setIsAddressValid(false);
    setActiveTab('contacts');
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PenSquare className="h-4 w-4" />
          <span className="hidden sm:inline">New Message</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts">
              <UserIcon className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="custom">
              <UserPlus className="h-4 w-4 mr-2" />
              Custom Address
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="contacts" className="mt-4">
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
                              `https://avatar.vercel.sh/${user.address}`
                            } 
                          />
                          <AvatarFallback>
                            {user.displayName?.[0] || user.username?.[0] || user.address[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0 max-w-full">
                          <p className="font-medium  truncate max-w-[300px]">
                            {userContacts[user.address]?.nickname || user.displayName || user.username || user.address}
                          </p>
                          {(userContacts[user.address]?.nickname && (user.displayName || user.username)) && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {user.displayName || user.username}
                            </p>
                          )}
                          {!userContacts[user.address]?.nickname && user.username && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              @{user.username}
                            </p>
                          )}
                          {(userContacts[user.address]?.nickname || user.displayName || user.username ) && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {user.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-address">Wallet Address</Label>
              <Input 
                id="wallet-address" 
                placeholder="0x..." 
                value={customAddress}
                onChange={handleAddressChange}
              />
              {customAddress && !isAddressValid && (
                <p className="text-xs text-destructive">Please enter a valid Ethereum address</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (optional)</Label>
              <Input 
                id="nickname" 
                placeholder="Enter a nickname for this contact..." 
                value={customNickname}
                onChange={(e) => setCustomNickname(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleSendToCustomAddress} 
              disabled={!isAddressValid}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Conversation
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 