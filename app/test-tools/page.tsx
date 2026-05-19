'use client';

import React, { useState } from 'react';
import { 
  Wrench, 
  Sparkles, 
  RotateCcw, 
  CopyCheck, 
  Zap, 
  Database,
  CheckCircle,
  AlertTriangle,
  Play,
  Activity
} from 'lucide-react';

interface ConsoleLog {
  id: string;
  type: 'info' | 'success' | 'warn' | 'error';
  timestamp: string;
  message: string;
}

export default function TestToolsPage() {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({
    resetQuotas: false,
    testIdempotency: false,
    testConcurrency: false,
    wipeDb: false,
  });

  const addLog = (type: ConsoleLog['type'], message: string) => {
    const newLog: ConsoleLog = {
      id: Math.random().toString(),
      type,
      timestamp: new Date().toLocaleTimeString(),
      message,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  const setRunningState = (key: string, val: boolean) => {
    setIsRunning((prev) => ({ ...prev, [key]: val }));
  };

  // 1️⃣ Reset Provider Quotas via Webhook Simulation
  const handleResetQuotas = async () => {
    setRunningState('resetQuotas', true);
    const eventId = `webhook_reset_${Date.now()}`;
    addLog('info', `Simulating subscription payment success. Triggering Webhook eventId: ${eventId}`);

    try {
      const res = await fetch('/api/webhook/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog('success', `Webhook completed. Message: "${data.message}" | Status: ${data.status}`);
      } else {
        addLog('error', `Webhook failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      addLog('error', `Network error during webhook reset: ${err.message}`);
    } finally {
      setRunningState('resetQuotas', false);
    }
  };

  // 2️⃣ Trigger Webhook Multiple Times (Idempotency Test)
  const handleTestIdempotency = async () => {
    setRunningState('testIdempotency', true);
    const eventId = `webhook_idempotency_test_${Math.floor(Math.random() * 100000)}`;
    addLog('info', `Testing HTTP Idempotency. Dispatching 3 parallel calls for SAME eventId: ${eventId}`);

    try {
      // Build 3 parallel requests
      const promises = Array.from({ length: 3 }).map((_, i) => 
        fetch('/api/webhook/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        }).then(async (res) => {
          const data = await res.json();
          return { index: i + 1, status: res.status, data };
        })
      );

      const results = await Promise.all(promises);

      results.forEach((res) => {
        const { index, status, data } = res;
        if (status === 200 && data.success) {
          if (data.status === 'processed') {
            addLog('success', `Request #${index} -> HTTP ${status} (Processed Successfully): Quotas have been reset.`);
          } else {
            addLog('warn', `Request #${index} -> HTTP ${status} (Idempotent Ignore): eventId already exists. No actions repeated.`);
          }
        } else {
          addLog('error', `Request #${index} -> HTTP ${status} Error: ${data.error || 'Server error'}`);
        }
      });

    } catch (err: any) {
      addLog('error', `Network error during idempotency test: ${err.message}`);
    } finally {
      setRunningState('testIdempotency', false);
    }
  };

  // 3️⃣ Generate 10 Leads Instantly (Concurrency Test)
  const handleTestConcurrency = async () => {
    setRunningState('testConcurrency', true);
    addLog('info', `Testing Concurrency. Spawning 10 parallel customer submissions instantly...`);

    const customerNames = [
      'Emma Watson', 'James Bond', 'Sarah Connor', 'Peter Parker', 'Bruce Wayne',
      'Clark Kent', 'Diana Prince', 'Tony Stark', 'Steve Rogers', 'Natasha Romanoff'
    ];

    const cities = ['Austin', 'Chicago', 'San Jose', 'San Diego', 'Denver', 'Boston', 'Seattle', 'Miami', 'Dallas', 'Phoenix'];

    try {
      // Fire 10 parallel lead creation requests
      const promises = Array.from({ length: 10 }).map((_, i) => {
        // Random phone to prevent unique constraints blocking our concurrency checks
        const phone = `+1-${300 + i}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const serviceId = `service-${(i % 3) + 1}`; // Distribute across Service 1, 2, and 3
        const name = customerNames[i];
        const city = cities[i];

        return fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, city, serviceId, description: 'Simulated concurrent spike.' }),
        }).then(async (res) => {
          const data = await res.json();
          return { index: i + 1, status: res.status, serviceId, name, data };
        });
      });

      const results = await Promise.all(promises);

      let successCount = 0;
      let conflictCount = 0;
      let errorCount = 0;

      results.forEach((res) => {
        const { index, status, serviceId, name, data } = res;
        const svcNum = serviceId.split('-')[1];

        if (status === 201 && data.success) {
          successCount++;
          const allocatedText = data.assignedProviders
            .map((pid: string) => `P${pid.split('-')[1]}`)
            .join(', ');
          addLog('success', `Lead #${index} [${name} | Service ${svcNum}] -> Allocated successfully to: [${allocatedText}]`);
        } else if (status === 409) {
          conflictCount++;
          addLog('warn', `Lead #${index} [${name} | Service ${svcNum}] -> Blocked: Duplicate Lead Detected (Unique DB check works!)`);
        } else {
          errorCount++;
          addLog('error', `Lead #${index} [${name} | Service ${svcNum}] -> Failed: ${data.error || 'Server error'}`);
        }
      });

      addLog('info', `Concurrency run complete. Results: ${successCount} Allocated, ${conflictCount} Unique Blocks, ${errorCount} Failures.`);

    } catch (err: any) {
      addLog('error', `Network error during concurrency simulation: ${err.message}`);
    } finally {
      setRunningState('testConcurrency', false);
    }
  };

  // 4️⃣ Wipe Database / Developer Reset
  const handleWipeDb = async () => {
    if (!confirm('Are you sure you want to delete all leads, assignments, and reset quotas back to seeds?')) return;
    setRunningState('wipeDb', true);
    addLog('info', `Invoking database clear utility...`);

    try {
      const res = await fetch('/api/test/reset-db', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        addLog('success', `Database successfully wiped. ${data.message}`);
      } else {
        addLog('error', `Database wipe failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      addLog('error', `Network error during DB clear: ${err.message}`);
    } finally {
      setRunningState('wipeDb', false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex-grow flex flex-col justify-center">
      {/* Page header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start space-x-2">
          <Wrench className="w-8 h-8 text-indigo-400" />
          <span>System Testing Console</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-2xl">
          Simulate payment webhooks, test idempotency under network retries, fire simultaneous lead spikes to test transactions, and monitor results live.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Buttons Control Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Webhook Tools */}
          <div className="bg-[#0b0c10]/70 rounded-2xl border border-slate-800/80 p-5 shadow-lg">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-1.5">
              <span>Webhook Operations</span>
            </h2>

            <div className="space-y-4">
              {/* Button 1: Reset provider quotas */}
              <div className="group">
                <button
                  onClick={handleResetQuotas}
                  disabled={isRunning.resetQuotas}
                  className="w-full inline-flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition text-left text-xs font-semibold text-slate-100 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 transition">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">1️⃣ Reset Provider Quotas</span>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Simulate payment success webhook</span>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
                </button>
              </div>

              {/* Button 2: Test Idempotency */}
              <div className="group">
                <button
                  onClick={handleTestIdempotency}
                  disabled={isRunning.testIdempotency}
                  className="w-full inline-flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition text-left text-xs font-semibold text-slate-100 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 transition">
                      <CopyCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">2️⃣ Test Webhook Idempotency</span>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Send 3 identical webhook calls</span>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
                </button>
              </div>
            </div>
          </div>

          {/* Concurrency Tools */}
          <div className="bg-[#0b0c10]/70 rounded-2xl border border-slate-800/80 p-5 shadow-lg">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-1.5">
              <span>Traffic & Concurrency Tools</span>
            </h2>

            <div className="space-y-4">
              {/* Button 3: Generate 10 Leads Instantly */}
              <div className="group">
                <button
                  onClick={handleTestConcurrency}
                  disabled={isRunning.testConcurrency}
                  className="w-full inline-flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-violet-500/5 transition text-left text-xs font-semibold text-slate-100 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg group-hover:bg-violet-500/20 transition">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">3️⃣ Generate 10 Leads Instantly</span>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Fire 10 simultaneous parallel leads</span>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 transition" />
                </button>
              </div>
            </div>
          </div>

          {/* Database Reset Tools */}
          <div className="bg-[#0b0c10]/70 rounded-2xl border border-slate-800/80 p-5 shadow-lg">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-1.5">
              <span>System Reset</span>
            </h2>

            <div className="space-y-4">
              {/* Reset DB Button */}
              <div className="group">
                <button
                  onClick={handleWipeDb}
                  disabled={isRunning.wipeDb}
                  className="w-full inline-flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/5 transition text-left text-xs font-semibold text-slate-100 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg group-hover:bg-rose-500/20 transition">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-rose-400">Clear Leads & Audit Trail</span>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Reset database back to initial seed state</span>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 transition" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Console Log panel */}
        <div className="lg:col-span-3">
          <div className="bg-[#0b0c10]/70 rounded-2xl border border-slate-800/80 p-5 shadow-lg flex flex-col h-[520px] overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-900">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                <span>Simulation Console</span>
              </h2>
              <button
                onClick={clearLogs}
                className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-950 border border-slate-900 transition"
              >
                Clear Output
              </button>
            </div>

            {/* Console output display */}
            <div className="flex-grow overflow-y-auto space-y-2.5 font-mono text-[10px] leading-relaxed pr-1 max-h-[420px]">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-16">
                  <Activity className="w-6 h-6 text-slate-700 mb-2" />
                  <p>Simulation logs are currently blank.</p>
                  <p className="text-[9px] mt-0.5 text-slate-700">Click any trigger action on the left to fire mock events.</p>
                </div>
              ) : (
                logs.map((log) => {
                  let badgeColor = 'text-sky-400 bg-sky-950/20 border-sky-800/30';
                  let msgColor = 'text-slate-300';
                  let Icon: React.ComponentType<any> = InfoIcon;

                  if (log.type === 'success') {
                    badgeColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30';
                    msgColor = 'text-slate-100';
                    Icon = CheckCircle;
                  } else if (log.type === 'warn') {
                    badgeColor = 'text-amber-400 bg-amber-950/20 border-amber-800/30';
                    msgColor = 'text-amber-200/90';
                    Icon = AlertTriangle;
                  } else if (log.type === 'error') {
                    badgeColor = 'text-rose-400 bg-rose-950/20 border-rose-800/30';
                    msgColor = 'text-rose-300';
                    Icon = ErrorIcon;
                  }

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-[#07070a]/90 border border-slate-900/60 rounded-lg flex items-start space-x-2.5 hover:border-slate-800/50 transition-all duration-150 animate-slideIn"
                    >
                      <div className="text-[9px] text-slate-600 font-medium select-none mt-0.5">{log.timestamp}</div>
                      <div className="mt-0.5 flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${badgeColor} select-none`}>
                        {log.type}
                      </span>
                      <div className={`flex-grow min-w-0 ${msgColor} whitespace-pre-wrap`}>
                        {log.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Micro fallback icon templates
function InfoIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function ErrorIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
