import { NextRequest, NextResponse } from 'next/server';

// Çeşitli IPFS ağ geçitlerini deneyen ve ilk başarılı olanı döndüren fonksiyon
async function fetchFromFirstSuccessfulGateway(cid: string): Promise<{ data: ArrayBuffer, contentType: string } | null> {
  // Deneyeceğimiz ağ geçitleri
  const gateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://azure-central-bobolink-99.mypinata.cloud/ipfs/'
  ];
  
  // Her ağ geçidi dene
  for (const gateway of gateways) {
    try {
      const url = `${gateway}${cid}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
        next: { revalidate: 86400 } // 24 saat önbellekte tut
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const data = await response.arrayBuffer();
        return { data, contentType };
      }
    } catch (error) {
      console.warn(`Gateway ${gateway} failed:`, error);
      // Hata durumunda bir sonraki ağ geçidine geç
      continue;
    }
  }
  
  // Tüm ağ geçitleri başarısız olursa null döndür
  return null;
}

// Bu API endpoint'i, IPFS CID'sinden direkt içeriği getirir ve binary olarak sunar
export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const cid = params.cid;
  
  if (!cid) {
    return NextResponse.json(
      { error: 'CID parametre olarak gereklidir' },
      { status: 400 }
    );
  }
  
  try {
    // IPFS ağ geçitlerinden içeriği getir
    const result = await fetchFromFirstSuccessfulGateway(cid);
    
    if (!result) {
      return NextResponse.json(
        { error: 'IPFS içeriği hiçbir ağ geçidinden getirilemedi' },
        { status: 404 }
      );
    }
    
    // MIME tipini belirle (varsayılan olarak octet-stream)
    const { data, contentType } = result;
    
    // Binary içeriği ve uygun başlıkları içeren bir yanıt oluştur
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('IPFS içeriği getirilirken hata:', error);
    return NextResponse.json(
      { error: 'IPFS içeriği getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 