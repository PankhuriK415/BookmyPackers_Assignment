'use client';

import React, { useState } from 'react';
import { User, Phone, MapPin, Sparkles, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function RequestServicePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    serviceId: 'service-1',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    allocated?: string[];
  }>({ type: null, message: '' });

  const services = [
    {
      id: 'service-1',
      title: 'Service Category 1',
      desc: 'Mandatory Provider 1 + Round Robin [P2, P3, P4]',
      badge: 'Tier 1',
    },
    {
      id: 'service-2',
      title: 'Service Category 2',
      desc: 'Mandatory Provider 5 + Round Robin [P6, P7, P8]',
      badge: 'Tier 2',
    },
    {
      id: 'service-3',
      title: 'Service Category 3',
      desc: 'Mandatory [P1, P4] + Round Robin [P2, P3, P5, P6, P7, P8]',
      badge: 'Enterprise',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.city || !formData.serviceId) {
      setStatus({ type: 'error', message: 'Please fill in all mandatory fields.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          type: 'error',
          message: data.error || 'A problem occurred while creating your request.',
        });
      } else {
        setStatus({
          type: 'success',
          message: `Your request was created successfully!`,
          allocated: data.assignedProviders,
        });
        // Clear form except the selected service type
        setFormData({
          name: '',
          phone: '',
          city: '',
          serviceId: formData.serviceId,
          description: '',
        });
      }
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: 'A network error occurred. Please verify your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex-grow flex flex-col justify-center">
      {/* Title */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 mb-4 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Realtime Lead Allocation</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Request Service
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-sm text-slate-400">
          Submit your contact details and let our high-speed, persistent round-robin distribution engine matches you with exactly 3 service providers instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form panel */}
        <div className="md:col-span-2">
          <div className="bg-[#0b0c10]/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-[#0d0f14] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-150 text-sm"
                  />
                </div>
              </div>

              {/* Phone & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 019-2834"
                      required
                      className="block w-full pl-10 pr-4 py-3 bg-[#0d0f14] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-150 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      required
                      className="block w-full pl-10 pr-4 py-3 bg-[#0d0f14] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-150 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Service Cards selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Select Service Type <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-3">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => setFormData((prev) => ({ ...prev, serviceId: svc.id }))}
                      className={`relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                        formData.serviceId === svc.id
                          ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                          : 'bg-[#0d0f14] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-grow pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-slate-100">{svc.title}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              formData.serviceId === svc.id
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {svc.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{svc.desc}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          formData.serviceId === svc.id
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-slate-800 bg-[#07070a]'
                        }`}
                      >
                        {formData.serviceId === svc.id && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Project Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe details about what service specifications you are looking for..."
                  className="block w-full px-4 py-3 bg-[#0d0f14] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-150 text-sm resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Allocating Providers...</span>
                  </span>
                ) : (
                  <>
                    <Send className="w-4.5 h-4.5" />
                    <span>Submit & Allocate Leads</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results / Help sidebar */}
        <div className="md:col-span-1 flex flex-col space-y-6">
          {/* Status Panel */}
          {status.type ? (
            <div
              className={`rounded-2xl border p-5 shadow-lg transition-all duration-300 animate-fadeIn ${
                status.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-start space-x-3">
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {status.type === 'success' ? 'Lead Allocated!' : 'Submission Blocked'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {status.message}
                  </p>

                  {status.type === 'success' && status.allocated && (
                    <div className="mt-4 pt-3 border-t border-emerald-500/20">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        Allocated Providers:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {status.allocated.map((pid) => {
                          const num = pid.split('-')[1];
                          return (
                            <span
                              key={pid}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            >
                              Provider {num}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b0c10]/40 rounded-2xl border border-slate-900 p-5 text-center text-slate-500">
              <p className="text-xs">No active allocation logs to show.</p>
              <p className="text-[10px] mt-1 text-slate-600">
                Submit a new request to see real-time matching results.
              </p>
            </div>
          )}

          {/* Guidelines info card */}
          <div className="bg-[#0b0c10]/70 rounded-2xl border border-slate-800/80 p-5">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center space-x-1.5">
              <span>Lead Distribution Rules</span>
            </h3>
            <ul className="space-y-3.5 text-[11px] text-slate-400">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Strict Unique Policy</strong>: Leads are keyed under <code>UNIQUE(phone, service)</code> at the database engine layer. Repeated submissions are blocked.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Guaranteed Allocation</strong>: Exactly 3 providers are chosen per lead dynamically based on quotas.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Persistent State</strong>: Round-robin selections utilize pointer values stored permanently in the database, avoiding server reboot bias.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
