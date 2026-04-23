"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Play, Zap, Image as ImageIcon, Check, ArrowRight, Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const token = document.cookie.includes('accessToken');
    setIsAuthenticated(token);
  }, []);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0e0e10]' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0e0e10]/80' : 'bg-white/80'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`} role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>AI Repurposer</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'} transition-colors`} aria-label="Features section">Features</a>
              <a href="#how-it-works" className={`text-sm ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'} transition-colors`} aria-label="How it works section">How it Works</a>
              <a href="#pricing" className={`text-sm ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'} transition-colors`} aria-label="Pricing section">Pricing</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/5 text-zinc-400 hover:text-zinc-200' : 'bg-gray-100 text-gray-600 hover:text-gray-900'} transition-colors`}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={handleAuthClick}
                className={`px-4 py-2 text-sm ${isDark ? 'text-zinc-300 hover:text-zinc-100' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                aria-label={isAuthenticated ? 'Go to dashboard' : 'Sign in to account'}
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </button>
              <button
                onClick={handleAuthClick}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                aria-label={isAuthenticated ? 'Go to dashboard' : 'Get started with AI Repurposer'}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-[#0e0e10]' : 'bg-white'} border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className={`block text-sm ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`}>Features</a>
              <a href="#how-it-works" className={`block text-sm ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`}>How it Works</a>
              <a href="#pricing" className={`block text-sm ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`}>Pricing</a>
              <div className="pt-3 space-y-2">
                <button
                  onClick={toggleTheme}
                  className={`w-full px-4 py-2 text-sm ${isDark ? 'text-zinc-300 border border-white/10' : 'text-gray-600 border border-gray-200'} rounded-lg flex items-center justify-center gap-2`}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button
                  onClick={handleAuthClick}
                  className={`w-full px-4 py-2 text-sm ${isDark ? 'text-zinc-300 border border-white/10' : 'text-gray-600 border border-gray-200'} rounded-lg`}
                >
                  {isAuthenticated ? 'Dashboard' : 'Sign In'}
                </button>
                <button
                  onClick={handleAuthClick}
                  className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-sm text-indigo-400">AI-Powered Content Repurposing</span>
          </div>

          <h1 id="hero-heading" className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'} mb-6 leading-tight`}>
            Transform Your YouTube Videos into
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Multiple Content Formats
            </span>
          </h1>

          <p className={`text-lg sm:text-xl ${isDark ? 'text-zinc-400' : 'text-gray-600'} max-w-2xl mx-auto mb-10`}>
            Turn one YouTube video into blog posts, Twitter threads, Facebook posts, and more. 
            Save hours of work with AI-powered content repurposing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleAuthClick}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              aria-label={isAuthenticated ? 'Go to dashboard' : 'Start free trial'}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              onClick={handleAuthClick}
              className={`w-full sm:w-auto px-8 py-3 ${isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-xl font-semibold transition-all border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
              aria-label={isAuthenticated ? 'View dashboard' : 'View demo'}
            >
              {isAuthenticated ? 'View Dashboard' : 'View Demo'}
            </button>
          </div>

          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'} mt-6`}>No credit card required • Free plan available</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`} aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="features-heading" className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'} mb-4`}>
              Everything You Need to Repurpose YouTube Content
            </h2>
            <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Powerful AI tools to transform your YouTube videos into multiple formats
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Play size={24} className="text-indigo-400" />}
              title="YouTube to Text"
              description="Automatically transcribe YouTube videos with AI-powered speech recognition"
              isDark={isDark}
            />
            <FeatureCard
              icon={<Zap size={24} className="text-indigo-400" />}
              title="AI Content Generation"
              description="Generate blog posts, Twitter threads, and social media content instantly"
              isDark={isDark}
            />
            <FeatureCard
              icon={<ImageIcon size={24} className="text-indigo-400" />}
              title="AI Image Generation"
              description="Create stunning visuals to accompany your repurposed content"
              isDark={isDark}
            />
            <FeatureCard
              icon={<Sparkles size={24} className="text-indigo-400" />}
              title="Multi-Language"
              description="Generate content in Arabic and English with equal quality"
              isDark={isDark}
            />
            <FeatureCard
              icon={<Check size={24} className="text-indigo-400" />}
              title="Ready to Publish"
              description="Get polished, formatted content ready for immediate publishing"
              isDark={isDark}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="how-it-works-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="how-it-works-heading" className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'} mb-4`}>
              How It Works
            </h2>
            <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Three simple steps to transform your YouTube content
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step="1"
              title="Paste Your YouTube URL"
              description="Simply paste the link to your YouTube video"
              isDark={isDark}
            />
            <StepCard
              step="2"
              title="AI Processes Your Content"
              description="Our AI transcribes, analyzes, and generates multiple content formats"
              isDark={isDark}
            />
            <StepCard
              step="3"
              title="Download & Publish"
              description="Get your repurposed content ready to publish across all platforms"
              isDark={isDark}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`} aria-labelledby="pricing-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 id="pricing-heading" className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'} mb-4`}>
              Simple, Transparent Pricing
            </h2>
            <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              period="forever"
              features={[
                "5 jobs per month",
                "Basic content generation",
                "Standard support",
                "Watermarked images",
              ]}
              cta="Get Started"
              onClick={handleAuthClick}
              isDark={isDark}
            />
            <PricingCard
              title="Pro"
              price="$19"
              period="/month"
              features={[
                "Unlimited jobs",
                "Advanced AI models",
                "Priority support",
                "No watermarks",
                "Custom branding",
                "API access",
              ]}
              cta="Start Free Trial"
              popular
              onClick={handleAuthClick}
              isDark={isDark}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-12">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your YouTube Content?
            </h2>
            <p className="text-lg text-indigo-100 mb-8">
              Join thousands of creators saving hours every week
            </p>
            <button
              onClick={handleAuthClick}
              className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg"
              aria-label={isAuthenticated ? 'Go to dashboard' : 'Start free trial'}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>AI Repurposer</span>
            </div>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
              © 2026 AI Repurposer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, isDark }: { icon: React.ReactNode; title: string; description: string; isDark: boolean }) {
  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-zinc-900 border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'} border transition-all`}>
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-gray-900'} mb-2`}>{title}</h3>
      <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{description}</p>
    </div>
  );
}

function StepCard({ step, title, description, isDark }: { step: string; title: string; description: string; isDark: boolean }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
        {step}
      </div>
      <h3 className={`text-xl font-semibold ${isDark ? 'text-zinc-100' : 'text-gray-900'} mb-3`}>{title}</h3>
      <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{description}</p>
    </div>
  );
}

function PricingCard({ title, price, period, features, cta, popular, onClick, isDark }: { 
  title: string; 
  price: string; 
  period: string; 
  features: string[]; 
  cta: string; 
  popular?: boolean;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <div className={`p-8 rounded-2xl border ${popular ? 'border-indigo-500 bg-indigo-500/5' : isDark ? 'border-white/10 bg-zinc-900' : 'border-gray-200 bg-white'} relative`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-full">
          Popular
        </div>
      )}
      <h3 className={`text-xl font-semibold ${isDark ? 'text-zinc-100' : 'text-gray-900'} mb-2`}>{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className={`text-4xl font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>{price}</span>
        <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className={`flex items-center gap-3 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
            <Check size={16} className="text-indigo-400 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          popular 
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
            : isDark ? 'bg-white/10 hover:bg-white/20 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}