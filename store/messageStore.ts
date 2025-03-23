"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message } from '@/models/Message';
import { useNotificationStore } from './notificationStore';

export interface MessageState {
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  selectedChatId: string | null;
  
  // Actions
  fetchChats: () => Promise<void>;
  getChat: (chatId: string) => Chat | undefined;
  getChatMessages: (chatId: string) => Message[];
  getOrCreateChat: (participantAddress: string) => Chat;
  selectChat: (chatId: string) => void;
  sendMessage: (params: {
    chatId: string;
    content: string;
    mediaItems?: { cid: string; mimeType: string }[];
  }) => Promise<void>;
  markMessagesAsRead: (chatId: string) => void;
  
  // New actions for deleting and editing
  deleteMessage: (chatId: string, messageId: string) => void;
  deleteChat: (chatId: string) => void;
  editMessage: (chatId: string, messageId: string, newContent: string) => void;
  getMessageEditHistory: (chatId: string, messageId: string) => { content: string; timestamp: number; }[] | null;
}

export const useMessageStore = create<MessageState>()(
  persist(
    (set, get) => ({
      chats: {},
      messages: {},
      selectedChatId: null,
      
      fetchChats: async () => {
        // In a real app, this would fetch from an API
        // For now, we'll just use the persisted data
        console.log('Fetched chats');
      },
      
      getChat: (chatId: string) => {
        return get().chats[chatId];
      },
      
      getChatMessages: (chatId: string) => {
        return get().messages[chatId] || [];
      },
      
      getOrCreateChat: (participantAddress: string) => {
        const { chats } = get();
        const currentUserAddress = localStorage.getItem('walletAddress');
        
        if (!currentUserAddress) {
          throw new Error('User not authenticated');
        }
        
        // Special handling for self-messaging (messaging yourself)
        const isSelfMessage = participantAddress === currentUserAddress;
        
        // For self messaging, create a special format or check if it already exists
        if (isSelfMessage) {
          // Look for an existing self-chat
          const existingSelfChat = Object.values(chats).find(chat => 
            chat.participants.length === 2 && 
            chat.participants[0] === currentUserAddress && 
            chat.participants[1] === currentUserAddress
          );
          
          if (existingSelfChat) {
            return existingSelfChat;
          }
          
          // Create a new self-chat
          const newChatId = uuidv4();
          const newChat: Chat = {
            id: newChatId,
            participants: [currentUserAddress, currentUserAddress], // Add yourself twice to indicate self-chat
            unreadCount: 0
          };
          
          set(state => ({
            chats: {
              ...state.chats,
              [newChatId]: newChat
            },
            messages: {
              ...state.messages,
              [newChatId]: []
            }
          }));
          
          return newChat;
        }
        
        // Normal chat between two different users
        // Check if chat already exists
        const existingChat = Object.values(chats).find(chat => 
          chat.participants.length === 2 &&
          chat.participants.includes(currentUserAddress) && 
          chat.participants.includes(participantAddress)
        );
        
        if (existingChat) {
          return existingChat;
        }
        
        // Create new chat
        const newChatId = uuidv4();
        const newChat: Chat = {
          id: newChatId,
          participants: [currentUserAddress, participantAddress],
          unreadCount: 0
        };
        
        set(state => ({
          chats: {
            ...state.chats,
            [newChatId]: newChat
          },
          messages: {
            ...state.messages,
            [newChatId]: []
          }
        }));
        
        return newChat;
      },
      
      selectChat: (chatId: string) => {
        set({ selectedChatId: chatId });
        // Mark messages as read when selecting chat
        get().markMessagesAsRead(chatId);
      },
      
      sendMessage: async ({ chatId, content, mediaItems = [] }) => {
        const { chats, messages } = get();
        const chat = chats[chatId];
        
        if (!chat) {
          throw new Error('Chat not found');
        }
        
        const currentUserAddress = localStorage.getItem('walletAddress');
        if (!currentUserAddress) {
          throw new Error('User not authenticated');
        }
        
        const newMessage: Message = {
          id: uuidv4(),
          chatId,
          senderAddress: currentUserAddress,
          content,
          timestamp: Date.now(),
          read: false,
          mediaItems
        };
        
        // Update messages
        const updatedMessages = {
          ...messages,
          [chatId]: [...(messages[chatId] || []), newMessage]
        };
        
        // Update chat with last message
        const updatedChats = {
          ...chats,
          [chatId]: {
            ...chat,
            lastMessage: {
              content: content || (mediaItems.length > 0 ? 'Sent media' : ''),
              timestamp: newMessage.timestamp,
              senderAddress: currentUserAddress
            }
          }
        };
        
        // For the recipient, increment their unread count
        const recipientAddress = chat.participants.find(p => p !== currentUserAddress);
        
        // We would normally handle this server-side
        // This is just for the demo
        
        set({
          messages: updatedMessages,
          chats: updatedChats
        });
        
        // Use notification system to notify recipient
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          type: 'system',
          title: 'New Message',
          message: `You have a new message from ${currentUserAddress}`,
          recipientAddress: recipientAddress
        });
        
        // Push changes to API
        try {
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: { [chatId]: [newMessage] },
              chats: { [chatId]: updatedChats[chatId] },
              userAddress: currentUserAddress
            })
          });
          
          if (!response.ok) {
            console.error('Failed to sync message with API:', await response.text());
          }
        } catch (error) {
          console.error('Error syncing message with API:', error);
        }
        
        return Promise.resolve();
      },
      
      markMessagesAsRead: (chatId: string) => {
        const { messages, chats } = get();
        const chatMessages = messages[chatId] || [];
        const chat = chats[chatId];
        
        if (!chat) return;
        
        const currentUserAddress = localStorage.getItem('walletAddress');
        if (!currentUserAddress) return;
        
        // Only mark messages from other participants as read
        const updatedMessages = chatMessages.map(message => 
          message.senderAddress !== currentUserAddress && !message.read
            ? { ...message, read: true }
            : message
        );
        
        // Reset unread count for the current user
        const updatedChat = {
          ...chat,
          unreadCount: 0
        };
        
        set({
          messages: {
            ...messages,
            [chatId]: updatedMessages
          },
          chats: {
            ...chats,
            [chatId]: updatedChat
          }
        });
        
        // Push changes to API
        try {
          fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: { [chatId]: updatedMessages },
              chats: { [chatId]: updatedChat },
              userAddress: currentUserAddress
            })
          }).catch(error => 
            console.error('Error syncing read status with API:', error)
          );
        } catch (error) {
          console.error('Error preparing to sync read status with API:', error);
        }
      },
      
      deleteMessage: (chatId: string, messageId: string) => {
        const { messages, chats } = get();
        const chatMessages = messages[chatId] || [];
        const chat = chats[chatId];
        
        if (!chat || !chatMessages.length) return;
        
        const currentUserAddress = localStorage.getItem('walletAddress');
        if (!currentUserAddress) return;
        
        // Find message index
        const messageIndex = chatMessages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;
        
        // Check if user is authorized to delete (only sender can delete)
        const message = chatMessages[messageIndex];
        if (message.senderAddress !== currentUserAddress) {
          console.error('Unauthorized to delete this message');
          return;
        }
        
        // Remove the message
        const updatedMessages = [
          ...chatMessages.slice(0, messageIndex),
          ...chatMessages.slice(messageIndex + 1)
        ];
        
        // Update the last message in chat if needed
        let updatedChat = { ...chat };
        if (chat.lastMessage && chat.lastMessage.timestamp === message.timestamp) {
          // Find the new last message
          const newLastMessage = [...updatedMessages].sort((a, b) => b.timestamp - a.timestamp)[0];
          
          if (newLastMessage) {
            updatedChat = {
              ...chat,
              lastMessage: {
                content: newLastMessage.content,
                timestamp: newLastMessage.timestamp,
                senderAddress: newLastMessage.senderAddress
              }
            };
          } else {
            // No messages left
            const { lastMessage, ...chatWithoutLastMessage } = chat;
            updatedChat = chatWithoutLastMessage as Chat;
          }
        }
        
        // Update state
        set({
          messages: {
            ...messages,
            [chatId]: updatedMessages
          },
          chats: {
            ...chats,
            [chatId]: updatedChat
          }
        });
        
        // Push changes to API
        try {
          fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: { [chatId]: updatedMessages },
              chats: { [chatId]: updatedChat },
              userAddress: currentUserAddress
            })
          }).catch(error => 
            console.error('Error syncing message deletion with API:', error)
          );
        } catch (error) {
          console.error('Error preparing to sync message deletion with API:', error);
        }
      },
      
      deleteChat: (chatId: string) => {
        const { chats, messages } = get();
        
        if (!chats[chatId]) return;
        
        const currentUserAddress = localStorage.getItem('walletAddress');
        if (!currentUserAddress) return;
        
        // Check if user is a participant in the chat
        if (!chats[chatId].participants.includes(currentUserAddress)) {
          console.error('Unauthorized to delete this chat');
          return;
        }
        
        // Create copies of state without the deleted chat
        const { [chatId]: deletedChat, ...remainingChats } = chats;
        const { [chatId]: deletedMessages, ...remainingMessages } = messages;
        
        // Update state
        set({
          chats: remainingChats,
          messages: remainingMessages,
          selectedChatId: get().selectedChatId === chatId ? null : get().selectedChatId
        });
        
        // Push changes to API
        try {
          fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              // Simply set the user's chat list - with the deleted chat removed
              chats: remainingChats,
              userAddress: currentUserAddress
            })
          }).catch(error => 
            console.error('Error syncing chat deletion with API:', error)
          );
        } catch (error) {
          console.error('Error preparing to sync chat deletion with API:', error);
        }
      },
      
      editMessage: (chatId: string, messageId: string, newContent: string) => {
        const { messages, chats } = get();
        const chatMessages = messages[chatId] || [];
        const chat = chats[chatId];
        
        if (!chat || !chatMessages.length) return;
        
        const currentUserAddress = localStorage.getItem('walletAddress');
        if (!currentUserAddress) return;
        
        // Find message index
        const messageIndex = chatMessages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;
        
        // Check if user is authorized to edit (only sender can edit)
        const message = chatMessages[messageIndex];
        if (message.senderAddress !== currentUserAddress) {
          console.error('Unauthorized to edit this message');
          return;
        }
        
        // Save current content to edit history
        const currentContent = message.content;
        const editHistory = message.editHistory || [];
        editHistory.push({
          content: currentContent,
          timestamp: Date.now()
        });
        
        // Update the message
        const updatedMessage: Message = {
          ...message,
          content: newContent,
          isEdited: true,
          editHistory
        };
        
        const updatedMessages = [
          ...chatMessages.slice(0, messageIndex),
          updatedMessage,
          ...chatMessages.slice(messageIndex + 1)
        ];
        
        // Update the last message in chat if needed
        let updatedChat = { ...chat };
        if (chat.lastMessage && 
            chat.lastMessage.timestamp === message.timestamp &&
            chat.lastMessage.senderAddress === message.senderAddress) {
          updatedChat = {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              content: newContent
            }
          };
        }
        
        // Update state
        set({
          messages: {
            ...messages,
            [chatId]: updatedMessages
          },
          chats: {
            ...chats,
            [chatId]: updatedChat
          }
        });
        
        // Push changes to API
        try {
          fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: { [chatId]: updatedMessages },
              chats: { [chatId]: updatedChat },
              userAddress: currentUserAddress
            })
          }).catch(error => 
            console.error('Error syncing message edit with API:', error)
          );
        } catch (error) {
          console.error('Error preparing to sync message edit with API:', error);
        }
      },
      
      getMessageEditHistory: (chatId: string, messageId: string) => {
        const { messages } = get();
        const chatMessages = messages[chatId] || [];
        
        const message = chatMessages.find(m => m.id === messageId);
        if (!message || !message.editHistory) return null;
        
        return message.editHistory;
      }
    }),
    {
      name: 'message-storage',
      onRehydrateStorage: () => {
        // Log that the store has been rehydrated
        console.log('Message store rehydrated');
      }
    }
  )
); 