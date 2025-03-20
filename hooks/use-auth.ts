'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Kullanıcı oturum açmış
          try {
            // Token'ı kontrol et
            const token = await user.getIdToken(true);
            if (!token) {
              throw new Error('No token available');
            }

            // Token geçerliyse kullanıcıyı ayarla
            setUser(user);
            // Session cookie'sini güncelle
            Cookies.set('session', token, { 
              expires: 1, // 1 gün
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Lax'
            });
          } catch (error) {
            // Token alınamadıysa veya geçersizse oturumu kapat
            //console.error('Token validation error:', error);
            await firebaseSignOut(auth);
            Cookies.remove('session');
            setUser(null);
            router.push('/auth');
          }
        } else {
          // Kullanıcı oturum açmamış
          setUser(null);
          // Session cookie'sini temizle
          Cookies.remove('session');
          
          // Auth sayfasında değilse yönlendir
          const pathname = window.location.pathname;
          if (pathname.startsWith('/dashboard') && 
              pathname !== '/auth' && 
              pathname !== '/auth/register') {
            router.push('/auth');
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Hata durumunda cookie'yi temizle
        Cookies.remove('session');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  // Token yenileme zamanlayıcısı
  useEffect(() => {
    if (!user) return;

    let tokenRefreshInterval: NodeJS.Timeout;

    const refreshToken = async () => {
      try {
        const token = await user.getIdToken(true);
        Cookies.set('session', token, { 
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax'
        });
      } catch (error) {
        console.error('Token refresh error:', error);
        // Token yenilenemezse oturumu kapat
        await firebaseSignOut(auth);
        Cookies.remove('session');
        setUser(null);
        router.push('/auth');
      }
    };

    // Her 30 dakikada bir token'ı yenile
    tokenRefreshInterval = setInterval(refreshToken, 30 * 60 * 1000);

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [user, router]);

  useEffect(() => {
    // Impersonate token kontrolü
    const impersonateToken = localStorage.getItem('impersonateToken');
    if (impersonateToken) {
      // Eğer impersonate token varsa, bu token ile giriş yap
      signInWithCustomToken(auth, impersonateToken)
        .then((userCredential) => {
          // Başarılı giriş
          console.log('Impersonation successful');
          // Token'ı temizle
          localStorage.removeItem('impersonateToken');
        })
        .catch((error) => {
          console.error('Impersonation error:', error);
          // Hata durumunda token'ı temizle
          localStorage.removeItem('impersonateToken');
        });
    }
  }, []);

  const signOut = () => {
    firebaseSignOut(auth).then(() => {
      Cookies.remove('session');
      setUser(null);
      router.push('/auth');
    }).catch((error) => {
      console.error('Sign out error:', error);
    });
  };

  return { user, loading, signOut };
} 