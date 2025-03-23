import { Chat, Message } from '@/models/Message';

/**
 * Fetches all chats for a user from the API
 * @param userAddress The blockchain address of the current user
 * @param since Timestamp to fetch messages after
 * @returns Object containing chat and message records
 */
export const fetchChatsFromAPI = async (
  userAddress: string,
  since: number = 0
): Promise<{
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  timestamp: number;
}> => {
  try {
    // Fetch remote state from the server
    const response = await fetch(`/api/messages?userAddress=${userAddress}&since=${since}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages from API:', error);
    return {
      chats: {},
      messages: {},
      timestamp: Date.now()
    };
  }
};

/**
 * Saves a message to the API
 * @param message The message to save
 * @param chat The updated chat object
 * @param userAddress The user's address
 * @returns True if the operation was successful
 */
export const saveMessageToAPI = async (
  message: Message,
  chat: Chat,
  userAddress: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: { [message.chatId]: [message] },
        chats: { [message.chatId]: chat },
        userAddress
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save message: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving message to API:', error);
    return false;
  }
};

/**
 * Saves a chat to the API
 * @param chat The chat to save
 * @param userAddress The user's address
 * @returns True if the operation was successful
 */
export const saveChatToAPI = async (
  chat: Chat,
  userAddress: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chats: { [chat.id]: chat },
        userAddress
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save chat: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving chat to API:', error);
    return false;
  }
};

/**
 * Deletes a message from the API
 * @param chatId The chat ID
 * @param messageId The message ID to delete
 * @param updatedMessages The updated messages list after deletion
 * @param updatedChat The updated chat object after deletion
 * @param userAddress The user's address
 * @returns True if the operation was successful
 */
export const deleteMessageFromAPI = async (
  chatId: string,
  updatedMessages: Message[],
  updatedChat: Chat,
  userAddress: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: { [chatId]: updatedMessages },
        chats: { [chatId]: updatedChat },
        userAddress
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting message from API:', error);
    return false;
  }
};

/**
 * Deletes a chat from the API
 * @param chatId The chat ID to delete
 * @param userAddress The user's address
 * @returns True if the operation was successful
 */
export const deleteChatFromAPI = async (
  chatId: string,
  userAddress: string
): Promise<boolean> => {
  try {
    // Get existing messages and chats
    const { chats, messages } = await fetchChatsFromAPI(userAddress);
    
    // Remove the chat and its messages
    if (chats[chatId]) {
      delete chats[chatId];
    }
    
    if (messages[chatId]) {
      delete messages[chatId];
    }
    
    // Update the API
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chats,
        messages,
        userAddress
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting chat from API:', error);
    return false;
  }
}; 