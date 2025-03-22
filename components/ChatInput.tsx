import { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { 
  Input, 
  Button, 
  Form,
  FormControl,
  FormField,
  FormItem
} from '@/components/ui';
import { useUserStore } from '@/store/userStore';
import { useMessageStore } from '@/store/messageStore';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useFocusTrap } from '@/hooks/useFocusTrap';

type ChatInputProps = {
  chatId: string;
  recipientAddress: string;
};

type FormValues = {
  message: string;
};

export function ChatInput({ chatId, recipientAddress }: ChatInputProps) {
  const { user } = useUserStore();
  const { sendMessage } = useMessageStore();
  const [isSending, setIsSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { ref: focusTrapRef } = useFocusTrap();

  const form = useForm<FormValues>({
    defaultValues: {
      message: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!values.message.trim() || !user || isSending) {
      return;
    }

    try {
      setIsSending(true);
      
      // Send the message - this now saves to OrbitDB in the messageStore.ts implementation
      await sendMessage({
        chatId,
        from: user.address,
        to: recipientAddress,
        content: values.message.trim(),
        timestamp: Date.now(),
      });

      form.reset();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  return (
    <div className="border-t p-3">
      <Form {...form}>
        <form 
          ref={formRef} 
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="flex items-center gap-2"
        >
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    ref={focusTrapRef}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Form>
    </div>
  );
} 