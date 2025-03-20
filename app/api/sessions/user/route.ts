import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import { getCustomClaims, isAdminUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Token'dan claims bilgilerini al
    const sessionCookie = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Yetkilendirme hatası' },
        { status: 401 }
      );
    }

    const claims = getCustomClaims(sessionCookie);
    
    if (!claims.uid) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz token bilgileri' },
        { status: 400 }
      );
    }

    // Kullanıcının firebaseId'sine göre oturumları getir
    const sessions = await Session.find({ firebaseId: claims.firebaseId });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('Kullanıcı oturumları getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 