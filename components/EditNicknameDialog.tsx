"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

interface EditNicknameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  initialNickname?: string;
}

export function EditNicknameDialog({
  open,
  onOpenChange,
  address,
  initialNickname,
}: EditNicknameDialogProps) {
  const [nickname, setNickname] = useState(initialNickname || '');
  const { updateContactNickname, getContactNickname, removeContact } = useUserStore();
  
  // Update local state when initialNickname changes
  useEffect(() => {
    if (open) {
      setNickname(initialNickname || '');
    }
  }, [initialNickname, open]);
  
  const handleSave = () => {
    if (nickname.trim()) {
      updateContactNickname(address, nickname.trim());
      toast.success('Nickname updated successfully');
    } else {
      // If nickname is cleared, offer to remove contact
      if (getContactNickname(address)) {
        removeContact(address);
        toast.success('Nickname removed');
      }
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Contact Nickname</DialogTitle>
          <DialogDescription>
            Add a nickname to this contact to make them easier to identify
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Input
              id="address"
              value={`${address.slice(0, 6)}...${address.slice(-4)}`}
              readOnly
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nickname" className="text-right">
              Nickname
            </Label>
            <Input
              id="nickname"
              placeholder="Enter nickname..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 