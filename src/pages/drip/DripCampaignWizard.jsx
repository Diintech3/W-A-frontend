import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Rocket,
  Wrench,
  Sparkles,
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Loader2,
  Clock,
} from 'lucide-react';
import { contactsApi, templatesApi } from '../../services/api';
import dripService from '../../services/drip.service';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import TimelineBuilder from './components/TimelineBuilder';
import CostCalculatorCard from './components/CostCalculatorCard';

export default function DripCampaignWizard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('manual'); // 'manual' | 'ai'
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredSendTime, setPreferredSendTime] = useState('10:00');
  const [audienceGroupId, setAudienceGroupId] = useState('');
  const [language, setLanguage] = useState('en');
  const [scheduleType, setScheduleType] = useState('days'); // 'minutes' | 'days' | 'months'

  // Data lists
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [steps, setSteps] = useState([
    {
      order: 1,
      dayOffset: 1,
      offsetValue: 1,
      offsetUnit: 'days',
      sendTime: '10:00',
      templateId: '',
      notes: 'Initial welcome & greeting',
      mediaType: 'text',
      variableMapping: [{ position: 1, source: 'contact.name', fallback: 'Friend' }],
    },
    {
      order: 2,
      dayOffset: 4,
      offsetValue: 4,
      offsetUnit: 'days',
      sendTime: '10:00',
      templateId: '',
      notes: 'Follow-up & brochure share',
      mediaType: 'text',
      variableMapping: [{ position: 1, source: 'contact.name', fallback: 'Valued Customer' }],
    },
    {
      order: 3,
      dayOffset: 8,
      offsetValue: 8,
      offsetUnit: 'days',
      sendTime: '10:00',
      templateId: '',
      notes: 'Special offer & reminder',
      mediaType: 'text',
      variableMapping: [{ position: 1, source: 'contact.name', fallback: 'Valued Contact' }],
    },
  ]);

  const [stepIntervalValue, setStepIntervalValue] = useState(10);
  const [stepIntervalUnit, setStepIntervalUnit] = useState('minutes');

  function applyStepInterval(val, unit) {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setStepIntervalValue(num);
    setStepIntervalUnit(unit);

    setSteps((prev) =>
      prev.map((s, idx) => {
        let offset = 0;
        if (unit === 'days') {
          offset = idx === 0 ? 1 : 1 + idx * num;
        } else {
          offset = idx === 0 ? 0 : idx * num;
        }
        return {
          ...s,
          offsetValue: offset,
          offsetUnit: unit,
          dayOffset: unit === 'days' ? Math.max(1, offset) : 1,
        };
      })
    );
    toast.success(`Steps auto-scheduled with ${num} ${unit} gaps!`, { id: 'interval-toast' });
  }

  function handleScheduleTypeChange(type) {
    setScheduleType(type);
    if (type === 'minutes') {
      setDurationDays(2);
      applyStepInterval(10, 'minutes');
    } else if (type === 'months') {
      setDurationDays(60);
      applyStepInterval(15, 'days');
    } else {
      // Days
      setDurationDays(30);
      applyStepInterval(4, 'days');
    }
  }

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await contactsApi.groups();
        const grps = Array.isArray(res.data?.data?.groups)
          ? res.data.data.groups
          : Array.isArray(res.data?.groups)
          ? res.data.groups
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setGroups(grps);
        if (grps.length > 0) {
          setAudienceGroupId((prev) => prev || grps[0]._id);
        }
      } catch (err) {
        console.error('Failed to load audience groups:', err);
      }
    }

    async function loadTemplates() {
      try {
        const res = await templatesApi.list();
        const tmpls = Array.isArray(res.data?.data?.templates)
          ? res.data.data.templates
          : Array.isArray(res.data?.templates)
          ? res.data.templates
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setTemplates(tmpls);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    }

    loadGroups();
    loadTemplates();
  }, []);

  const selectedGroup = groups.find((g) => g._id === audienceGroupId);
  const audienceCount = selectedGroup?.contactCount || 0;

  // Validation: check if all steps have approved templates
  const templateMap = new Map(templates.map((t) => [String(t._id), t]));
  const allStepsConfigured = steps.length > 0 && steps.every((s) => s.templateId);
  const allTemplatesApproved =
    allStepsConfigured &&
    steps.every((s) => {
      const t = templateMap.get(String(s.templateId)) || s.templateDetails;
      return t?.metaStatus === 'APPROVED';
    });

  // AI Generation Trigger
  async function handleGenerateAIStrategy() {
    if (!goal.trim()) {
      toast.error('Please enter your campaign goal or objective');
      return;
    }
    if (!audienceGroupId) {
      toast.error('Please select an audience group first');
      return;
    }

    setAiGenerating(true);
    try {
      const res = await dripService.generateAi({
        name: name.trim() || `AI Campaign: ${goal.slice(0, 25)}...`,
        goal: goal.trim(),
        durationDays: parseInt(durationDays, 10) || 30,
        startDate,
        preferredSendTime,
        audienceGroupId,
        language,
      });

      if (res.data?.success) {
        const { campaign, allApproved } = res.data.data;
        toast.success(
          allApproved
            ? 'AI Strategy generated with approved templates!'
            : 'AI Strategy generated. Review the draft templates before sending for approval.'
        );
        navigate(`/drip-campaigns/${campaign._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI strategy');
    } finally {
      setAiGenerating(false);
    }
  }

  // Manual Submission
  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    if (!audienceGroupId) {
      toast.error('Please select an audience group');
      return;
    }
    if (!allStepsConfigured) {
      toast.error('Please select an approved template for every step');
      return;
    }
    if (!allTemplatesApproved) {
      toast.error('All selected templates must have APPROVED status from Meta');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        goalDescription: goal.trim(),
        durationDays: parseInt(durationDays, 10) || 30,
        startDate: new Date(startDate).toISOString(),
        preferredSendTime,
        audienceGroupId,
        steps: steps.map((s, idx) => ({
          order: idx + 1,
          dayOffset: s.offsetUnit === 'days' ? (parseInt(s.offsetValue ?? s.dayOffset, 10) || 1) : 1,
          offsetValue: s.offsetValue !== undefined ? Number(s.offsetValue) : (parseInt(s.dayOffset, 10) || 1),
          offsetUnit: s.offsetUnit || 'days',
          sendTime: s.sendTime || preferredSendTime,
          templateId: s.templateId,
          notes: s.notes,
          mediaType: s.mediaType || 'text',
          variableMapping: s.variableMapping || [],
        })),
      };

      const res = await dripService.createManual(payload);
      if (res.data?.success) {
        toast.success('Drip Campaign created successfully!');
        navigate(`/drip-campaigns/${res.data.data.campaign._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create manual campaign');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/drip-campaigns')}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Drip Campaigns
          </button>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Rocket className="w-6 h-6 text-emerald-400" /> Create WhatsApp Drip Campaign
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automate multi-touch lead nurturing sequences across 7 to 60 days on WhatsApp.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mode === 'manual'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Manual Builder
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mode === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Assistant
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form / Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {mode === 'ai' ? (
            /* AI Generation Card */
            <Card className="p-6 bg-slate-900 border-slate-800 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">AI Strategy Generator</h2>
                  <p className="text-xs text-slate-400">
                    Tell AI your campaign goal, duration, and audience to generate a full sequenced strategy.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Campaign Goal & Objective *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Nurture prospective home buyers interested in 3BHK luxury flats in Noida. Send project specs, virtual tour, and festival discount over 30 days."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Campaign Name (Optional)</label>
                    <Input
                      placeholder="e.g. Noida Luxury Villas Drip"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-950/80 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Audience Group *</label>
                    <select
                      value={audienceGroupId}
                      onChange={(e) => setAudienceGroupId(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select Group...</option>
                      {groups.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name} ({g.contactCount || 0} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Duration</label>
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value={7}>7 Days (Quick Nurture)</option>
                      <option value={15}>15 Days (Bi-weekly)</option>
                      <option value={30}>30 Days (Standard 1-Month)</option>
                      <option value={45}>45 Days (Extended)</option>
                      <option value={60}>60 Days (Long-term Nurture)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-950/80 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Dispatch Time (Daily)</label>
                    <Input
                      type="time"
                      value={preferredSendTime}
                      onChange={(e) => setPreferredSendTime(e.target.value)}
                      className="bg-slate-950/80 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="en">English (en)</option>
                      <option value="hi">Hindi (hi)</option>
                      <option value="hinglish">Hinglish</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateAIStrategy}
                  disabled={aiGenerating}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating AI Strategy & Sequence...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Complete Drip Strategy
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ) : (
            /* Manual Builder Form */
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-400" /> Campaign Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Campaign Name *</label>
                    <Input
                      placeholder="e.g. VIP Investor Follow-up Sequence"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-950 border-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Audience Group *</label>
                    <select
                      value={audienceGroupId}
                      onChange={(e) => setAudienceGroupId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">Select Group...</option>
                      {groups.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name} ({g.contactCount || 0} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Schedule Cadence</label>
                    <select
                      value={scheduleType}
                      onChange={(e) => handleScheduleTypeChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="minutes">⏱️ Minutes (Fast Follow-up)</option>
                      <option value="days">📅 Days (Standard Drip)</option>
                      <option value="months">🗓️ Months (Extended Nurture)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {scheduleType === 'minutes' ? 'Active Window' : scheduleType === 'months' ? 'Duration (Months)' : 'Duration (Days)'}
                    </label>
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {scheduleType === 'minutes' && (
                        <>
                          <option value={1}>1 Day (Instant Window)</option>
                          <option value={2}>2 Days (48 Hours)</option>
                          <option value={7}>7 Days (1 Week)</option>
                        </>
                      )}
                      {scheduleType === 'days' && (
                        <>
                          <option value={7}>7 Days (1 Week)</option>
                          <option value={15}>15 Days (Bi-weekly)</option>
                          <option value={30}>30 Days (Standard 1 Month)</option>
                          <option value={45}>45 Days</option>
                          <option value={60}>60 Days</option>
                        </>
                      )}
                      {scheduleType === 'months' && (
                        <>
                          <option value={30}>1 Month (30 Days)</option>
                          <option value={60}>2 Months (60 Days)</option>
                          <option value={90}>3 Months (90 Days)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-950 border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {scheduleType === 'minutes' ? 'Initial Send Time' : 'Dispatch Time (Daily)'}
                    </label>
                    <Input
                      type="time"
                      value={preferredSendTime}
                      onChange={(e) => setPreferredSendTime(e.target.value)}
                      className="bg-slate-950 border-slate-700"
                    />
                  </div>
                </div>

                {/* Global Interval / Gap Control */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Default Gap Between Steps</div>
                      <div className="text-[11px] text-slate-400">Auto-space all 5 steps evenly (e.g. every 10 min, 30 min, or 4 days)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Interval:</span>
                    <input
                      type="number"
                      min="1"
                      value={stepIntervalValue}
                      onChange={(e) => applyStepInterval(e.target.value, stepIntervalUnit)}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 text-center font-mono"
                    />
                    <select
                      value={stepIntervalUnit}
                      onChange={(e) => applyStepInterval(stepIntervalValue, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="minutes">Minutes ⏱️</option>
                      <option value="hours">Hours ⏰</option>
                      <option value="days">Days 📅</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Internal Goal / Notes (Optional)</label>
                  <Input
                    placeholder="Brief description of the sequence goal..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
              </Card>

              {/* Timeline Builder Section */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <TimelineBuilder
                  steps={steps}
                  onChange={setSteps}
                  templates={templates}
                  startDate={startDate}
                />
              </Card>

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400">
                  {allTemplatesApproved ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> All steps linked to approved templates. Ready to save!
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Please select an approved Meta template for every step before saving.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/drip-campaigns')}
                    className="flex-1 sm:flex-none text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !allTemplatesApproved}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 shadow-lg"
                  >
                    {loading ? 'Creating Campaign...' : 'Save Drip Campaign'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Right 1 Col: Cost Calculator */}
        <div className="space-y-6">
          <CostCalculatorCard
            audienceCount={audienceCount}
            steps={steps}
            templates={templates}
          />
        </div>
      </div>
    </div>
  );
}
