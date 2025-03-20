import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import { getCustomClaims, canAccessMerchant, isAdminUser } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await connectToDatabase();
    const { sessionId } = await params;

    // Token'dan claims bilgilerini al
    const sessionCookie = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }

    const claims = getCustomClaims(sessionCookie);
    
    // Session bilgisini getir
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

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Session bilgisi hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await connectToDatabase();
    const { sessionId } = await params;

    // Token'dan claims bilgilerini al
    const sessionCookie = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }

    const claims = getCustomClaims(sessionCookie);

    if (!claims.merchantId || !claims.firebaseId) {
      return NextResponse.json(
        { success: false, error: 'Token bilgileri eksik' },
        { status: 401 }
      );
    }

    const data = await request.json();
    // update session
    const session = await Session.findOneAndUpdate(
      { sessionId },
      { $set: data },
      { new: true }
    );

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Session bilgisi hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}