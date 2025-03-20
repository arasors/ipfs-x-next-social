import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import { getCustomClaims, isAdminUser } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await connectToDatabase();
    const { sessionId } = await params;
    const body = await request.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'to ve message alanları gerekli' },
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
    
    // Session'ı kontrol et
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session bulunamadı' },
        { status: 404 }
      );
    }

    // Erişim kontrolü
    // Admin/superadmin tüm sessionlara erişebilir
    // Normal kullanıcılar sadece kendi firebaseId'lerine ait sessionlara erişebilir
    if (!isAdminUser(claims) && session.firebaseId !== claims.firebaseId) {
      return NextResponse.json(
        { success: false, error: 'Bu session için yetkiniz yok' },
        { status: 403 }
      );
    }

    // Node server'a istek gönder
    const nodeServerUrl = process.env.NODE_SERVER_URL || 'http://localhost:3001';
    const response = await fetch(`${nodeServerUrl}/api/sessions/${sessionId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-ID': claims.firebaseId || '',
        'X-Merchant-ID': claims.merchantId || '',
        'X-User-Role': claims.role || 'user'
      },
      body: JSON.stringify({ to, message }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, error: error.error || 'Node server hatası' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Mesaj gönderme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 