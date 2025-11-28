"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, Zap, BarChart3, MessageSquare, Calendar } from "lucide-react";

function Header() {
  const { login, authenticated } = usePrivy();

  return (
    <header className="header-jemma">
      <div className="container-jemma flex items-center justify-between">
        <Link href="/" className="text-white text-xl font-semibold tracking-tight">
          Jemma
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-white/80 hover:text-white text-sm transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-white/80 hover:text-white text-sm transition-colors">
            How it Works
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {authenticated ? (
            <Link href="/dashboard" className="btn-jemma-primary">
              Go to Dashboard
            </Link>
          ) : (
            <button onClick={() => login()} className="btn-jemma-primary">
              Get Started
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();

  const handleCTA = () => {
    if (authenticated) {
      router.push("/dashboard");
    } else {
      login();
    }
  };

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container-jemma">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-hero text-gray-900 mb-6">
            Your AI-Powered Content Studio
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform your social media presence with intelligent insights, trend analysis, and AI-generated content ideas tailored to your audience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleCTA} className="btn-jemma-primary text-base px-8 py-4">
              {authenticated ? "Go to Dashboard" : "Start Creating Free"}
            </button>
            <a href="#features" className="btn-jemma-ghost text-base">
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="card-feature">
      <div className="w-12 h-12 rounded-xl bg-[#EBE9FD] flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-[#5B4FE9]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Content Ideas",
      description: "Get personalized content suggestions based on your niche, trending topics, and what resonates with your audience."
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: "Stay ahead of the curve with real-time trend detection and recommendations tailored to your content style."
    },
    {
      icon: Zap,
      title: "Smart Captions",
      description: "Generate engaging captions, hashtags, and hooks in seconds with AI that understands your brand voice."
    },
    {
      icon: BarChart3,
      title: "Performance Insights",
      description: "Track what works with detailed analytics and actionable recommendations to improve your reach."
    },
    {
      icon: MessageSquare,
      title: "AI Chat Assistant",
      description: "Get instant answers about content strategy, best practices, and creative direction from your personal AI advisor."
    },
    {
      icon: Calendar,
      title: "Content Calendar",
      description: "Plan and organize your content pipeline with an intuitive calendar that keeps you consistent."
    }
  ];

  return (
    <section id="features" className="py-20 section-gray">
      <div className="container-jemma">
        <div className="text-center mb-16">
          <h2 className="text-section text-gray-900 mb-4">
            Everything you need to grow
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful tools designed for creators who want to spend less time planning and more time creating.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Connect Your Account",
      description: "Link your TikTok or Instagram profile to unlock personalized insights and recommendations."
    },
    {
      number: "02",
      title: "Get AI-Powered Insights",
      description: "Our AI analyzes trends, your niche, and audience preferences to suggest winning content ideas."
    },
    {
      number: "03",
      title: "Create & Grow",
      description: "Use AI-generated captions, hashtags, and content plans to consistently grow your audience."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container-jemma">
        <div className="text-center mb-16">
          <h2 className="text-section text-gray-900 mb-4">
            Simple to get started
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From sign-up to your first AI-powered content idea in under 2 minutes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-light text-[#5B4FE9]/20 mb-4">{step.number}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();

  const handleCTA = () => {
    if (authenticated) {
      router.push("/dashboard");
    } else {
      login();
    }
  };

  return (
    <section className="py-20 section-dark">
      <div className="container-jemma">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-section text-white mb-6">
            Ready to transform your content?
          </h2>
          <p className="text-lg text-white/80 mb-10">
            Join creators who are using AI to work smarter, not harder. Start free today.
          </p>
          <button
            onClick={handleCTA}
            className="btn-jemma-secondary border-white text-white hover:bg-white hover:text-gray-900"
          >
            {authenticated ? "Go to Dashboard" : "Get Started Free"} →
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-white border-t border-gray-200">
      <div className="container-jemma">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-semibold text-gray-900">Jemma</div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it Works</a>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Jemma. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  // Auto-redirect authenticated users who directly navigate to /
  useEffect(() => {
    if (ready && authenticated) {
      // Check URL params - if they came from a direct navigation, show the landing page
      // If they're just loading the app, redirect to dashboard
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has("view")) {
        // Don't auto-redirect - let them see the landing page
        // They can click "Go to Dashboard" to navigate
      }
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </main>
  );
}
