'use client';

import React, { useEffect, useState } from 'react';
import { Users, FileText, Activity, RefreshCw, Layers, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  monthlyQuota: number;
  remainingQuota: number;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  serviceId: string;
  description: string | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
  };
  assignments: {
    provider: {
      id: string;
      name: string;
    };
  }[];
}

interface AssignmentLog {
  id: string;
  leadId: string;
  providerId: string;
  assignedAt: string;
  lead: {
    name: string;
    service: {
      name: string;
    };
  };
  provider: {
    name: string;
  };
}

export default function DashboardPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<AssignmentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'polling' | 'disconnected'>('disconnected');
  const [lastUpdated, setLastUpdated] = useState<string>('Never');

  const fetchDashboardData = async (showIndicator = false) => {
    if (showIndicator) setIsUpdating(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        setLeads(data.leads || []);
        setAssignments(data.assignments || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // 1. Fetch initial statistics
    fetchDashboardData();

    // 2. Set up Server-Sent Events (SSE) for instant real-time pushes
    let eventSource: EventSource | null = null;
    let fallbackPoll: NodeJS.Timeout | null = null;

    try {
      console.log('Connecting to real-time events stream...');
      eventSource = new EventSource('/api/realtime');

      eventSource.onopen = () => {
        console.log('SSE connection successfully established.');
        setConnectionStatus('connected');
      };

      // Listen for lead assignments
      eventSource.addEventListener('lead_assigned', (e: any) => {
        console.log('Realtime event received: Lead Assigned. Refreshing state...');
        fetchDashboardData(true);
      });

      // Listen for quota resets
      eventSource.addEventListener('quotas_reset', (e: any) => {
        console.log('Realtime event received: Quotas Reset. Refreshing state...');
        fetchDashboardData(true);
      });

      eventSource.onerror = (err) => {
        console.warn('SSE disconnected or encountered error. Switching to polling fallback.');
        setConnectionStatus('polling');
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (err) {
      console.error('SSE initialization failed. Falling back to poll.', err);
      setConnectionStatus('polling');
    }

    // 3. Setup periodic polling interval (every 4 seconds) as a robust fallback
    fallbackPoll = setInterval(() => {
      console.log('Executing background sync check...');
      fetchDashboardData(true);
    }, 4000);

    // Cleanup active connections/listeners on component unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackPoll) {
        clearInterval(fallbackPoll);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-medium">Bootstrapping Dashboard data...</span>
      </div>
    );
  }

  // Calculate high-level system summaries
  const totalLeads = leads.length;
  const activeProvidersCount = providers.filter(p => p.remainingQuota > 0).length;
  const depletedProvidersCount = providers.filter(p => p.remainingQuota === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col">
      {/* Dashboard Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-5 border-b border-slate-900 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Provider Control Center</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
            Monitor real-time customer allocations, provider balances, and transactional round-robin audit trails.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center space-x-3 self-start sm:self-center">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b0c10]/80 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500">Sync:</span>
            <span className="relative flex h-2 w-2 mr-1">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connectionStatus === 'connected' ? 'bg-emerald-400' : connectionStatus === 'polling' ? 'bg-indigo-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                connectionStatus === 'connected' ? 'bg-emerald-500' : connectionStatus === 'polling' ? 'bg-indigo-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className={`font-semibold uppercase tracking-wider text-[10px] ${
              connectionStatus === 'connected' ? 'text-emerald-400' : connectionStatus === 'polling' ? 'text-indigo-400' : 'text-rose-400'
            }`}>
              {connectionStatus === 'connected' ? 'SSE Live' : connectionStatus === 'polling' ? 'Active Poll' : 'Offline'}
            </span>
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isUpdating}
            className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition disabled:opacity-50"
            title="Manual Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-[#0b0c10]/70 rounded-xl border border-slate-800/80 p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Leads Received</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{totalLeads}</span>
          </div>
        </div>

        <div className="bg-[#0b0c10]/70 rounded-xl border border-slate-800/80 p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Quota Pool</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{activeProvidersCount} <span className="text-xs font-normal text-slate-500">/ 8</span></span>
          </div>
        </div>

        <div className="bg-[#0b0c10]/70 rounded-xl border border-slate-800/80 p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Depleted Quotas</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{depletedProvidersCount} <span className="text-xs font-normal text-slate-500">/ 8</span></span>
          </div>
        </div>

        <div className="bg-[#0b0c10]/70 rounded-xl border border-slate-800/80 p-5 flex items-center space-x-4">
          <div className="p-3.5 bg-slate-500/10 text-slate-400 rounded-xl border border-slate-800/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Synced At</span>
            <span className="text-base font-bold text-white mt-2 block truncate">{lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-grow">
        {/* Providers and quota trackers - Span 2 columns on large */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b0c10]/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-md">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Provider Quota Balances</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {providers.map((p) => {
                const percent = (p.remainingQuota / p.monthlyQuota) * 100;
                // Colors based on quota status
                let colorClass = 'bg-indigo-500';
                let textClass = 'text-indigo-400 bg-indigo-500/15 border-indigo-500/20';
                if (p.remainingQuota === 0) {
                  colorClass = 'bg-rose-600';
                  textClass = 'text-rose-400 bg-rose-500/15 border-rose-500/20';
                } else if (p.remainingQuota <= 3) {
                  colorClass = 'bg-amber-500';
                  textClass = 'text-amber-400 bg-amber-500/15 border-amber-500/20';
                }

                return (
                  <div
                    key={p.id}
                    className="bg-[#0d0f14] border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition duration-150"
                  >
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="font-semibold text-sm text-slate-200">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${textClass}`}>
                        {p.remainingQuota === 0 ? 'Depleted' : `${p.remainingQuota} Left`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Remaining Quota</span>
                        <span className="font-medium text-slate-300">{p.remainingQuota} / {p.monthlyQuota}</span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Leads list */}
          <div className="bg-[#0b0c10]/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-md overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Recent Leads & Distribution</span>
            </h2>

            {leads.length === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                <p className="text-xs">No leads logged in the database.</p>
                <p className="text-[10px] mt-1 text-slate-600">Submit requests at /request-service to view live feeds.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="pb-3.5">Lead Details</th>
                      <th className="pb-3.5">Service</th>
                      <th className="pb-3.5">City</th>
                      <th className="pb-3.5">Assigned To</th>
                      <th className="pb-3.5 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs">
                    {leads.slice(0, 8).map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-900/10 group transition-all">
                        <td className="py-3.5 pr-2">
                          <span className="block font-semibold text-slate-200 group-hover:text-white transition">
                            {lead.name}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">{lead.phone}</span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                            {lead.service.name}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-300">{lead.city}</td>
                        <td className="py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {lead.assignments.map((asg) => {
                              const num = asg.provider.id.split('-')[1];
                              return (
                                <span
                                  key={asg.provider.id}
                                  className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
                                >
                                  P{num}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 text-right text-[10px] text-slate-500 font-mono">
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Allocation Log Timeline - Span 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-[#0b0c10]/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-md flex flex-col h-full max-h-[650px] overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Allocation Audit Trail</span>
            </h2>

            {assignments.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-16 text-center text-slate-600">
                <Activity className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs">Audit trails will appear as allocation logs populate.</p>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto space-y-4 pr-1 text-[11px] max-h-[500px]">
                {assignments.slice(0, 15).map((log) => {
                  const pNum = log.providerId.split('-')[1];
                  return (
                    <div
                      key={log.id}
                      className="bg-[#0d0f14] border border-slate-800/50 rounded-xl p-3.5 flex items-start space-x-3 hover:border-slate-800 transition"
                    >
                      <div className="mt-0.5 p-1 bg-emerald-500/10 rounded text-emerald-400 border border-emerald-500/15 flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-slate-300 leading-normal">
                          <strong className="text-slate-100 font-semibold">{log.provider.name}</strong> was assigned to customer{' '}
                          <strong className="text-slate-100 font-semibold">{log.lead.name}</strong>
                        </p>
                        <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-500">
                          <span className="font-mono">P{pNum}</span>
                          <span>•</span>
                          <span>{log.lead.service.name}</span>
                          <span>•</span>
                          <span className="font-mono">{new Date(log.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
