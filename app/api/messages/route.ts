import { NextResponse } from 'next/server';
import { Message, Chat } from '@/models/Message';

// In-memory cache for messages and chats between requests
// In a production environment, you'd use a database or Redis
let messagesCache: Record<string, Message[]> = {};
let chatsCache: Record<string, Chat> = {};
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET handler to retrieve messages and chats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? parseInt(sinceParam, 10) : 0;
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }
    
    // Filter chats where the user is a participant
    const userChats = Object.values(chatsCache).filter(chat => 
      chat.participants.includes(userAddress)
    );
    
    // Get chat IDs where the user is a participant
    const userChatIds = userChats.map(chat => chat.id);
    
    // Get messages for the user's chats
    const userMessages: Record<string, Message[]> = {};
    userChatIds.forEach(chatId => {
      if (messagesCache[chatId]) {
        // Only include messages newer than the 'since' parameter
        userMessages[chatId] = messagesCache[chatId].filter(
          msg => msg.timestamp > since
        );
      }
    });
    
    return NextResponse.json({
      chats: Object.fromEntries(
        userChats.map(chat => [chat.id, chat])
      ),
      messages: userMessages,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST handler to add new messages and update chats
export async function POST(request: Request) {
  try {
    const { messages, chats, userAddress } = await request.json();
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }
    
    // Validate that the user is only updating their own chats and messages
    const userOwnedChats = Object.values(chats || {}).filter((chat: any) =>
      chat.participants.includes(userAddress)
    ) as Chat[];
    
    // Update chats cache
    userOwnedChats.forEach((chat: Chat) => {
      // If the chat already exists, merge with existing chat data
      if (chatsCache[chat.id]) {
        const existingChat = chatsCache[chat.id];
        chatsCache[chat.id] = {
          ...existingChat,
          ...chat,
          // For lastMessage, use the most recent one
          lastMessage: chat.lastMessage && existingChat.lastMessage
            ? chat.lastMessage.timestamp > existingChat.lastMessage.timestamp
              ? chat.lastMessage
              : existingChat.lastMessage
            : chat.lastMessage || existingChat.lastMessage
        };
      } else {
        // New chat
        chatsCache[chat.id] = chat;
      }
    });
    
    // Update messages cache
    Object.entries(messages || {}).forEach(([chatId, chatMessages]: [string, any]) => {
      // Check if this chat belongs to the user
      const chat = chatsCache[chatId];
      if (!chat || !chat.participants.includes(userAddress)) {
        return; // Skip if chat doesn't exist or user is not a participant
      }
      
      // Initialize messages array for this chat if it doesn't exist
      if (!messagesCache[chatId]) {
        messagesCache[chatId] = [];
      }
      
      // Add each message, avoiding duplicates by ID
      chatMessages.forEach((message: Message) => {
        // Skip if message already exists
        if (!messagesCache[chatId].some(m => m.id === message.id)) {
          messagesCache[chatId].push(message);
        }
      });
      
      // Sort messages by timestamp
      messagesCache[chatId].sort((a, b) => a.timestamp - b.timestamp);
    });
    
    return NextResponse.json({
      success: true,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json(
      { error: 'Failed to update messages' },
      { status: 500 }
    );
  }
} 