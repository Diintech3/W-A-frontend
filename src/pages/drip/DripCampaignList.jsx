import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Droplets,
  Plus,
  Trash2,
  Zap,
  Users,
  Target,
  Ban,
  RefreshCw,
  Play,
  Pause,
  Square,
  ArrowRight,
  Sparkles,
  Wrench,
  Copy,
  MoreVertical,
  Eye,
  IndianRupee,
  Send,
} from 'lucide-react';
import dripService from '../../services/drip.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function DripCampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchCampaigns();
    function handleGlobalClick() {
      setOpenMenuId(null);
    }
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await dripService.list();
      if (res.data?.success) {
        setCampaigns(res.data.data?.campaigns || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch drip campaigns');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(campaignId, action) {
    if (action === 'delete') {
      if (!window.confirm('Are you sure you want to completely delete this drip campaign and all its steps?')) {
        return;
      }
    }
    setActionLoadingId(campaignId);
    try {
      if (action === 'duplicate') {
        const res = await dripService.duplicate(campaignId);
        toast.success(res.data?.message || 'Campaign duplicated as draft at top!');
        await fetchCampaigns();
        return;
      }
      if (action === 'pause') await dripService.pause(campaignId);
      if (action === 'resume') await dripService.resume(campaignId);
      if (action === 'stop') {
        if (!window.confirm('Are you sure you want to stop this drip campaign? This will permanently end enrollments.')) {
          setActionLoadingId(null);
          return;
        }
        await dripService.stop(campaignId);
      }
      if (action === 'delete') {
        await dripService.delete(campaignId);
      }
      toast.success(`Campaign ${action}d successfully`);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} campaign`);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Summary Metrics
  const activeCount = campaigns.filter((c) => c.status === 'active').length;
  const totalEnrolled = campaigns.reduce((acc, c) => acc + (c.stats?.totalEnrolled || c.totalAudience || 0), 0);
  const totalConverted = campaigns.reduce((acc, c) => acc + (c.stats?.converted || 0), 0);
  const totalOptedOut = campaigns.reduce((acc, c) => acc + (c.stats?.optedOut || 0), 0);
  const totalDispatched = campaigns.reduce((acc, c) => acc + (c.stats?.totalSent || 0), 0);
  const totalAmountSpent = campaigns.reduce((acc, c) => acc + (c.stats?.totalSpent || (c.stats?.totalSent || 0) * 1.0), 0);

  function getStatusBadge(status) {
    const config = {
      active: { text: 'ACTIVE', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      scheduled: { text: 'SCHEDULED', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      paused: { text: 'PAUSED', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      draft: { text: 'DRAFT', bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
      awaiting_approval: { text: 'AWAITING APPROVAL', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      completed: { text: 'COMPLETED', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      stopped: { text: 'STOPPED', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    };
    const c = config[status] || { text: status.toUpperCase(), bg: 'bg-slate-800 text-slate-400' };
    return (
      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${c.bg}`}>
        ● {c.text}
      </span>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Droplets className="w-6 h-6 text-emerald-400" /> WhatsApp Drip Campaigns
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automate personalized follow-ups, voter outreach, and lead nurturing sequences on schedule.
          </p>
        </div>

        <Button
          onClick={() => navigate('/drip-campaigns/new')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Drip Campaign
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Drips</div>
            <div className="text-xl font-bold text-white mt-0.5">{activeCount}</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Enrolled</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalEnrolled.toLocaleString()}</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Dispatched</div>
            <div className="text-xl font-bold text-cyan-400 mt-0.5 font-mono">{totalDispatched.toLocaleString()}</div>
          </div>
        </Card>

        {/* 💰 Total Amount Incurred (₹1 per message) */}
        <Card className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/40 flex items-center gap-3 shadow-lg shadow-emerald-500/5">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Total Amount</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5 font-mono">
              ₹{totalAmountSpent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[9px] text-slate-400 font-medium">₹1.00 / msg sent</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Leads Converted</div>
            <div className="text-xl font-bold text-purple-400 mt-0.5">{totalConverted.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {/* Campaigns Table Card */}
      <Card className="p-0 bg-slate-900 border-slate-800 shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">All Drip Sequences</h2>
          <Button variant="ghost" size="sm" onClick={fetchCampaigns} className="text-xs text-slate-400 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Droplets className="w-10 h-10" />
              </div>
            </div>
            <h3 className="text-base font-bold text-slate-200">No Drip Campaigns Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start your first automated sequence using either the step-by-step Manual Builder or AI Strategy Generator.
            </p>
            <Button
              onClick={() => navigate('/drip-campaigns/new')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs mt-2 flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[220px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Campaign Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Mode</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Audience</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Steps</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Messages &amp; Cost</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Progress / Enrolled</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.map((c, idx) => {
                  const stats = c.stats || {};
                  const isActionLoading = actionLoadingId === c._id;
                  const campaignSpent = stats.totalSpent !== undefined ? stats.totalSpent : (stats.totalSent || 0) * 1.0;

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => navigate(`/drip-campaigns/${c._id}`)}
                    >
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-white text-sm hover:text-emerald-400 transition truncate max-w-[220px]">
                          {c.name}
                        </div>
                        {c.goalDescription && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[220px] mt-0.5">
                            {c.goalDescription}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            c.mode === 'ai'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {c.mode === 'ai' ? (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-purple-400" /> AI Strategy
                            </>
                          ) : (
                            <>
                              <Wrench className="w-2.5 h-2.5 text-slate-400" /> Manual
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {c.audienceGroupId?.name || 'All Contacts'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {(c.totalAudience || 0).toLocaleString()} contacts
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap font-bold text-cyan-400 font-mono">
                        {c.totalSteps || 0} Steps ({c.durationDays || 30}d)
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">{getStatusBadge(c.status)}</td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                          <span>₹{campaignSpent.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 font-normal font-sans">({stats.totalSent || 0} sent)</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {stats.deliveredCount || stats.totalSent || 0} delivered
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1 min-w-[120px] max-w-[140px]">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Active: {stats.active || 0}</span>
                            <span className="text-emerald-400 font-bold">
                              Conv: {stats.converted || 0}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{
                                width: `${
                                  stats.totalEnrolled > 0
                                    ? Math.min(100, Math.round(((stats.converted || 0) / stats.totalEnrolled) * 100))
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td
                        className="py-4 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === c._id ? null : c._id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 transition border border-slate-800 hover:border-slate-700 inline-flex items-center justify-center"
                              title="More Options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === c._id && (
                              <div
                                className={`absolute right-0 w-48 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800 ${
                                  idx >= Math.max(1, campaigns.length - 2)
                                    ? 'bottom-full mb-1.5 origin-bottom-right'
                                    : 'top-full mt-1.5 origin-top-right'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  {c.status === 'paused' && (
                                    <button
                                      type="button"
                                      disabled={isActionLoading}
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleAction(c._id, 'resume');
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-emerald-400 hover:bg-emerald-500/15 flex items-center gap-2 transition font-bold"
                                    >
                                      <Play className="w-3.5 h-3.5 text-emerald-400" /> Resume Campaign
                                    </button>
                                  )}

                                  {c.status === 'active' && (
                                    <button
                                      type="button"
                                      disabled={isActionLoading}
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleAction(c._id, 'pause');
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-amber-400 hover:bg-amber-500/15 flex items-center gap-2 transition font-bold"
                                    >
                                      <Pause className="w-3.5 h-3.5 text-amber-400" /> Pause Campaign
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(`/drip-campaigns/${c._id}`);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-emerald-400 flex items-center gap-2 transition"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> View / Edit Sequence
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleAction(c._id, 'duplicate');
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-cyan-400 flex items-center gap-2 transition"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-cyan-400" /> Duplicate (Copy)
                                  </button>

                                  {['active', 'scheduled', 'paused'].includes(c.status) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleAction(c._id, 'stop');
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 transition"
                                    >
                                      <Square className="w-3.5 h-3.5 text-amber-400" /> Stop Campaign
                                    </button>
                                  )}
                                </div>

                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleAction(c._id, 'delete');
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete Sequence
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
