import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Rocket,
  Pause,
  Play,
  Square,
  Trash2,
  Calendar,
  BarChart3,
  Users,
  CheckCircle2,
  TrendingDown,
  UserX,
  UserCheck,
  MessageSquare,
  Search,
  Droplets,
  Zap,
  Loader2,
  Edit3,
  Save,
  Copy,
} from 'lucide-react';
import dripService from '../../services/drip.service';
import { templatesApi, contactsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import TimelineBuilder from './components/TimelineBuilder';

function formatDueCountdown(dueAt) {
  if (!dueAt) return 'N/A';
  const diffMs = new Date(dueAt).getTime() - Date.now();
  const dateStr = new Date(dueAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffMs <= 0) return `${dateStr} (Due Now ⚡)`;
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `${dateStr} (in ${diffMins} min ⏱️)`;
  const diffHours = (diffMs / 3600000).toFixed(1);
  if (diffHours < 24) return `${dateStr} (in ${diffHours} hr ⏰)`;
  const diffDays = Math.round(diffMs / 86400000);
  return `${dateStr} (in ${diffDays} days 📅)`;
}

export default function DripCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [steps, setSteps] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentTotal, setEnrollmentTotal] = useState(0);
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('');

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'analytics' | 'contacts'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [groups, setGroups] = useState([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    loadCampaign();
    loadTemplates();
    loadGroups();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'contacts') loadEnrollments();
  }, [activeTab, id, enrollmentPage, enrollmentSearch, enrollmentStatusFilter]);

  async function loadGroups() {
    try {
      const res = await contactsApi.groups();
      const grps = Array.isArray(res.data?.data?.groups)
        ? res.data.data.groups
        : Array.isArray(res.data?.groups)
        ? res.data.groups
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setGroups(grps);
    } catch (err) {
      console.error('Failed to load contact groups:', err);
    }
  }

  async function loadCampaign() {
    setLoading(true);
    try {
      const res = await dripService.get(id);
      if (res.data?.success) {
        setCampaign(res.data.data.campaign);
        setNameInput(res.data.data.campaign.name || '');
        setSteps(res.data.data.steps || []);
        setProgressSummary(res.data.data.progressSummary || null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateMeta(updatePayload) {
    setSavingMeta(true);
    try {
      const res = await dripService.update(id, updatePayload);
      if (res.data?.success) {
        toast.success('Campaign settings updated');
        setCampaign(res.data.data.campaign);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campaign');
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleSaveName() {
    if (!nameInput.trim()) {
      toast.error('Campaign name cannot be empty');
      return;
    }
    setSavingMeta(true);
    try {
      const res = await dripService.update(id, { name: nameInput.trim() });
      if (res.data?.success) {
        toast.success('Campaign renamed successfully');
        setEditingName(false);
        setCampaign(res.data.data.campaign);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campaign name');
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleSelectAudienceGroup(newGroupId) {
    if (!newGroupId || newGroupId === campaign.audienceGroupId?._id) return;
    handleUpdateMeta({ audienceGroupId: newGroupId });
  }

  async function loadTemplates() {
    try {
      const res = await templatesApi.list();
      if (res.data?.success) {
        setTemplates(res.data.data.templates || []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }

  async function loadAnalytics() {
    try {
      const res = await dripService.getAnalytics(id);
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }

  async function loadEnrollments() {
    try {
      const res = await dripService.getEnrollments(id, {
        page: enrollmentPage,
        limit: 15,
        search: enrollmentSearch,
        status: enrollmentStatusFilter,
      });
      if (res.data?.success) {
        setEnrollments(res.data.data.enrollments || []);
        setEnrollmentTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load enrollments:', err);
    }
  }

  // Action handlers
  async function handleActivate() {
    setActionLoading(true);
    try {
      const res = await dripService.activate(id);
      if (res.data?.success) {
        toast.success(res.data.message || 'Campaign activated successfully!');
        loadCampaign();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate campaign');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePause() {
    setActionLoading(true);
    try {
      await dripService.pause(id);
      toast.success('Campaign paused');
      loadCampaign();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pause campaign');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResume() {
    setActionLoading(true);
    try {
      await dripService.resume(id);
      toast.success('Campaign resumed and timing adjusted');
      loadCampaign();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume campaign');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStop() {
    if (!window.confirm('Are you sure you want to stop this campaign? All active enrollments will be terminated.')) {
      return;
    }
    setActionLoading(true);
    try {
      await dripService.stop(id);
      toast.success('Campaign stopped');
      loadCampaign();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop campaign');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to completely delete this drip campaign and all its steps?')) {
      return;
    }
    setActionLoading(true);
    try {
      await dripService.delete(id);
      toast.success('Drip campaign deleted');
      navigate('/drip-campaigns');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete campaign');
      setActionLoading(false);
    }
  }

  const [dispatchingId, setDispatchingId] = useState(null);

  async function handleToggleEnrollment(enrollmentId, currentStatus) {
    const nextStatus = currentStatus === 'opted_out' ? 'active' : 'opted_out';
    try {
      await dripService.toggleEnrollmentStatus(id, enrollmentId, nextStatus);
      toast.success(`Contact status changed to ${nextStatus}`);
      loadEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  }

  async function handleDispatchNow(enrollmentId) {
    if (!window.confirm('Send the next WhatsApp step message to this contact immediately for testing?')) {
      return;
    }
    setDispatchingId(enrollmentId);
    try {
      const res = await dripService.dispatchEnrollmentNow(id, enrollmentId);
      if (res.data?.success) {
        toast.success(res.data.message || 'Next step dispatched successfully!');
        loadEnrollments();
        loadAnalytics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch step');
    } finally {
      setDispatchingId(null);
    }
  }

  if (loading || !campaign) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Droplets className="w-8 h-8 text-emerald-400 animate-bounce mx-auto mb-2" />
        Loading campaign details...
      </div>
    );
  }

  const allApproved =
    steps.length > 0 &&
    steps.every((s) => {
      const t =
        (s.templateId && typeof s.templateId === 'object' && s.templateId.name ? s.templateId : null) ||
        s.templateDetails;
      return t?.metaStatus === 'APPROVED' || s.metaStatus === 'APPROVED';
    });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <button
            onClick={() => navigate('/drip-campaigns')}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 mb-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Campaigns
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="text-lg font-extrabold text-white bg-slate-950 border-slate-700 py-1 h-auto min-w-[240px]"
                  placeholder="Enter campaign name..."
                />
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={savingMeta}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 inline-flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNameInput(campaign.name);
                    setEditingName(false);
                  }}
                  className="text-xs text-slate-400"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{campaign.name}</h1>
                {['draft', 'awaiting_approval'].includes(campaign.status) && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-slate-500 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition inline-flex items-center"
                    title="Rename Campaign"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <span
              className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                campaign.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : campaign.status === 'scheduled'
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  : campaign.status === 'paused'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : campaign.status === 'completed'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : campaign.status === 'stopped'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-slate-700/60 text-slate-300 border-slate-600'
              }`}
            >
              ● {campaign.status.toUpperCase()}
            </span>
          </div>
          {campaign.goalDescription && (
            <p className="text-xs text-slate-400 mt-1">{campaign.goalDescription}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['draft', 'awaiting_approval'].includes(campaign.status) && (
            <Button
              onClick={handleActivate}
              disabled={actionLoading || !allApproved}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 shadow-lg flex items-center gap-1.5"
            >
              <Rocket className="w-4 h-4" /> Activate Drip Campaign
            </Button>
          )}

          {campaign.status === 'active' && (
            <Button
              variant="secondary"
              onClick={handlePause}
              disabled={actionLoading}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 text-xs inline-flex items-center gap-1"
            >
              <Pause className="w-3.5 h-3.5" /> Pause Campaign
            </Button>
          )}

          {campaign.status === 'paused' && (
            <Button
              onClick={handleResume}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 inline-flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5" /> Resume Campaign
            </Button>
          )}

          {['active', 'scheduled', 'paused'].includes(campaign.status) && (
            <Button
              variant="secondary"
              onClick={handleStop}
              disabled={actionLoading}
              className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 text-xs inline-flex items-center gap-1"
            >
              <Square className="w-3.5 h-3.5" /> Stop
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={actionLoading}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Campaign Meta Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Audience Group */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
            <span>Audience Group</span>
            {['draft', 'awaiting_approval'].includes(campaign.status) && (
              <span className="text-[10px] text-cyan-400 font-bold">Switch Group</span>
            )}
          </div>
          {['draft', 'awaiting_approval'].includes(campaign.status) && groups.length > 0 ? (
            <select
              value={campaign.audienceGroupId?._id || campaign.audienceGroupId || ''}
              onChange={(e) => handleSelectAudienceGroup(e.target.value)}
              disabled={savingMeta}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-emerald-400 font-bold rounded-lg p-1.5 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} ({(g.contactCount || 0).toLocaleString()} contacts)
                </option>
              ))}
            </select>
          ) : (
            <>
              <div className="text-sm font-bold text-white mt-0.5 truncate">{campaign.audienceGroupId?.name || 'Group'}</div>
              <div className="text-[10px] text-slate-500">{(campaign.totalAudience || 0).toLocaleString()} contacts</div>
            </>
          )}
        </div>

        {/* Card 2: Duration & Steps */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Duration & Steps</div>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">
            {campaign.durationDays || 30} Days ({steps.length} Steps)
          </div>
          <div className="text-[10px] text-slate-500">Mode: {campaign.mode?.toUpperCase()}</div>
        </div>

        {/* Card 3: Start Date */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Start Date</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {new Date(campaign.startDate).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-slate-500">
            {new Date(campaign.startDate) > new Date() ? 'Upcoming Scheduled' : 'Started'}
          </div>
        </div>

        {/* Card 4: Estimated Cost */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Estimated Cost</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            ₹{(campaign.estimatedCost || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">Meta Conversation fees</div>
        </div>
      </div>

      {/* Live Campaign Step Progress Tracker */}
      {progressSummary && (
        <Card
          className={`p-5 border transition-all ${
            progressSummary.isFullyCompleted
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-emerald-400" /> Sequence Progress
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {progressSummary.completedStepsCount} of {progressSummary.totalSteps} Steps Dispatched
              </span>
              {progressSummary.remainingStepsCount > 0 ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {progressSummary.remainingStepsCount} Step(s) Remaining
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" /> ALL STEPS COMPLETED
                </span>
              )}
            </div>

            <div className="text-xs font-bold text-emerald-400 font-mono">
              {progressSummary.overallProgressPercent}% Complete
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-sm shadow-emerald-500/50"
              style={{ width: `${Math.max(3, progressSummary.overallProgressPercent)}%` }}
            />
          </div>

          {/* Completion Status Alert */}
          {progressSummary.isFullyCompleted && (
            <div className="mt-3.5 pt-3 border-t border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Campaign Completed & Stopped:</strong> All {progressSummary.totalSteps} message steps have been delivered to all {progressSummary.totalEnrolled} enrolled contact(s).
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Tabs Switcher */}
      <div className="border-b border-slate-800 flex gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Sequence & Steps
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Funnel Analytics
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'contacts'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Enrolled Contacts ({enrollmentTotal || campaign.totalAudience || 0})
        </button>
      </div>

      {/* Tab 1: Timeline & Steps */}
      {activeTab === 'timeline' && (
        <Card className="p-6 bg-slate-900 border-slate-800">
          <TimelineBuilder
            steps={steps}
            onChange={setSteps}
            templates={templates}
            readOnly={['active', 'completed', 'stopped'].includes(campaign.status)}
            onTemplateUpdated={loadCampaign}
            campaignId={id}
            startDate={campaign.startDate}
          />
        </Card>
      )}

      {/* Tab 2: Analytics & Funnel */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-slate-900 border-slate-800 text-center">
              <div className="text-xs text-slate-400">Active Contacts</div>
              <div className="text-2xl font-bold text-white mt-1">
                {analytics?.summary?.active ?? 0}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900 border-slate-800 text-center">
              <div className="text-xs text-slate-400">Completed Full Sequence</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">
                {analytics?.summary?.completed ?? 0}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900 border-slate-800 text-center">
              <div className="text-xs text-slate-400">Converted (Replied)</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {analytics?.summary?.converted ?? 0}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900 border-slate-800 text-center">
              <div className="text-xs text-slate-400">Opted Out (STOP)</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {analytics?.summary?.opted_out ?? 0}
              </div>
            </Card>
          </div>

          {/* Step-by-Step Funnel */}
          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" /> Step-by-Step Delivery & Read Funnel
            </h3>

            <div className="space-y-4">
              {(analytics?.stepFunnel || []).map((stepItem, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        Step {stepItem.order} (Day {stepItem.dayOffset})
                      </span>
                      <span className="text-xs text-slate-400">{stepItem.notes || 'Touchpoint message'}</span>
                    </div>

                    <div className="text-xs font-semibold text-emerald-400">
                      {stepItem.replied} Replied ({stepItem.readRate}% Read Rate)
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500">Sent</div>
                      <div className="font-bold text-slate-200 mt-0.5">{stepItem.sent}</div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500">Delivered</div>
                      <div className="font-bold text-cyan-400 mt-0.5">{stepItem.delivered}</div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500">Read</div>
                      <div className="font-bold text-purple-400 mt-0.5">{stepItem.read}</div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-500">Replied</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{stepItem.replied}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Contacts & Enrollments Table */}
      {activeTab === 'contacts' && (
        <Card className="p-0 bg-slate-900 border-slate-800 overflow-hidden shadow-xl space-y-4">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm relative">
              <Input
                placeholder="Search by phone number..."
                value={enrollmentSearch}
                onChange={(e) => {
                  setEnrollmentSearch(e.target.value);
                  setEnrollmentPage(1);
                }}
                className="bg-slate-950 border-slate-700 text-xs pl-8"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            </div>

            <div className="flex gap-2">
              {['', 'active', 'converted', 'opted_out', 'completed', 'paused'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setEnrollmentStatusFilter(st);
                    setEnrollmentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    enrollmentStatusFilter === st
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {st ? st.toUpperCase() : 'ALL'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Current Step</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No contact enrollments found.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enr) => (
                    <tr key={enr._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {enr.contactId?.name || 'Contact'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-400">{enr.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">
                          Step {Math.min(enr.currentStepIndex + 1, steps.length)}
                        </span>
                        <span className="text-slate-500 text-[11px] ml-1">of {steps.length}</span>
                        {enr.status === 'completed' && (
                          <span className="block text-[10px] text-emerald-400 font-bold">✓ ALL COMPLETED</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                        {enr.status === 'completed' ? (
                          <span className="text-slate-500">None (Finished)</span>
                        ) : enr.nextDueAt ? (
                          <span className="text-cyan-300 font-semibold">
                            {formatDueCountdown(enr.nextDueAt)}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            enr.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : enr.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : enr.status === 'converted'
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              : enr.status === 'opted_out'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          ● {enr.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {enr.status === 'active' && enr.currentStepIndex < steps.length && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={dispatchingId === enr._id}
                              onClick={() => handleDispatchNow(enr._id)}
                              className="text-[11px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30 font-semibold inline-flex items-center gap-1"
                              title="Send the next step WhatsApp message right now (instant test)"
                            >
                              {dispatchingId === enr._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                              )}
                              Send Next Step Now
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleEnrollment(enr._id, enr.status)}
                            className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
                          >
                            {enr.status === 'opted_out' ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> Re-enable
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" /> Opt-Out
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {enrollmentTotal > 15 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Total {enrollmentTotal} contacts enrolled</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={enrollmentPage <= 1}
                  onClick={() => setEnrollmentPage((p) => p - 1)}
                  className="text-xs"
                >
                  ← Prev
                </Button>
                <span className="self-center font-semibold text-white px-2">
                  Page {enrollmentPage} of {Math.ceil(enrollmentTotal / 15)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={enrollmentPage >= Math.ceil(enrollmentTotal / 15)}
                  onClick={() => setEnrollmentPage((p) => p + 1)}
                  className="text-xs"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
