import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { Briefcase, Loader2, Mail, Lock, User, Building2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/jobs');
    }
  }, [user, navigate]);

// Inside src/pages/Auth.tsx

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
       // 🔥 FIX: Destructure the user and error from the signIn response
        const { user: signedInUser, error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError); 
        } else if (signedInUser) {
          // If user object is returned (success), navigate to jobs page.
          // NOTE: The useEffect at the top of Auth.tsx should handle this navigation,
          // but explicitly navigating here ensures a smooth transition.
          navigate('/jobs'); 
        } else {
          // Should not happen if signIn is implemented correctly, but good for guardrails
          setError('Sign in failed. Please try again.');
        }
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        // --- FIX FOR SIGN UP ---
        // This is correct for sign up, as it doesn't log the user in immediately
        const { error: signUpError } = await signUp(email, password, role, name);
        if (signUpError) {
          if (signUpError.includes('already registered')) {
            setError('This email is already registered. Please sign in.');
          } else {
            setError(signUpError);
          }
        } else {
          setMessage('Check your email to confirm your account!');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden gradient-hero lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-primary-foreground/20 p-3">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="font-display text-3xl font-bold text-primary-foreground">
              JobBoard
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground">
            Find your dream job or the perfect candidate
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Connect with top companies and talented professionals. 
            Your next opportunity is just a click away.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <p className="text-3xl font-bold text-primary-foreground">10k+</p>
              <p className="text-sm text-primary-foreground/70">Active Jobs</p>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <p className="text-3xl font-bold text-primary-foreground">5k+</p>
              <p className="text-sm text-primary-foreground/70">Companies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="gradient-hero rounded-lg p-2">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">JobBoard</span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {isLogin 
              ? 'Enter your credentials to access your account' 
              : 'Get started by creating your account'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
                {message}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        role === 'candidate'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">Candidate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('recruiter')}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        role === 'recruiter'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                      <span className="font-medium">Recruiter</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setMessage('');
              }}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
