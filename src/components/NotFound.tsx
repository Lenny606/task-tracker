import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
      <div className="glass-panel p-12 rounded-3xl max-w-lg w-full text-center space-y-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-lagoon/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-palm/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4">
          <h1 className="display-title text-8xl md:text-9xl font-bold text-gradient select-none">
            404
          </h1>
          <p className="island-kicker tracking-widest text-lg">Page Not Found</p>
        </div>

        <div className="space-y-4 relative z-10">
          <p className="text-sea-ink-soft text-lg leading-relaxed">
            The path you're looking for seems to have vanished into the digital void. 
            Don't worry, even the best trackers lose the trail sometimes.
          </p>
        </div>

        <div className="pt-4 relative z-10">
          <Link
            to="/"
            className="island-shell inline-flex items-center px-8 py-3.5 rounded-2xl text-sea-ink font-semibold hover:scale-105 active:scale-95 group"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
            Back to Safety
          </Link>
        </div>
      </div>
    </div>
  )
}
