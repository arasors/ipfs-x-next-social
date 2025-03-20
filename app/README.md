# WWEB-v2 Frontend (UI)

Bu dizin, WWEB-v2 projesinin frontend (UI) kısmını içerir. Next.js, Tailwind CSS ve shadcn/ui kullanılarak geliştirilmiştir.

## Proje Yapısı

```
app/
├── api/                # Next.js API route'ları
│   ├── auth/           # Kimlik doğrulama API'leri
│   └── sessions/       # Oturum yönetimi API'leri
├── auth/               # Kimlik doğrulama sayfaları
│   ├── components/     # Kimlik doğrulama bileşenleri
│   └── page.tsx        # Giriş sayfası
├── dashboard/          # Ana dashboard sayfaları
│   ├── components/     # Dashboard bileşenleri
│   │   ├── ChatList.tsx           # Sohbet listesi bileşeni
│   │   ├── ConnectionStatus.tsx   # Bağlantı durumu bileşeni
│   │   ├── ConnectedHeader.tsx    # Bağlı kullanıcı başlığı
│   │   ├── MessageForm.tsx        # Mesaj gönderme formu
│   │   ├── MessageList.tsx        # Mesaj listesi bileşeni
│   │   ├── MessengerScreen.tsx    # Ana mesajlaşma ekranı
│   │   ├── TabNavigation.tsx      # Sekme navigasyonu
│   │   └── types.d.ts             # Tip tanımlamaları
│   └── page.tsx        # Dashboard ana sayfası
└── ...
```

## Bileşenler

### Dashboard Bileşenleri

- **ChatList**: Sohbet listesini görüntüler. Kişilerin profil resimlerini ve rehberde kayıtlı adlarını gösterir.
- **ConnectionStatus**: WhatsApp bağlantı durumunu gösterir (QR kod, bağlanıyor, bağlandı, hata vb.).
- **ConnectedHeader**: Bağlı kullanıcı bilgilerini ve senkronizasyon butonlarını içerir.
- **MessageForm**: Mesaj gönderme formunu içerir.
- **MessageList**: Mesajları görüntüler. Kişilerin profil resimlerini ve rehberde kayıtlı adlarını gösterir.
- **MessengerScreen**: Ana mesajlaşma ekranını içerir. ChatList, MessageList ve MessageForm bileşenlerini bir araya getirir.
- **TabNavigation**: Sekme navigasyonunu içerir. Birden fazla WhatsApp oturumunu yönetmek için kullanılır.

### Kimlik Doğrulama Bileşenleri

- **LoginForm**: Giriş formunu içerir.
- **RegisterForm**: Kayıt formunu içerir.
- **ResetPasswordForm**: Şifre sıfırlama formunu içerir.

## Zustand Store'ları

Zustand, React uygulamalarında durum yönetimi için kullanılan hafif bir kütüphanedir. Bu projede aşağıdaki store'lar kullanılmıştır:

### useSessionStore

Oturum yönetimi için kullanılır. Aşağıdaki özellikleri içerir:

- **sessionInfo**: Oturum bilgileri (durum, QR kodu, telefon numarası vb.)
- **isLoading**: Yükleme durumu
- **sseRef**: SSE bağlantısı referansı
- **lastUpdateTime**: Son güncelleme zamanı
- **connectSSE**: SSE bağlantısını kurar
- **disconnectSSE**: SSE bağlantısını kapatır
- **reconnectSession**: Oturumu yeniden bağlar
- **disconnectSession**: Oturumu kapatır
- **syncChats**: Sohbetleri senkronize eder

### useChatsStore

Sohbet yönetimi için kullanılır. Aşağıdaki özellikleri içerir:

- **chats**: Sohbet listesi
- **selectedChat**: Seçili sohbet
- **isLoading**: Yükleme durumu
- **fetchChats**: Sohbetleri getirir
- **fetchRecentChats**: Son güncellenen sohbetleri getirir
- **updateChatInList**: Sohbet listesini günceller
- **markChatAsRead**: Sohbeti okundu olarak işaretler

### useMessagesStore

Mesaj yönetimi için kullanılır. Aşağıdaki özellikleri içerir:

- **messages**: Mesaj listesi
- **isLoading**: Yükleme durumu
- **hasMore**: Daha fazla mesaj olup olmadığı
- **fetchMessages**: Mesajları getirir
- **loadMoreMessages**: Daha fazla mesaj yükler
- **addMessage**: Yeni mesaj ekler
- **clearMessages**: Mesajları temizler

### useContactsStore

Kişi yönetimi için kullanılır. Aşağıdaki özellikleri içerir:

- **contacts**: Kişi listesi
- **isLoading**: Yükleme durumu
- **fetchContacts**: Kişileri getirir
- **searchContacts**: Kişileri arar
- **updateContact**: Kişi bilgilerini günceller
- **getContactByPhone**: Telefon numarasına göre kişi bilgilerini getirir

## API İstekleri

API istekleri için Axios kütüphanesi kullanılmıştır. API istekleri aşağıdaki kategorilere ayrılmıştır:

### Oturum İstekleri

- **POST /api/sessions/start**: Yeni bir WhatsApp oturumu başlatır.
- **GET /api/sessions/:sessionId**: Belirli bir oturumun bilgilerini getirir.
- **PUT /api/sessions/:sessionId**: Belirli bir oturumun bilgilerini günceller.
- **POST /api/sessions/:sessionId/disconnect**: Belirli bir oturumu kapatır.
- **GET /api/sessions/:sessionId/events**: Belirli bir oturum için SSE bağlantısı kurar.
- **POST /api/sessions/:sessionId/sync**: Belirli bir oturum için sohbetleri senkronize eder.

### Sohbet İstekleri

- **GET /api/:sessionId/chats**: Belirli bir oturuma ait sohbetleri getirir.
- **GET /api/:sessionId/recent-chats**: Belirli bir tarihten sonra güncellenen sohbetleri getirir.
- **GET /api/:sessionId/chats/:chatId/messages**: Belirli bir sohbetin mesajlarını getirir.
- **POST /api/:sessionId/chats/:chatId/read**: Belirli bir sohbeti okundu olarak işaretler.
- **POST /api/:sessionId/send**: Belirli bir oturum üzerinden mesaj gönderir.

### Kişi İstekleri

- **GET /api/:sessionId/contacts**: Belirli bir oturuma ait kişileri getirir.
- **GET /api/:sessionId/contacts/:phoneNumber**: Belirli bir kişinin bilgilerini getirir.
- **PUT /api/:sessionId/contacts/:phoneNumber**: Kişi bilgilerini günceller.
- **POST /api/:sessionId/sync-contacts**: Kişileri senkronize eder.

## SSE (Server-Sent Events)

SSE, sunucudan istemciye gerçek zamanlı bildirimler göndermek için kullanılır. Bu projede aşağıdaki SSE olayları kullanılmıştır:

- **qr-code**: QR kod oluşturulduğunda
- **authenticated**: Kimlik doğrulandığında
- **connected**: Bağlantı kurulduğunda
- **disconnected**: Bağlantı kesildiğinde
- **error**: Hata oluştuğunda
- **message**: Yeni mesaj geldiğinde
- **message-sent**: Mesaj gönderildiğinde
- **sync-started**: Senkronizasyon başladığında
- **sync-progress**: Senkronizasyon devam ederken
- **sync-completed**: Senkronizasyon tamamlandığında
- **sync-error**: Senkronizasyon hatası oluştuğunda
- **sync-contacts-started**: Kişi senkronizasyonu başladığında
- **sync-contacts-progress**: Kişi senkronizasyonu devam ederken
- **sync-contacts-completed**: Kişi senkronizasyonu tamamlandığında
- **sync-contacts-error**: Kişi senkronizasyonu hatası oluştuğunda
- **contact-updated**: Kişi bilgileri güncellendiğinde

## Kullanıcı Arayüzü

Kullanıcı arayüzü, shadcn/ui ve Tailwind CSS kullanılarak geliştirilmiştir. Aşağıdaki bileşenler kullanılmıştır:

- **Card**: Kartlar için
- **Button**: Butonlar için
- **Avatar**: Profil resimleri için
- **Badge**: Okunmamış mesaj sayısı için
- **Separator**: Ayırıcılar için
- **Input**: Giriş alanları için
- **Textarea**: Mesaj gönderme alanı için
- **Dialog**: Diyaloglar için
- **Dropdown**: Açılır menüler için
- **Tabs**: Sekmeler için
- **Toast**: Bildirimler için

## Geliştirme

### Yeni Bileşen Ekleme

Yeni bir bileşen eklemek için aşağıdaki adımları izleyin:

1. `app/dashboard/components` dizininde yeni bir dosya oluşturun.
2. Bileşeni oluşturun ve export edin.
3. Bileşeni kullanmak istediğiniz yerde import edin.

### Yeni Store Ekleme

Yeni bir store eklemek için aşağıdaki adımları izleyin:

1. `store` dizininde yeni bir dosya oluşturun.
2. Store'u oluşturun ve export edin.
3. `store/index.js` dosyasında store'u import edip export edin.
4. Store'u kullanmak istediğiniz yerde import edin.

### Yeni API İsteği Ekleme

Yeni bir API isteği eklemek için aşağıdaki adımları izleyin:

1. İlgili store dosyasında yeni bir fonksiyon oluşturun.
2. Axios ile API isteğini gönderin.
3. İsteğin sonucunu store'a kaydedin.
4. Fonksiyonu kullanmak istediğiniz yerde çağırın.

## Dağıtım

Projeyi dağıtmak için aşağıdaki adımları izleyin:

1. Projeyi build edin:
```bash
npm run build
```

2. Build edilen dosyaları bir web sunucusuna yükleyin.

3. Backend API'sini de ayrı bir sunucuya yükleyin.

4. Frontend'in `.env.production` dosyasında backend API'sinin URL'sini ayarlayın.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın. 