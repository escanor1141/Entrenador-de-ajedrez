"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Search, BarChart3, BookOpen, Target, Zap, TrendingUp, Crown, TrainFront } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(`/dashboard/${encodeURIComponent(username.trim())}`);
    }
  };

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Opening Statistics",
      description: "Detailed winrate analysis for every opening in your repertoire",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Opening Explorer",
      description: "Interactive move trees showing your most played lines",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Error Heatmap",
      description: "Identify mistakes by game phase and piece type",
      color: "from-red-500 to-orange-500",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Performance Tracking",
      description: "Compare your white and black winrates over time",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Stockfish Analysis",
      description: "Real-time engine evaluation for critical positions",
      color: "from-yellow-500 to-amber-500",
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Line Recommendations",
      description: "Smart suggestions to improve your weak openings",
      color: "from-indigo-500 to-violet-500",
    },
    {
      icon: <TrainFront className="w-6 h-6" />,
      title: "Repertoire Training",
      description: "Spaced repetition drills to memorize your openings",
      color: "from-rose-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm bg-background/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-yellow/30 blur-lg rounded-full" />
              <Trophy className="w-8 h-8 text-accent-yellow relative" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Lotus<span className="text-gradient">Chess</span>
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="/train"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2"
            >
              <TrainFront className="w-4 h-4" />
              <span>Entrenar</span>
            </a>
            <a
              href="https://lichess.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2"
            >
              <span>Powered by</span>
              <span className="font-semibold text-foreground">Lichess</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Trophy icon with glow */}
          <div className="relative mb-8 animate-float">
            <div className="absolute inset-0 bg-accent-yellow/20 blur-2xl rounded-full" />
            <Trophy className="w-24 h-24 text-accent-yellow mx-auto relative drop-shadow-lg" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Lotus<span className="text-gradient">Chess</span>
            <span className="block text-3xl md:text-4xl mt-2 text-muted-foreground font-normal">
              Analyzer
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Unlock your chess potential with AI-powered opening analysis. 
            Track your progress, identify weaknesses, and master your repertoire.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mb-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your Lichess username"
                  className="input-styled pl-12 text-lg"
                />
              </div>
              <button
                type="submit"
                className="btn-primary text-lg px-8"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <span className="flex items-center gap-2">
                  Analyze
                  <TrendingUp className={`w-5 h-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                </span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free analysis of your games from Lichess.org
            </p>
          </form>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 card-hover group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-gradient transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4 text-accent-yellow" />
            <span>LotusChess Analyzer</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Data provided by the <a href="https://lichess.org/api" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Lichess API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
