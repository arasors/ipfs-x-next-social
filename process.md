# IPFS-X Application Process

## Overview

IPFS-X is a decentralized social media application that leverages IPFS for content storage and distribution. The application has two main features:

1. **Feed Functionality** - Allows users to create and view posts
2. **Messaging System** - Enables direct messaging between users

## Feed Functionality

### Creating a Post

1. **User Input**:
   - User writes content in the post composer
   - User can optionally attach media files

2. **Post Creation Process**:
   - Media files are uploaded to IPFS, returning CIDs (Content Identifiers)
   - Post data is structured with content, media CIDs, and metadata
   - The post is saved to the local database/store

3. **Data Flow**:
   - `PostComposer.tsx` captures user input
   - Media is processed via `uploadToIPFS()` in `ipfs-upload.ts`
   - Post data is passed to `usePostStore().createPost()`
   - Post is added to local storage via Zustand store

4. **Post Retrieval**:
   - Posts are displayed in `Feed.tsx`
   - `usePostStore().getPosts()` retrieves posts for display
   - Posts are sorted by timestamp and rendered

## Messaging System

### Message Architecture

The messaging system has been migrated from orbit-db to a simpler API-based approach with local caching.

### Sending a Message

1. **User Input**:
   - User selects a recipient from contacts or enters a custom address
   - User composes a message and optionally attaches media

2. **Message Creation Process**:
   - Media is uploaded to IPFS via `uploadToIPFS()`
   - Message payload is created with recipient, content, and media CIDs
   - Message is sent through `sendMessage()` in `messageStore.ts`

3. **Data Flow**:
   - `ChatInput.tsx` or `ConversationView.tsx` captures the message
   - Message is processed through `messageStore.sendMessage()`
   - Message is saved to local cache in `messageStore`
   - API endpoint `/api/messages/send` is called to store the message

4. **Contacts and Nicknames**:
   - Users can add contacts with custom nicknames via `EditNicknameDialog`
   - Contacts are stored in `userStore` under the current user's profile
   - Nicknames are displayed in `MessageList`, `NewMessageButton`, and `ConversationView`

### Retrieving Messages

1. **Message Fetching**:
   - Messages are loaded from local cache on application start
   - New messages are fetched periodically via `syncMessages()`
   - API endpoint `/api/messages` is used to retrieve messages

2. **Message Display**:
   - Conversations are listed in `MessageList.tsx`
   - Individual messages are rendered in `ConversationView.tsx`
   - Chats are filtered and sorted by last message timestamp

### Memory Cache Implementation

1. **Storage Mechanism**:
   - Messages are stored in browser's localStorage via Zustand persist middleware
   - In-memory cache structure is maintained in `messageStore`
   - Message syncing is handled by `syncMessages.ts`

2. **Synchronization Process**:
   - `syncMessages()` periodically checks for new messages
   - Timestamp-based comparison ensures only new messages are fetched
   - New messages are merged with existing local cache

## Ethereum Integration

1. **Wallet Connection**:
   - User connects wallet via Ethereum provider
   - Address is used as user identifier
   - Authentication is managed through wallet signatures

2. **Identities and Contacts**:
   - User profiles are associated with Ethereum addresses
   - Custom nicknames can be assigned to contacts for easier identification
   - Ethereum address validation ensures correct recipient addressing

## Data Storage Strategy

1. **Local Storage**:
   - User preferences, contacts, and session data in browser localStorage
   - Application state managed by Zustand stores with persistence

2. **IPFS Storage**:
   - Media content (images, videos, etc.) stored on IPFS
   - Content addressed via CIDs for reliable retrieval

3. **API-Based Storage**:
   - Messages and posts transmitted via API endpoints
   - Server maintains consistent state across sessions

## Performance Considerations

1. **Caching Strategy**:
   - Local caching of messages and posts reduces network requests
   - Periodic syncing ensures data freshness with minimal overhead

2. **UI Responsiveness**:
   - Operations like sending messages update local UI immediately
   - Background syncing prevents UI blocking during network operations

3. **Memory Management**:
   - Pagination limits data load for large message histories
   - Virtualized lists improve rendering performance for long feeds 