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
} from 'lucide-react';
import dripService from '../../services/drip.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function DripCampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchCampaigns();
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Drips</div>
            <div className="text-xl font-bold text-white mt-0.5">{activeCount}</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Enrolled</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalEnrolled.toLocaleString()}</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Leads Converted</div>
            <div className="text-xl font-bold text-purple-400 mt-0.5">{totalConverted.toLocaleString()}</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Opted Out (STOP)</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{totalOptedOut.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {/* Campaigns Table Card */}
      <Card className="p-0 bg-slate-900 border-slate-800 overflow-hidden shadow-xl">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Campaign Name</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Audience</th>
                  <th className="py-3.5 px-4">Steps</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Progress / Enrolled</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.map((c) => {
                  const stats = c.stats || {};
                  const isActionLoading = actionLoadingId === c._id;

                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => navigate(`/drip-campaigns/${c._id}`)}
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm hover:text-emerald-400 transition">
                          {c.name}
                        </div>
                        {c.goalDescription && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                            {c.goalDescription}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            c.mode === 'ai'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                          }`}
                        >
                          {c.mode === 'ai' ? (
                            <>
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </>
                          ) : (
                            <>
                              <Wrench className="w-2.5 h-2.5" /> Manual
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-200">
                          {c.audienceGroupId?.name || 'Contact Group'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {(c.totalAudience || 0).toLocaleString()} contacts
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-cyan-400">
                        {c.totalSteps || 0} Steps ({c.durationDays || 30}d)
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(c.status)}</td>

                      <td className="py-4 px-4">
                        <div className="space-y-1 min-w-[120px]">
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
                        className="py-4 px-4 text-right space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.status === 'active' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isActionLoading}
                            onClick={() => handleAction(c._id, 'pause')}
                            className="text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30 inline-flex items-center gap-1"
                          >
                            <Pause className="w-3 h-3" /> Pause
                          </Button>
                        )}

                        {c.status === 'paused' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isActionLoading}
                            onClick={() => handleAction(c._id, 'resume')}
                            className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 inline-flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Resume
                          </Button>
                        )}

                        {['active', 'scheduled', 'paused'].includes(c.status) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isActionLoading}
                            onClick={() => handleAction(c._id, 'stop')}
                            className="text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30 inline-flex items-center gap-1"
                          >
                            <Square className="w-3 h-3" /> Stop
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/drip-campaigns/${c._id}`)}
                          className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Button>

                        <button
                          type="button"
                          title="Delete Campaign"
                          disabled={isActionLoading}
                          onClick={() => handleAction(c._id, 'delete')}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
