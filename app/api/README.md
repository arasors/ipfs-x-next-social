# API İstekleri

Bu belge, WWEB-v2 projesinde kullanılan API isteklerini detaylı olarak açıklar.

## API Yapısı

API istekleri, Axios kütüphanesi kullanılarak yapılır. API URL'i, `.env` dosyasında tanımlanır:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Kimlik Doğrulama

API istekleri, JWT token kullanılarak kimlik doğrulaması gerektirir. Token, Firebase Authentication kullanılarak alınır ve her API isteğinde `Authorization` başlığında gönderilir:

```typescript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

## API Kategorileri

API istekleri, aşağıdaki kategorilere ayrılır:

1. Oturum İstekleri
2. Sohbet İstekleri
3. Mesaj İstekleri
4. Kişi İstekleri

## Oturum İstekleri

### Yeni Oturum Başlatma

```typescript
/**
 * Yeni bir WhatsApp oturumu başlatır.
 * @param {string} name - Oturum adı
 * @returns {Promise<SessionInfo>} - Oturum bilgileri
 */
const startSession = async (name: string): Promise<SessionInfo> => {
  try {
    const response = await axios.post(`${API_URL}/api/sessions/start`, { name });
    return response.data;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
};
```

**Endpoint:** `POST /api/sessions/start`

**İstek Gövdesi:**
```json
{
  "name": "Oturum Adı"
}
```

**Başarılı Yanıt (200):**
```json
{
  "id": "session-id",
  "status": "qr-code",
  "qrCode": "data:image/png;base64,..."
}
```

### Oturum Bilgilerini Getirme

```typescript
/**
 * Belirli bir oturumun bilgilerini getirir.
 * @param {string} sessionId - Oturum ID'si
 * @returns {Promise<SessionInfo>} - Oturum bilgileri
 */
const getSession = async (sessionId: string): Promise<SessionInfo> => {
  try {
    const response = await axios.get(`${API_URL}/api/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};
```

**Endpoint:** `GET /api/sessions/:sessionId`

**Başarılı Yanıt (200):**
```json
{
  "id": "session-id",
  "status": "connected",
  "phoneNumber": "905551234567",
  "name": "John Doe",
  "profilePicUrl": "https://example.com/profile.jpg"
}
```

### Oturum Bilgilerini Güncelleme

```typescript
/**
 * Belirli bir oturumun bilgilerini günceller.
 * @param {string} sessionId - Oturum ID'si
 * @param {Partial<SessionInfo>} data - Güncellenecek veriler
 * @returns {Promise<SessionInfo>} - Güncellenmiş oturum bilgileri
 */
const updateSession = async (sessionId: string, data: Partial<SessionInfo>): Promise<SessionInfo> => {
  try {
    const response = await axios.put(`${API_URL}/api/sessions/${sessionId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};
```

**Endpoint:** `PUT /api/sessions/:sessionId`

**İstek Gövdesi:**
```json
{
  "name": "Yeni Oturum Adı"
}
```

**Başarılı Yanıt (200):**
```json
{
  "id": "session-id",
  "status": "connected",
  "phoneNumber": "905551234567",
  "name": "Yeni Oturum Adı",
  "profilePicUrl": "https://example.com/profile.jpg"
}
```

### Oturumu Kapatma

```typescript
/**
 * Belirli bir oturumu kapatır.
 * @param {string} sessionId - Oturum ID'si
 * @returns {Promise<void>}
 */
const disconnectSession = async (sessionId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/api/sessions/${sessionId}/disconnect`);
  } catch (error) {
    console.error('Error disconnecting session:', error);
    throw error;
  }
};
```

**Endpoint:** `POST /api/sessions/:sessionId/disconnect`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Session disconnected successfully"
}
```

### SSE Bağlantısı Kurma

```typescript
/**
 * Belirli bir oturum için SSE bağlantısı kurar.
 * @param {string} sessionId - Oturum ID'si
 * @returns {EventSource} - SSE bağlantısı
 */
const connectSSE = (sessionId: string): EventSource => {
  const sse = new EventSource(`${API_URL}/api/${sessionId}/events`);
  return sse;
};
```

**Endpoint:** `GET /api/:sessionId/events`

**SSE Olayları:**
- `qr-code`: QR kod oluşturulduğunda
- `authenticated`: Kimlik doğrulandığında
- `connected`: Bağlantı kurulduğunda
- `disconnected`: Bağlantı kesildiğinde
- `error`: Hata oluştuğunda
- `message`: Yeni mesaj geldiğinde
- `message-sent`: Mesaj gönderildiğinde
- `sync-started`: Senkronizasyon başladığında
- `sync-progress`: Senkronizasyon devam ederken
- `sync-completed`: Senkronizasyon tamamlandığında
- `sync-error`: Senkronizasyon hatası oluştuğunda
- `sync-contacts-started`: Kişi senkronizasyonu başladığında
- `sync-contacts-progress`: Kişi senkronizasyonu devam ederken
- `sync-contacts-completed`: Kişi senkronizasyonu tamamlandığında
- `sync-contacts-error`: Kişi senkronizasyonu hatası oluştuğunda
- `contact-updated`: Kişi bilgileri güncellendiğinde

### Sohbetleri Senkronize Etme

```typescript
/**
 * Belirli bir oturum için sohbetleri senkronize eder.
 * @param {string} sessionId - Oturum ID'si
 * @returns {Promise<void>}
 */
const syncChats = async (sessionId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/api/${sessionId}/sync`);
  } catch (error) {
    console.error('Error syncing chats:', error);
    throw error;
  }
};
```

**Endpoint:** `POST /api/:sessionId/sync`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Sync started successfully"
}
```

## Sohbet İstekleri

### Sohbetleri Getirme

```typescript
/**
 * Belirli bir oturuma ait sohbetleri getirir.
 * @param {string} sessionId - Oturum ID'si
 * @returns {Promise<Chat[]>} - Sohbet listesi
 */
const fetchChats = async (sessionId: string): Promise<Chat[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/chats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};
```

**Endpoint:** `GET /api/:sessionId/chats`

**Başarılı Yanıt (200):**
```json
[
  {
    "id": "905551234567@c.us",
    "name": "John Doe",
    "lastMessage": "Merhaba!",
    "lastMessageTime": "2023-01-01T12:00:00.000Z",
    "unreadCount": 0,
    "isGroup": false,
    "profilePicUrl": "https://example.com/profile.jpg"
  },
  {
    "id": "905559876543@c.us",
    "name": "Jane Doe",
    "lastMessage": "Nasılsın?",
    "lastMessageTime": "2023-01-01T11:00:00.000Z",
    "unreadCount": 2,
    "isGroup": false,
    "profilePicUrl": "https://example.com/profile2.jpg"
  }
]
```

### Son Güncellenen Sohbetleri Getirme

```typescript
/**
 * Son güncellenen sohbetleri getirir.
 * @param {string} sessionId - Oturum ID'si
 * @param {number} lastUpdateTime - Son güncelleme zamanı (timestamp)
 * @returns {Promise<Chat[]>} - Sohbet listesi
 */
const fetchRecentChats = async (sessionId: string, lastUpdateTime: number): Promise<Chat[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/recent-chats?since=${lastUpdateTime}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    throw error;
  }
};
```

**Endpoint:** `GET /api/:sessionId/recent-chats?since=:timestamp`

**Başarılı Yanıt (200):**
```json
[
  {
    "id": "905551234567@c.us",
    "name": "John Doe",
    "lastMessage": "Yeni mesaj!",
    "lastMessageTime": "2023-01-01T13:00:00.000Z",
    "unreadCount": 1,
    "isGroup": false,
    "profilePicUrl": "https://example.com/profile.jpg"
  }
]
```

### Sohbeti Okundu Olarak İşaretleme

```typescript
/**
 * Belirli bir sohbeti okundu olarak işaretler.
 * @param {string} sessionId - Oturum ID'si
 * @param {string} chatId - Sohbet ID'si
 * @returns {Promise<void>}
 */
const markChatAsRead = async (sessionId: string, chatId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/api/${sessionId}/chats/${chatId}/read`);
  } catch (error) {
    console.error('Error marking chat as read:', error);
    throw error;
  }
};
```

**Endpoint:** `POST /api/:sessionId/chats/:chatId/read`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Chat marked as read successfully"
}
```

## Mesaj İstekleri

### Mesajları Getirme

```typescript
/**
 * Belirli bir sohbetin mesajlarını getirir.
 * @param {string} sessionId - Oturum ID'si
 * @param {string} chatId - Sohbet ID'si
 * @param {string} [before] - Bu tarihten önceki mesajları getir
 * @returns {Promise<Message[]>} - Mesaj listesi
 */
const fetchMessages = async (sessionId: string, chatId: string, before?: string): Promise<Message[]> => {
  try {
    const url = before
      ? `${API_URL}/api/${sessionId}/chats/${chatId}/messages?before=${before}`
      : `${API_URL}/api/${sessionId}/chats/${chatId}/messages`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};
```

**Endpoint:** `GET /api/:sessionId/chats/:chatId/messages`

**Sorgu Parametreleri:**
- `before`: Bu tarihten önceki mesajları getir (isteğe bağlı)

**Başarılı Yanıt (200):**
```json
[
  {
    "id": "message-id-1",
    "chatId": "905551234567@c.us",
    "content": "Merhaba!",
    "timestamp": "2023-01-01T12:00:00.000Z",
    "fromMe": false,
    "sender": "905551234567@c.us",
    "senderName": "John Doe"
  },
  {
    "id": "message-id-2",
    "chatId": "905551234567@c.us",
    "content": "Nasılsın?",
    "timestamp": "2023-01-01T12:01:00.000Z",
    "fromMe": true
  }
]
```

### Mesaj Gönderme

```typescript
/**
 * Mesaj gönderir.
 * @param {string} sessionId - Oturum ID'si
 * @param {string} chatId - Sohbet ID'si
 * @param {string} content - Mesaj içeriği
 * @returns {Promise<void>}
 */
const sendMessage = async (sessionId: string, chatId: string, content: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/api/${sessionId}/send`, {
      chatId,
      content
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
```

**Endpoint:** `POST /api/:sessionId/send`

**İstek Gövdesi:**
```json
{
  "chatId": "905551234567@c.us",
  "content": "Merhaba!"
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

## Kişi İstekleri

### Kişileri Getirme

```typescript
/**
 * Belirli bir oturuma ait kişileri getirir.
 * @param {string} sessionId - Oturum ID'si
 * @returns {Promise<Contact[]>} - Kişi listesi
 */
const fetchContacts = async (sessionId: string): Promise<Contact[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/contacts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};
```

**Endpoint:** `GET /api/:sessionId/contacts`

**Başarılı Yanıt (200):**
```json
[
  {
    "phoneNumber": "905551234567",
    "name": "John Doe",
    "profilePicUrl": "https://example.com/profile.jpg",
    "isBlocked": false
  },
  {
    "phoneNumber": "905559876543",
    "name": "Jane Doe",
    "profilePicUrl": "https://example.com/profile2.jpg",
    "isBlocked": false
  }
]
```

### Kişi Bilgilerini Getirme

```typescript
/**
 * Belirli bir kişinin bilgilerini getirir.
 * @param {string} sessionId - Oturum ID'si
 * @param {string} phoneNumber - Telefon numarası
 * @returns {Promise<Contact>} - Kişi bilgileri
 */
const getContact = async (sessionId: string, phoneNumber: string): Promise<Contact> => {
  try {
    const response = await axios.get(`${API_URL}/api/${sessionId}/contacts/${phoneNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error getting contact:', error);
    throw error;
  }
};
```

**Endpoint:** `GET /api/:sessionId/contacts/:phoneNumber`

**Başarılı Yanıt (200):**
```json
{
  "phoneNumber": "905551234567",
  "name": "John Doe",
  "profilePicUrl": "https://example.com/profile.jpg",
  "isBlocked": false
}
```

### Kişi Bilgilerini Güncelleme

```typescript
/**
 * Kişi bilgilerini günceller.
 * @param {string} sessionId - Oturum ID'si
 * @param {string} phoneNumber - Telefon numarası
 * @param {Partial<Contact>} data - Güncellenecek veriler
 * @returns {Promise<Contact>} - Güncellenmiş kişi bilgileri
 */
const updateContact = async (sessionId: string, phoneNumber: string, data: Partial<Contact>): Promise<Contact> => {
  try {
    const response = await axios.put(`${API_URL}/api/${sessionId}/contacts/${phoneNumber}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};
```

**Endpoint:** `PUT /api/:sessionId/contacts/:phoneNumber`

**İstek Gövdesi:**
```json
{
  "name": "John Doe (İş)"
}
```

**Başarılı Yanıt (200):**
```json
{
  "phoneNumber": "905551234567",
  "name": "John Doe (İş)",
  "profilePicUrl": "https://example.com/profile.jpg",
  "isBlocked": false
}
```

### Kişileri Senkronize Etme

```typescript
/**
 * Kişileri senkronize eder.
 * @param {string} sessionId - Oturum ID'si
 * @returns {Promise<void>}
 */
const syncContacts = async (sessionId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/api/${sessionId}/sync-contacts`);
  } catch (error) {
    console.error('Error syncing contacts:', error);
    throw error;
  }
};
```

**Endpoint:** `POST /api/:sessionId/sync-contacts`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Contact sync started successfully"
}
```

## Hata İşleme

API isteklerinde oluşabilecek hatalar, try-catch blokları ile yakalanır ve konsola yazdırılır. Hata durumunda, hata nesnesi fırlatılır ve üst bileşenlerde yakalanabilir.

```typescript
try {
  // API isteği
} catch (error) {
  console.error('Error:', error);
  
  // Hata mesajını göster
  if (axios.isAxiosError(error)) {
    const errorMessage = error.response?.data?.message || 'Bir hata oluştu';
    // Toast veya bildirim göster
  }
  
  throw error;
}
```

## API İsteklerini Özelleştirme

API isteklerini özelleştirmek için, Axios interceptor'ları kullanılabilir:

```typescript
// İstek interceptor'ı
axios.interceptors.request.use(
  (config) => {
    // İstek yapılmadan önce çalışır
    // Token ekle
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı
axios.interceptors.response.use(
  (response) => {
    // Başarılı yanıt
    return response;
  },
  (error) => {
    // Hata yanıtı
    if (error.response?.status === 401) {
      // Token süresi dolmuş, kullanıcıyı çıkış yap
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
```

## API İsteklerini Test Etme

API isteklerini test etmek için, Jest ve Axios Mock Adapter kullanılabilir:

```typescript
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fetchChats } from './api';

describe('API Tests', () => {
  let mock: MockAdapter;
  
  beforeEach(() => {
    mock = new MockAdapter(axios);
  });
  
  afterEach(() => {
    mock.reset();
  });
  
  it('should fetch chats successfully', async () => {
    const mockData = [
      {
        id: '905551234567@c.us',
        name: 'John Doe',
        lastMessage: 'Merhaba!',
        lastMessageTime: '2023-01-01T12:00:00.000Z',
        unreadCount: 0,
        isGroup: false,
        profilePicUrl: 'https://example.com/profile.jpg'
      }
    ];
    
    mock.onGet(`${API_URL}/api/session-id/chats`).reply(200, mockData);
    
    const result = await fetchChats('session-id');
    expect(result).toEqual(mockData);
  });
  
  it('should handle errors when fetching chats', async () => {
    mock.onGet(`${API_URL}/api/session-id/chats`).reply(500, { message: 'Server error' });
    
    await expect(fetchChats('session-id')).rejects.toThrow();
  });
});
```

## Sonuç

Bu belgede, WWEB-v2 projesinde kullanılan API isteklerini detaylı olarak açıkladık. API istekleri, Axios kütüphanesi kullanılarak yapılır ve JWT token ile kimlik doğrulaması gerektirir. API istekleri, oturum, sohbet, mesaj ve kişi kategorilerine ayrılır. Her kategori için, ilgili API isteklerini ve yanıtlarını açıkladık. Ayrıca, hata işleme, API isteklerini özelleştirme ve test etme konularında da bilgi verdik. 