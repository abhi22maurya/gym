import { useState, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useAuth, SignInButton } from '@clerk/clerk-react';
import { setApiAuth, getUserProfile } from '../lib/api';
import { Onboarding } from '../pages/Onboarding';
import { Dumbbell, Activity, ShieldCheck } from 'lucide-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function SplashAuth() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: 'var(--bg-primary)', padding: 24, textAlign: 'center'
    }}>
      <div className="animate-fade-in">
        <div style={{
          width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, var(--color-blue), var(--color-indigo))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          boxShadow: '0 12px 32px rgba(0, 122, 255, 0.3)'
        }}>
          <Dumbbell size={40} color="white" />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 12 }}>
          Antigravity AI
        </h1>
        <p style={{ fontSize: 17, color: 'var(--label-secondary)', maxWidth: 280, margin: '0 auto 40px', lineHeight: 1.4 }}>
          Your personal tracking ecosystem. Powered by Apple design.
        </p>

        <SignInButton mode="modal">
          <button style={{
            background: 'var(--label-primary)', color: 'var(--bg-primary)', border: 'none',
            padding: '16px 32px', borderRadius: 100, fontSize: 17, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto',
            boxShadow: '0 8px 24px rgba(255,255,255,0.1)',
            transition: 'all 0.2s var(--spring)'
          }}>
            <ShieldCheck size={20} />
            Continue securely
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

function AuthenticatedLogic({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function init() {
      if (!userId) return;
      try {
        const token = await getToken();
        setApiAuth(userId, token);
        
        // Check profile
        try {
          await getUserProfile();
          setNeedsOnboarding(false);
        } catch (err: any) {
          if (err.response?.status === 404) {
            setNeedsOnboarding(true);
          }
        }
      } catch (err) {
        console.error('Auth init error', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [getToken, userId]);

  if (loading) return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity className="animate-spin" size={24} color="var(--color-blue)" /></div>;

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  // Graceful degradation for local testing without keys
  if (!PUBLISHABLE_KEY) {
    console.warn("No Clerk Publishable Key found in environment. Running in Demo Mode.");
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SignedOut>
        <SplashAuth />
      </SignedOut>
      <SignedIn>
        <AuthenticatedLogic>{children}</AuthenticatedLogic>
      </SignedIn>
    </ClerkProvider>
  );
}
