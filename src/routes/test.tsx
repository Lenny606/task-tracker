import { createFileRoute } from '@tanstack/react-router'
import { useRef, useEffect, useState } from 'react'
import { Sparkles, Zap, Shield, Cpu, Copy, Check, Terminal, Github, ArrowRight, Gauge, Layers, Globe } from 'lucide-react'

export const Route = createFileRoute('/test')({
  component: TestPage,
})

function TestPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [copied, setCopied] = useState(false)

  // Tracking mouse for global background effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText('npx nuxi@latest init my-app')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen bg-[#020420] text-slate-300 font-['Inter',sans-serif] selection:bg-emerald-500/30 overflow-hidden"
      style={{
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`,
      } as React.CSSProperties}
    >
      <style>{`
        @keyframes scan {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .scan-beam {
          animation: scan 4s linear infinite;
        }
        .nitro-shadow {
          box-shadow: 0 0 80px -20px rgba(0, 245, 212, 0.1);
        }
      `}</style>

      {/* --- Background Layers --- */}
      
      {/* 1. Base Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.15] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* 2. Global Mouse Spotlight */}
      <div 
        className="pointer-events-none absolute inset-0 z-10 opacity-40 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(1200px circle at var(--mouse-x) var(--mouse-y), rgba(0, 245, 212, 0.08), transparent 80%)`,
        }}
      />

      {/* 3. Ambient Colors */}
      <div className="absolute top-0 -left-1/4 w-[1000px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 4. Scanning Beam */}
      <div className="absolute top-[40%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none overflow-hidden">
        <div className="scan-beam w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      </div>

      {/* --- Content --- */}

      <div className="relative z-20 flex flex-col items-center justify-center pt-40 pb-20 px-6 text-center max-w-7xl mx-auto space-y-16">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-sm font-bold tracking-tight shadow-xl">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          Ship Full-stack Vite Apps
        </div>

        {/* Hero Typography */}
        <div className="space-y-6 max-w-5xl">
          <h1 className="text-8xl md:text-[10rem] font-black tracking-[-0.04em] text-white leading-[0.85] text-balance">
            Build <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-emerald-400 to-cyan-400">/Servers</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed text-balance font-medium">
            Nitro extends your Vite application with a production-ready server, compatible with any runtime. 
            Add server routes and deploy everywhere with zero-config.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col md:flex-row items-center gap-5 w-full justify-center pt-4">
          <button className="h-16 px-12 rounded-full bg-white text-black font-black text-xl hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20">
            Get Started
          </button>
          
          <div className="relative flex items-center h-16 bg-slate-900/80 backdrop-blur-xl rounded-full border border-slate-800/80 pl-8 pr-4 group hover:border-emerald-500/50 transition-all cursor-text min-w-[320px]">
            <Terminal size={20} className="text-emerald-400 mr-4" />
            <code className="text-slate-200 font-mono text-base font-medium mr-4">npx nuxi@latest init my-app</code>
            <button 
              onClick={copyToClipboard}
              className="ml-auto w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-500 hover:text-white transition-all shadow-inner"
              title="Copy to clipboard"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          </div>

          <a 
            href="https://github.com/nitrojs/nitro" 
            target="_blank"
            className="h-16 px-8 rounded-full flex items-center justify-center gap-3 border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-all text-slate-400 hover:text-white group"
          >
            <Github size={24} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold text-lg">Star on GitHub</span>
          </a>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-20">
          <NitroCard 
            title="Fast" 
            icon={<Gauge size={28} />}
            description="Enjoy the fast Vite 8 development experience with HMR on the server and optimized for production."
            delay="delay-0"
          />
          <NitroCard 
            title="Agnostic" 
            icon={<Layers size={28} />}
            description="Deploy the same codebase to Node.js, Cloudflare Workers, Deno, Bun, Vercel, and more."
            delay="delay-100"
          />
          <NitroCard 
            title="Athentic" 
            icon={<Globe size={28} />}
            description="Nitro adds no overhead to runtime. Build your servers with any modern tool you like."
            delay="delay-200"
          />
        </div>

        {/* Branding Footer */}
        <div className="pt-24 pb-12 flex items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
           <span className="font-black text-2xl tracking-tighter text-white">Vercel</span>
           <span className="font-black text-2xl tracking-tighter text-white">VoidZero</span>
           <span className="font-black text-2xl tracking-tighter text-white">StackBlitz</span>
        </div>
      </div>
    </div>
  )
}

function NitroCard({ title, description, icon, delay }: { title: string, description: string, icon: React.ReactNode, delay: string }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [localMouse, setLocalMouse] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setLocalMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative p-[1px] rounded-[2.5rem] bg-slate-800/40 group overflow-hidden transition-all duration-700 hover:duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-12 ${delay}`}
    >
      {/* 1. Precision Border Glow (The Nitro/Nuxt Effect) */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 hover:duration-300"
        style={{
          background: `radial-gradient(400px circle at ${localMouse.x}px ${localMouse.y}px, rgba(0, 245, 212, 0.5), transparent 80%)`,
        }}
      />

      {/* 2. Main Content Card */}
      <div className="relative h-full bg-[#020420] rounded-[2.5rem] p-12 flex flex-col items-start gap-8">
        {/* Subtle Internal Spotlight */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `radial-gradient(300px circle at ${localMouse.x}px ${localMouse.y}px, rgba(0, 245, 212, 0.05), transparent 80%)`,
          }}
        />

        {/* Icon with Ring */}
        <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700 shadow-2xl group-hover:shadow-emerald-500/20">
          {icon}
        </div>
        
        <div className="space-y-4 text-left">
          <h3 className="text-3xl font-black text-white tracking-tight">{title}</h3>
          <p className="text-lg text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors duration-700">
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 group-hover:text-emerald-400 transition-all pt-4">
          Documentation <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}
