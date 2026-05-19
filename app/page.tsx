import React from 'react';
import { Send, LayoutDashboard, Wrench, ShieldAlert, Sparkles, Server, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex-grow flex flex-col justify-center relative">
      {/* Decorative backdrop shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[30vh] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 mb-6 uppercase tracking-widest animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Distribution Engine</span>
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
          Prowider Lead Distribution
        </h1>
        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          A transactional full-stack lead distribution engine designed with strict PostgreSQL row-level locks, fair-share persistent round-robin scheduling, and HTTP webhook idempotency.
        </p>
      </div>

      {/* Interactive Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Card 1: Request Service */}
        <a 
          href="/request-service"
          className="group relative bg-[#0b0c10]/70 hover:bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-indigo-500/40 p-6 flex flex-col justify-between shadow-xl transition-all duration-200"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center justify-center group-hover:scale-110 transition duration-200">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition">
                Customer Request Form
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Submit lead information with hard DB-level uniqueness checks. Matches with exactly 3 providers instantly.
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center space-x-1.5 text-[10px] font-bold text-indigo-400 group-hover:translate-x-1 transition uppercase tracking-wider">
            <span>Simulate Customer Form</span>
            <span>→</span>
          </div>
        </a>

        {/* Card 2: Dashboard */}
        <a 
          href="/dashboard"
          className="group relative bg-[#0b0c10]/70 hover:bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-indigo-500/40 p-6 flex flex-col justify-between shadow-xl transition-all duration-200"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center justify-center group-hover:scale-110 transition duration-200">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition">
                Provider Dashboard
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Watch active quota levels deplete and leads arrive in real-time. Features reactive Server-Sent Events (SSE).
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center space-x-1.5 text-[10px] font-bold text-indigo-400 group-hover:translate-x-1 transition uppercase tracking-wider">
            <span>Open Control Panel</span>
            <span>→</span>
          </div>
        </a>

        {/* Card 3: Test Tools */}
        <a 
          href="/test-tools"
          className="group relative bg-[#0b0c10]/70 hover:bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-violet-500/40 p-6 flex flex-col justify-between shadow-xl transition-all duration-200"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/15 flex items-center justify-center group-hover:scale-110 transition duration-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white group-hover:text-violet-300 transition">
                System Testing Console
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Fire parallel spikes of 10 concurrent leads, trigger identical webhooks for idempotency testing, and wipe DB.
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center space-x-1.5 text-[10px] font-bold text-violet-400 group-hover:translate-x-1 transition uppercase tracking-wider">
            <span>Execute Test Cases</span>
            <span>→</span>
          </div>
        </a>
      </div>

      {/* Engineering specifications segment */}
      <div className="bg-[#0b0c10]/60 rounded-2xl border border-slate-850 p-6 sm:p-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center sm:text-left flex items-center justify-center sm:justify-start space-x-1.5">
          <span>Engine Specifications</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-500">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pessimistic Row Locking</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Prisma transactions execute atomic raw queries with <code>FOR UPDATE</code> locking rules, guaranteeing exact quotas and eliminating parallel race overflows.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Persistent State RR</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              No in-memory cache bias. Allocation states are tracked by a permanent circular pointer inside database records, persisting across instances and system restarts.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Idempotent Webhooks</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Subscription resets require transactional <code>WebhookEvent</code> entries. Repeated retries are safely ignored, preventing duplicate payment resets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
