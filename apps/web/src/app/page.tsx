import { PracticeSetup } from '@/features/assessment/components/PracticeSetup';
import { Terminal, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Technical Assessment Simulator
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Train Speed & Agility Under <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              Authentic Interview Pressure
            </span>
          </h1>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Dynamic engineering challenges generated to your exact tech stack, complete with locked
            tests, an in-browser execution runner, instant live preview, and formative private
            scorecards.
          </p>
        </div>

        {/* Practice Setup Form */}
        <PracticeSetup />

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-slate-400 text-xs">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-900 bg-slate-950/40">
            <Terminal className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-slate-200 block text-sm">StackBlitz Engine</strong>
              In-browser WebContainers run tests in &lt; 3s.
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-900 bg-slate-950/40">
            <Shield className="h-5 w-5 text-sky-400 shrink-0" />
            <div>
              <strong className="text-slate-200 block text-sm">Anti-Cheat Workspace</strong>
              Public tests &amp; configs locked as read-only.
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-900 bg-slate-950/40">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <strong className="text-slate-200 block text-sm">Speed Drill Retry</strong>
              Repeat the same challenge to shave off minutes.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
