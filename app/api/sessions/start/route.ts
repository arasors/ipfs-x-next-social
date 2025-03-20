import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import { getCustomClaims, isAdminUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { sessionId, name = `Oturum ${Date.now()}` } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId gerekli' },
        { status: 400 }
      );
    }

    // Token'dan claims bilgilerini al
    const sessionCookie = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }

    const claims = getCustomClaims(sessionCookie);
    
    // merchantId ve firebaseId kontrolü
    if (!claims.merchantId || !claims.firebaseId) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz token bilgileri' },
        { status: 400 }
      );
    }

    // Mevcut session'ı kontrol et
    let session = await Session.findOne({ sessionId });
    
    if (session) {
      // Sadece kendi session'larını güncelleyebilir (admin/superadmin hariç)
      if (session.firebaseId !== claims.firebaseId && claims.role !== 'admin' && claims.role !== 'superadmin') {
        return NextResponse.json(
          { success: false, error: 'Bu session için yetkiniz yok' },
          { status: 403 }
        );
      }
      
      // Session'ı güncelle
      session.status = 'connecting';
      await session.save();
    } else {
      // Yeni session oluştur
      session = new Session({
        sessionId,
        name,
        status: 'connecting',
        merchantId: claims.merchantId,
        firebaseId: claims.firebaseId
      });
      await session.save();
    }

    // Node server'a istek gönder
    const nodeServerUrl = process.env.NODE_SERVER_URL || 'http://localhost:3001';
    const response = await fetch(`${nodeServerUrl}/api/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-ID': claims.firebaseId || '',
        'X-Merchant-ID': claims.merchantId || '',
        'X-User-Role': claims.role || 'user'
      },
      body: JSON.stringify({ 
        sessionId, 
        name,
        merchantId: claims.merchantId,
        firebaseId: claims.firebaseId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, error: error.error || 'Node server hatası' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error: any) {
    console.error('Session başlatma hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 