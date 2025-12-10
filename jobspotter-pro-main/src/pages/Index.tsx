import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, 
  Search, 
  Users, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';

export default function Index() {
  const { user, role } = useAuth();

  const features = [
    {
      icon: Search,
      title: 'Smart Job Matching',
      description: 'Find opportunities that match your skills and experience perfectly.',
    },
    {
      icon: Zap,
      title: 'Instant Applications',
      description: 'Apply to jobs with just a few clicks using your saved profile.',
    },
    {
      icon: Shield,
      title: 'Verified Employers',
      description: 'All job listings are from verified and trusted companies.',
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Access resources to help you advance in your career.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Jobs' },
    { value: '5K+', label: 'Companies' },
    { value: '50K+', label: 'Candidates' },
    { value: '95%', label: 'Success Rate' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
              <Briefcase className="h-4 w-4" />
              Your career journey starts here
            </div>
            
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Find Your{' '}
              <span className="text-primary">Dream Job</span>{' '}
              Today
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Connect with top companies and discover opportunities that match your 
              skills, experience, and career goals. Your next chapter begins here.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <Link to={role === 'recruiter' ? '/recruiter/dashboard' : '/jobs'}>
                  <Button size="xl" variant="hero">
                    {role === 'recruiter' ? 'Go to Dashboard' : 'Browse Jobs'}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="xl" variant="hero">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/jobs">
                    <Button size="xl" variant="outline">
                      Browse Jobs
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="font-display text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Why Choose JobBoard?
            </h2>
            <p className="mt-4 text-muted-foreground">
              We make it easy to find the right opportunity or the perfect candidate.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Sections */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* For Candidates */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
              <div className="mb-6 inline-flex rounded-lg bg-primary/10 p-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                For Job Seekers
              </h3>
              <p className="mt-2 text-muted-foreground">
                Find your next opportunity from thousands of job listings.
              </p>
              <ul className="mt-6 space-y-3">
                {['Create your profile in minutes', 'Save jobs and track applications', 'Get notified about new opportunities'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-6 inline-block">
                <Button>
                  Start Job Search
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* For Recruiters */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
              <div className="mb-6 inline-flex rounded-lg bg-accent/10 p-3">
                <Building2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                For Recruiters
              </h3>
              <p className="mt-2 text-muted-foreground">
                Find the perfect candidates for your open positions.
              </p>
              <ul className="mt-6 space-y-3">
                {['Post jobs in seconds', 'Manage applications easily', 'Access talented candidates'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-6 inline-block">
                <Button variant="accent">
                  Post a Job
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="gradient-hero rounded-lg p-2">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">JobBoard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 JobBoard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
