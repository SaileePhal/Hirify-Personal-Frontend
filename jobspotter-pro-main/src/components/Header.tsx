import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
// 🔥 FIX 3: Import FlaskUser from useAuth
import { useAuth, FlaskUser } from '@/hooks/useAuth'; 
import { 
  Briefcase, 
  Bookmark, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  User,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

// --- Helper Function to format the Name ---
// Function signature now correctly uses the imported FlaskUser type
const getDisplayName = (user: FlaskUser) => {
    // If both first_name and last_name exist, return the full name
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    }

    // Fallback: Use the part of the email before the @
    return user.email?.split('@')[0] || 'Profile';
};
// -------------------------------------------------------------------------------------

export function Header() {
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const candidateLinks = [
    { href: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { href: '/saved', label: 'Saved Jobs', icon: Bookmark },
    { href: '/applications', label: 'My Applications', icon: FileText },
  ];

  const recruiterLinks = [
    { href: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { href: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/recruiter/applications', label: 'Applications', icon: FileText },
  ];

  const links = role === 'recruiter' ? recruiterLinks : candidateLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-hero rounded-lg p-2">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">JobBoard</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {user && links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-secondary" />
          ) : user ? (
            <>
              {/* User Profile Display Logic */}
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                
                <User className="h-4 w-4 text-muted-foreground" />
                
                <span className="text-sm font-medium text-foreground">
                  {/* Call the helper function to get the name */}
                  {getDisplayName(user)}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {role}
                </span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {user && links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="hero" size="sm" className="w-full">
                  Get Started
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}