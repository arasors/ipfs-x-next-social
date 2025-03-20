import type { CID } from 'multiformats/cid';

// Browser-only IPFS işlemleri
let heliaPromise: Promise<any> | null = null;

// IPFS istemcisini başlat
export async function createHeliaNode() {
  // Sunucu tarafında çalıştığında boş nesne döndür
  if (typeof window === 'undefined') {
    console.warn('IPFS: Sunucu tarafında çalıştırılmaya çalışılıyor');
    return { 
      helia: null, 
      fs: null, 
      jsonHandler: { 
        add: async () => "dummy-cid", 
        get: async () => ({}) 
      } 
    };
  }

  // Eğer zaten bir önbelleğe alınmış promise varsa, onu kullan
  if (!heliaPromise) {
    heliaPromise = initHeliaNode()
      .then(node => {
        console.log('IPFS düğümü başarıyla oluşturuldu');
        return node;
      })
      .catch(error => {
        console.error('IPFS düğümü oluşturulurken hata:', error);
        heliaPromise = null; // Hata durumunda tekrar deneyelim
        return { 
          helia: null, 
          fs: null, 
          jsonHandler: { 
            add: async () => "dummy-cid", 
            get: async () => ({}) 
          } 
        };
      });
  }

  return heliaPromise;
}

// Asıl IPFS istemcisini başlat
async function initHeliaNode() {
  try {
    // IPFS modüllerini dinamik olarak import et
    const { createHelia } = await import('helia');
    const { unixfs } = await import('@helia/unixfs');
    const { json } = await import('@helia/json');
    
    // En basit yapılandırma - hiçbir ek parametre verme
    const helia = await createHelia();
    
    const fs = unixfs(helia);
    const jsonHandler = json(helia);
    
    return { helia, fs, jsonHandler };
  } catch (error) {
    console.error('IPFS düğümü başlatılırken hata:', error);
    throw error;
  }
}

// Herhangi bir içeriği IPFS'e ekle ve CID döndür
export async function addBytes(fs: any, bytes: Uint8Array): Promise<CID | string> {
  if (!fs) {
    console.warn('IPFS: fs henüz hazır değil');
    return "dummy-cid";
  }

  try {
    return fs.addBytes(bytes);
  } catch (error) {
    console.error('IPFS içeriği eklenirken hata:', error);
    return "error-cid";
  }
}

// String içeriği IPFS'e ekle ve CID döndür
export async function addContent(fs: any, content: string): Promise<CID | string> {
  if (!fs) {
    console.warn('IPFS: fs henüz hazır değil');
    return "dummy-cid";
  }

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    return fs.addBytes(bytes);
  } catch (error) {
    console.error('IPFS içeriği eklenirken hata:', error);
    return "error-cid";
  }
}

// JSON içeriğini IPFS'e ekle ve CID döndür
export async function addJsonContent(jsonHandler: any, content: any): Promise<CID | string> {
  if (!jsonHandler) {
    console.warn('IPFS: jsonHandler henüz hazır değil');
    return "dummy-cid";
  }

  try {
    return jsonHandler.add(content);
  } catch (error) {
    console.error('JSON içeriği eklenirken hata:', error);
    return "error-cid";
  }
}

// CID ile içeriği IPFS'den al
export async function getContent(fs: any, cid: CID | string): Promise<string> {
  if (!fs) {
    console.warn('IPFS: fs henüz hazır değil');
    return "";
  }

  try {
    const decoder = new TextDecoder();
    let bytes = new Uint8Array();
    
    for await (const chunk of fs.cat(cid)) {
      const temp = new Uint8Array(bytes.length + chunk.length);
      temp.set(bytes);
      temp.set(chunk, bytes.length);
      bytes = temp;
    }
    
    return decoder.decode(bytes);
  } catch (error) {
    console.error('İçerik alınırken hata:', error);
    return "";
  }
}

// CID ile JSON içeriğini IPFS'den al
export async function getJsonContent(jsonHandler: any, cid: CID | string): Promise<any> {
  if (!jsonHandler) {
    console.warn('IPFS: jsonHandler henüz hazır değil');
    return {};
  }

  try {
    return await jsonHandler.get(cid);
  } catch (error) {
    console.error('JSON içeriği alınırken hata:', error);
    return {};
  }
} 