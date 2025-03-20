# Zustand Store'ları

Bu belge, WWEB-v2 projesinde kullanılan Zustand store'larını detaylı olarak açıklar.

## Zustand Nedir?

Zustand, React uygulamalarında durum yönetimi için kullanılan hafif bir kütüphanedir. Redux'a benzer bir yapıya sahiptir ancak daha az boilerplate kod gerektirir. Zustand, hook tabanlı bir API sunar ve React context API'sine göre daha performanslıdır.

## Store Yapısı

Her store, aşağıdaki yapıya sahiptir:

```typescript
import { create } from 'zustand';

interface StoreState {
  // State değişkenleri
  someState: string;
  
  // Aksiyonlar
  someAction: (param: string) => void;
}

const useStore = create<StoreState>((set, get) => ({
  // Başlangıç durumu
  someState: '',
  
  // Aksiyonlar
  someAction: (param: string) => {
    set({ someState: param });
  }
}));

export default useStore;
```

## Store'lar

### useSessionStore

Oturum yönetimi için kullanılır. WhatsApp oturumlarının durumunu ve SSE bağlantılarını yönetir.

```typescript
interface SessionInfo {
  id: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'qr-code' | 'error';
  qrCode?: string;
  phoneNumber?: string;
  name?: string;
  profilePicUrl?: string;
  error?: string;
}

interface SessionStore {
  // State
  sessionInfo: SessionInfo | null;
  isLoading: boolean;
  sseRef: EventSource | null;
  lastUpdateTime: number;
  
  // Aksiyonlar
  connectSSE: (sessionId: string) => void;
  disconnectSSE: () => void;
  reconnectSession: (sessionId: string) => Promise<void>;
  disconnectSession: (sessionId: string) => Promise<void>;
  syncChats: (sessionId: string) => Promise<void>;
  syncContacts: (sessionId: string) => Promise<void>;
  updateSessionInfo: (info: Partial<SessionInfo>) => void;
  setLoading: (loading: boolean) => void;
}
```

#### Önemli Fonksiyonlar

- **connectSSE**: Belirli bir oturum için SSE bağlantısı kurar. Bu fonksiyon, sunucudan gerçek zamanlı olayları dinlemek için kullanılır.

```typescript
connectSSE: (sessionId: string) => {
  const currentSSE = get().sseRef;
  if (currentSSE) {
    currentSSE.close();
  }
  
  const sse = new EventSource(`${API_URL}/api/${sessionId}/events`);
  
  sse.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Olaya göre işlem yap
    if (data.event === 'qr-code') {
      set({ sessionInfo: { ...get().sessionInfo, status: 'qr-code', qrCode: data.qrCode } });
    } else if (data.event === 'authenticated') {
      set({ sessionInfo: { ...get().sessionInfo, status: 'authenticated' } });
    } else if (data.event === 'connected') {
      set({ 
        sessionInfo: { 
          ...get().sessionInfo, 
          status: 'connected',
          phoneNumber: data.phoneNumber,
          name: data.name,
          profilePicUrl: data.profilePicUrl
        } 
      });
    } else if (data.event === 'disconnected') {
      set({ sessionInfo: { ...get().sessionInfo, status: 'disconnected' } });
    } else if (data.event === 'error') {
      set({ sessionInfo: { ...get().sessionInfo, status: 'error', error: data.error } });
    }
    
    set({ lastUpdateTime: Date.now() });
  };
  
  sse.onerror = () => {
    sse.close();
    set({ sseRef: null });
  };
  
  set({ sseRef: sse });
}
```

- **disconnectSSE**: SSE bağlantısını kapatır.

```typescript
disconnectSSE: () => {
  const currentSSE = get().sseRef;
  if (currentSSE) {
    currentSSE.close();
    set({ sseRef: null });
  }
}
```

- **reconnectSession**: Oturumu yeniden bağlar.

```typescript
reconnectSession: async (sessionId: string) => {
  set({ isLoading: true });
  
  try {
    await axios.post(`${API_URL}/api/sessions/${sessionId}/reconnect`);
    get().connectSSE(sessionId);
  } catch (error) {
    console.error('Error reconnecting session:', error);
    set({ sessionInfo: { ...get().sessionInfo, status: 'error', error: 'Failed to reconnect session' } });
  } finally {
    set({ isLoading: false });
  }
}
```

- **disconnectSession**: Oturumu kapatır.

```typescript
disconnectSession: async (sessionId: string) => {
  set({ isLoading: true });
  
  try {
    await axios.post(`${API_URL}/api/sessions/${sessionId}/disconnect`);
    get().disconnectSSE();
    set({ sessionInfo: { ...get().sessionInfo, status: 'disconnected' } });
  } catch (error) {
    console.error('Error disconnecting session:', error);
  } finally {
    set({ isLoading: false });
  }
}
```

### useChatsStore

Sohbet yönetimi için kullanılır. Sohbet listesini ve seçili sohbeti yönetir.

```typescript
interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
  profilePicUrl?: string;
}

interface ChatsStore {
  // State
  chats: Chat[];
  selectedChat: Chat | null;
  isLoading: boolean;
  
  // Aksiyonlar
  fetchChats: (sessionId: string) => Promise<void>;
  fetchRecentChats: (sessionId: string, lastUpdateTime: number) => Promise<void>;
  selectChat: (chat: Chat) => void;
  updateChatInList: (chat: Chat) => void;
  markChatAsRead: (sessionId: string, chatId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
}
```

#### Önemli Fonksiyonlar

- **fetchChats**: Belirli bir oturuma ait sohbetleri getirir.

```typescript
fetchChats: async (sessionId: string) => {
  set({ isLoading: true });
  
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/chats`);
    set({ chats: response.data });
  } catch (error) {
    console.error('Error fetching chats:', error);
  } finally {
    set({ isLoading: false });
  }
}
```

- **fetchRecentChats**: Son güncellenen sohbetleri getirir.

```typescript
fetchRecentChats: async (sessionId: string, lastUpdateTime: number) => {
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/recent-chats?since=${lastUpdateTime}`);
    const recentChats = response.data;
    
    // Mevcut sohbetleri güncelle
    const currentChats = get().chats;
    const updatedChats = [...currentChats];
    
    recentChats.forEach((recentChat: Chat) => {
      const index = updatedChats.findIndex(chat => chat.id === recentChat.id);
      if (index !== -1) {
        updatedChats[index] = recentChat;
      } else {
        updatedChats.push(recentChat);
      }
    });
    
    set({ chats: updatedChats });
  } catch (error) {
    console.error('Error fetching recent chats:', error);
  }
}
```

- **updateChatInList**: Sohbet listesini günceller.

```typescript
updateChatInList: (chat: Chat) => {
  const currentChats = get().chats;
  const index = currentChats.findIndex(c => c.id === chat.id);
  
  if (index !== -1) {
    const updatedChats = [...currentChats];
    updatedChats[index] = chat;
    set({ chats: updatedChats });
    
    // Seçili sohbet güncellendiyse, onu da güncelle
    if (get().selectedChat?.id === chat.id) {
      set({ selectedChat: chat });
    }
  } else {
    set({ chats: [chat, ...currentChats] });
  }
}
```

### useMessagesStore

Mesaj yönetimi için kullanılır. Mesaj listesini ve mesaj gönderme işlemlerini yönetir.

```typescript
interface Message {
  id: string;
  chatId: string;
  content: string;
  timestamp: string;
  fromMe: boolean;
  sender?: string;
  senderName?: string;
}

interface MessagesStore {
  // State
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  
  // Aksiyonlar
  fetchMessages: (sessionId: string, chatId: string) => Promise<void>;
  loadMoreMessages: (sessionId: string, chatId: string) => Promise<void>;
  sendMessage: (sessionId: string, chatId: string, content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}
```

#### Önemli Fonksiyonlar

- **fetchMessages**: Belirli bir sohbetin mesajlarını getirir.

```typescript
fetchMessages: async (sessionId: string, chatId: string) => {
  set({ isLoading: true, messages: [] });
  
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/chats/${chatId}/messages`);
    set({ messages: response.data, hasMore: response.data.length >= 20 });
  } catch (error) {
    console.error('Error fetching messages:', error);
  } finally {
    set({ isLoading: false });
  }
}
```

- **loadMoreMessages**: Daha fazla mesaj yükler.

```typescript
loadMoreMessages: async (sessionId: string, chatId: string) => {
  if (!get().hasMore || get().isLoading) return;
  
  set({ isLoading: true });
  
  try {
    const currentMessages = get().messages;
    const oldestMessage = currentMessages[currentMessages.length - 1];
    
    const response = await axios.get(
      `${API_URL}/api/${sessionId}/chats/${chatId}/messages?before=${oldestMessage.timestamp}`
    );
    
    set({ 
      messages: [...currentMessages, ...response.data],
      hasMore: response.data.length >= 20
    });
  } catch (error) {
    console.error('Error loading more messages:', error);
  } finally {
    set({ isLoading: false });
  }
}
```

- **sendMessage**: Mesaj gönderir.

```typescript
sendMessage: async (sessionId: string, chatId: string, content: string) => {
  try {
    await axios.post(`${API_URL}/api/${sessionId}/send`, {
      chatId,
      content
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
```

### useContactsStore

Kişi yönetimi için kullanılır. Kişi listesini ve kişi bilgilerini yönetir.

```typescript
interface Contact {
  phoneNumber: string;
  name: string;
  profilePicUrl?: string;
  isBlocked: boolean;
}

interface ContactsStore {
  // State
  contacts: Contact[];
  isLoading: boolean;
  
  // Aksiyonlar
  fetchContacts: (sessionId: string) => Promise<void>;
  searchContacts: (query: string) => Contact[];
  updateContact: (sessionId: string, phoneNumber: string, data: Partial<Contact>) => Promise<void>;
  getContactByPhone: (phoneNumber: string) => Contact | undefined;
  setLoading: (loading: boolean) => void;
}
```

#### Önemli Fonksiyonlar

- **fetchContacts**: Belirli bir oturuma ait kişileri getirir.

```typescript
fetchContacts: async (sessionId: string) => {
  set({ isLoading: true });
  
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/contacts`);
    set({ contacts: response.data });
  } catch (error) {
    console.error('Error fetching contacts:', error);
  } finally {
    set({ isLoading: false });
  }
}
```

- **searchContacts**: Kişileri arar.

```typescript
searchContacts: (query: string) => {
  const contacts = get().contacts;
  if (!query) return contacts;
  
  const lowerQuery = query.toLowerCase();
  return contacts.filter(contact => 
    contact.name.toLowerCase().includes(lowerQuery) || 
    contact.phoneNumber.includes(query)
  );
}
```

- **updateContact**: Kişi bilgilerini günceller.

```typescript
updateContact: async (sessionId: string, phoneNumber: string, data: Partial<Contact>) => {
  try {
    await axios.put(`${API_URL}/api/${sessionId}/contacts/${phoneNumber}`, data);
    
    // Yerel kişi listesini güncelle
    const contacts = get().contacts;
    const index = contacts.findIndex(contact => contact.phoneNumber === phoneNumber);
    
    if (index !== -1) {
      const updatedContacts = [...contacts];
      updatedContacts[index] = { ...updatedContacts[index], ...data };
      set({ contacts: updatedContacts });
    }
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
}
```

## Store'ları Kullanma

Store'ları kullanmak için, ilgili hook'u import edin ve bileşeninizde kullanın:

```tsx
import { useSessionStore, useChatsStore, useMessagesStore, useContactsStore } from '@/store';

const MyComponent = () => {
  const { sessionInfo, connectSSE } = useSessionStore();
  const { chats, fetchChats } = useChatsStore();
  const { messages, fetchMessages } = useMessagesStore();
  const { contacts, fetchContacts } = useContactsStore();
  
  // ...
  
  return (
    // ...
  );
};
```

## Store'lar Arası İletişim

Store'lar arası iletişim için, bir store'dan diğer store'un fonksiyonlarını çağırabilirsiniz:

```typescript
import useChatsStore from './chatsStore';
import useMessagesStore from './messagesStore';

const useSessionStore = create<SessionStore>((set, get) => ({
  // ...
  
  connectSSE: (sessionId: string) => {
    // ...
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.event === 'message') {
        // Mesaj store'unu güncelle
        useMessagesStore.getState().addMessage(data.message);
        
        // Sohbet store'unu güncelle
        useChatsStore.getState().updateChatInList({
          id: data.message.chatId,
          lastMessage: data.message.content,
          lastMessageTime: data.message.timestamp,
          unreadCount: data.message.fromMe ? 0 : useChatsStore.getState().chats.find(chat => chat.id === data.message.chatId)?.unreadCount + 1 || 1
        });
      }
      
      // ...
    };
    
    // ...
  }
}));
```

## Performans Optimizasyonu

Zustand, React'in yeniden render etme mekanizmasını optimize etmek için seçici abonelikler sunar. Yalnızca ihtiyacınız olan state parçalarını seçerek, gereksiz yeniden render etmeleri önleyebilirsiniz:

```tsx
// Tüm store'u kullanmak yerine
const { chats, selectedChat, isLoading, fetchChats } = useChatsStore();

// Sadece ihtiyacınız olan parçaları seçin
const chats = useChatsStore(state => state.chats);
const selectedChat = useChatsStore(state => state.selectedChat);
const isLoading = useChatsStore(state => state.isLoading);
const fetchChats = useChatsStore(state => state.fetchChats);
```

## Middleware Kullanımı

Zustand, middleware'ler aracılığıyla store'ların davranışını özelleştirmenize olanak tanır. Örneğin, devtools middleware'i ile Redux DevTools'u kullanabilirsiniz:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set, get) => ({
      // Store tanımı
    })
  )
);
```

## Persist Middleware

Persist middleware, store'un durumunu localStorage veya sessionStorage'a kaydetmenize olanak tanır:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Store tanımı
    }),
    {
      name: 'store-name', // Storage anahtarı
      getStorage: () => localStorage, // veya sessionStorage
    }
  )
);
```

## Sonuç

Zustand, React uygulamalarında durum yönetimi için güçlü ve esnek bir çözüm sunar. Bu belgede açıklanan store'lar, WWEB-v2 projesinin temel işlevselliğini sağlar. Store'ları genişletmek veya yeni store'lar eklemek için, bu belgede açıklanan yapıyı takip edebilirsiniz. 