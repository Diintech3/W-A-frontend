import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  Plus,
  Clock,
  Trash2,
  Edit3,
  CheckCircle2,
  MousePointerClick,
  FileText,
  Zap,
  Send,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import dripService from '../../../services/drip.service';
import ApprovedTemplateSelectorModal from './ApprovedTemplateSelectorModal';
import VariableMappingForm from './VariableMappingForm';
import EditDraftTemplateModal from './EditDraftTemplateModal';

function formatTime12h(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return '10:00 AM';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '10:00 AM';
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minuteStr = String(m).padStart(2, '0');
  return `${hour12}:${minuteStr} ${period}`;
}

function getScheduledDatePreview(startDate, step, idx = 0, preferredSendTime = '10:00') {
  const unit = step.offsetUnit || 'days';
  const val = Number(step.offsetValue !== undefined ? step.offsetValue : (step.dayOffset ?? 1));

  if (idx === 0) {
    if (unit === 'minutes') {
      if (val <= 0) return '⚡ Immediately on Start';
      return `⏱️ +${val} Min after Start`;
    }
    if (unit === 'hours') {
      if (val <= 0) return '⚡ Immediately on Start';
      return `⏰ +${val} Hr after Start`;
    }
    const timeFormatted = formatTime12h(step.sendTime || preferredSendTime || '10:00');
    return `📅 Day 1 at ${timeFormatted}`;
  }

  if (unit === 'minutes') {
    return `⏱️ +${val} Min after Step ${idx}`;
  }

  if (unit === 'hours') {
    return `⏰ +${val} Hr after Step ${idx}`;
  }

  if (unit === 'months') {
    const timeFormatted = formatTime12h(step.sendTime || preferredSendTime || '10:00');
    return `🗓️ +${val} Month(s) after Step ${idx} at ${timeFormatted}`;
  }

  // Days
  const timeFormatted = formatTime12h(step.sendTime || preferredSendTime || '10:00');
  return `📅 +${val} Day(s) after Step ${idx} at ${timeFormatted}`;
}

export default function TimelineBuilder({
  steps = [],
  onChange,
  templates = [],
  readOnly = false,
  onTemplateUpdated,
  campaignId,
  startDate,
}) {
  const [activeModalStepIndex, setActiveModalStepIndex] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [testStepModal, setTestStepModal] = useState(null); // step object
  const [testPhone, setTestPhone] = useState('916386299554');
  const [sendingTest, setSendingTest] = useState(false);

  const templateMap = new Map((templates || []).map((t) => [String(t._id), t]));

  async function handleSendTestMessage() {
    if (!testPhone.trim()) {
      toast.error('Please enter a valid WhatsApp phone number');
      return;
    }
    if (!campaignId || !testStepModal?._id) {
      toast.error('Campaign must be saved first to send a test message');
      return;
    }

    setSendingTest(true);
    try {
      const res = await dripService.testSendStep(campaignId, testStepModal._id, { testPhone: testPhone.trim() });
      if (res.data?.success) {
        toast.success(res.data.message || 'Test message sent successfully!');
        setTestStepModal(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test message');
    } finally {
      setSendingTest(false);
    }
  }

  function handleAddStep() {
    const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
    const lastDay = lastStep ? (lastStep.offsetValue || lastStep.dayOffset || 0) : 0;
    const lastUnit = lastStep?.offsetUnit || 'days';
    const newStep = {
      order: steps.length + 1,
      dayOffset: lastUnit === 'days' ? lastDay + 5 : 1,
      offsetValue: lastUnit === 'days' ? lastDay + 5 : 30,
      offsetUnit: lastUnit,
      sendTime: '10:00',
      templateId: '',
      notes: '',
      mediaType: 'text',
      variableMapping: [{ position: 1, source: 'contact.name', fallback: 'Valued Contact' }],
    };
    onChange([...steps, newStep]);
  }

  function handleRemoveStep(index) {
    const updated = steps.filter((_, idx) => idx !== index).map((s, idx) => ({ ...s, order: idx + 1 }));
    onChange(updated);
  }

  function handleUpdateStep(index, updates) {
    const updated = [...steps];
    const targetStep = updated[index];
    updated[index] = { ...targetStep, ...updates };
    onChange(updated);

    // Auto-save to backend if campaignId and step._id exist!
    if (campaignId && targetStep?._id) {
      dripService
        .updateStep(campaignId, targetStep._id, updates)
        .then(() => {
          if (updates.sendTime) {
            toast.success(`Step ${index + 1} time updated to ${formatTime12h(updates.sendTime)}`, {
              id: 'step-time-toast',
              duration: 2500,
            });
          }
        })
        .catch((err) => {
          console.error('Failed to auto-save step update:', err);
        });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> Campaign Timeline & Steps
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Define each message dispatch timing and linked approved WhatsApp templates.
          </p>
        </div>

        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddStep}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Next Step
          </Button>
        )}
      </div>

      {steps.length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-2xl p-10 text-center bg-slate-900/30">
          <div className="flex justify-center mb-2">
            <Clock className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium text-sm">No drip steps added yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "Add Next Step" or use the AI Assistant to generate a complete multi-step strategy.
          </p>
          {!readOnly && (
            <Button
              type="button"
              onClick={handleAddStep}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step 1 (Day 1)
            </Button>
          )}
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
          {steps.map((step, idx) => {
            const template =
              (step.templateId && typeof step.templateId === 'object' && step.templateId.name ? step.templateId : null) ||
              templateMap.get(String(step.templateId?._id || step.templateId || '')) ||
              step.templateDetails;
            const isApproved = template?.metaStatus === 'APPROVED' || step.metaStatus === 'APPROVED';
            const isPending = template?.metaStatus === 'PENDING_ADMIN_APPROVAL' || step.metaStatus === 'PENDING_ADMIN_APPROVAL';

            return (
                <div
                  key={idx}
                  className="relative bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl transition space-y-4"
                >
                  {/* Timeline Node Badge on the left line */}
                  <div className="absolute -left-[37px] top-6 w-6 h-6 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-400 shadow-md">
                    {idx + 1}
                  </div>

                  {/* Header Tier 1: Step Title, Status Pill, Dispatch Time Badge & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 tracking-wide">
                        STEP {idx + 1}
                      </span>

                      {/* Step Progress Status Pill (Dispatched / Meta Blocked / In Progress / Upcoming) */}
                      {step.progress?.isCompleted && step.progress?.sentCount > 0 ? (
                        <span className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> DISPATCHED ({step.progress.sentCount} sent)
                          {step.progress.lastSentAt && (
                            <span className="text-[10px] text-emerald-400/80 font-normal">
                              at {new Date(step.progress.lastSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                      ) : step.progress?.isFailed || (step.progress?.failedCount > 0 && step.progress?.sentCount === 0) ? (
                        <span
                          className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5 shadow-sm shadow-rose-500/10"
                          title={step.progress?.lastErrorReason || 'Meta rejected message'}
                        >
                          <X className="w-3.5 h-3.5 text-rose-400" /> META BLOCKED ({step.progress?.lastErrorReason ? step.progress.lastErrorReason.slice(0, 30) + '...' : 'Delivery Failed'})
                        </span>
                      ) : step.progress?.isCurrent ? (
                        <span className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> NEXT IN QUEUE
                        </span>
                      ) : readOnly && step.progress?.isPending ? (
                        <span className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/80 inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> UPCOMING
                        </span>
                      ) : null}

                      {/* Meta Approval Pill */}
                      {isApproved ? (
                        <span className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> APPROVED
                        </span>
                      ) : isPending ? (
                        <span className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> SENT TO ADMIN
                        </span>
                      ) : (
                        <span className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> DRAFT COPY
                        </span>
                      )}

                      {/* Exact Scheduled Dispatch Badge */}
                      <span className="whitespace-nowrap text-[11px] font-medium text-slate-300 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-500/30 inline-flex items-center gap-1.5">
                        <span className="text-slate-400">Dispatch:</span>
                        <strong className="text-cyan-400 font-mono">{getScheduledDatePreview(startDate, step, idx)}</strong>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {!readOnly && template && !isApproved && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                          className="whitespace-nowrap text-xs bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border-purple-500/30 font-semibold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Review / Edit Copy
                        </Button>
                      )}

                      {campaignId && step._id && isApproved && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTestStepModal(step)}
                          className="whitespace-nowrap text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30 font-semibold inline-flex items-center gap-1"
                          title="Send a test message of this step to your phone"
                        >
                          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Test Send
                        </Button>
                      )}

                      {!readOnly && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveModalStepIndex(idx)}
                            className="whitespace-nowrap text-xs bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                          >
                            {template ? 'Swap Template' : 'Select Approved Template'}
                          </Button>

                          {steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition inline-flex items-center"
                              title="Remove Step"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Header Tier 2: Timing Interval & Time Selector Bar */}
                  <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> {idx === 0 ? 'Initial Dispatch:' : 'Interval Gap:'}
                      </span>
                      {readOnly ? (
                        <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-700 font-mono">
                          {idx === 0 && (step.offsetValue === 0 || step.offsetValue === undefined) ? 'Immediate on Start' : `${step.offsetValue !== undefined ? step.offsetValue : (step.dayOffset ?? 1)} ${(step.offsetUnit || 'days').toUpperCase()}`}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={step.offsetValue !== undefined ? step.offsetValue : (step.dayOffset ?? 1)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              const num = isNaN(val) ? 0 : Math.max(0, val);
                              const unit = step.offsetUnit || 'days';
                              handleUpdateStep(idx, {
                                offsetValue: num,
                                offsetUnit: unit,
                                dayOffset: unit === 'days' ? Math.max(1, num) : 1,
                              });
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 text-center"
                          />
                          <select
                            value={step.offsetUnit || 'days'}
                            onChange={(e) => {
                              const unit = e.target.value;
                              const val = step.offsetValue !== undefined ? step.offsetValue : (step.dayOffset ?? 1);
                              handleUpdateStep(idx, {
                                offsetUnit: unit,
                                offsetValue: val,
                                dayOffset: unit === 'days' ? Math.max(1, val) : 1,
                              });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                          >
                            <option value="minutes">Minutes ⏱️</option>
                            <option value="hours">Hours ⏰</option>
                            <option value="days">Days 📅</option>
                            <option value="months">Months 🗓️</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* If Unit is Days or Months, show Time Picker (AM/PM) */}
                    {['days', 'months'].includes(step.offsetUnit || 'days') && (
                      <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                        <span className="text-xs font-semibold text-slate-400">At Time:</span>
                        {readOnly ? (
                          <span className="text-xs font-bold text-cyan-400 bg-slate-900 px-2 py-1 rounded border border-slate-700 font-mono">
                            {step.sendTime ? formatTime12h(step.sendTime) : '10:00 AM'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={step.sendTime || '10:00'}
                              onChange={(e) => handleUpdateStep(idx, { sendTime: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 text-center font-mono"
                              title="Set exact time of day (AM/PM) for this step"
                            />
                            <span className="text-xs font-semibold text-slate-300">
                              ({formatTime12h(step.sendTime || '10:00')})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Template Content or Picker Trigger */}
                <div className="mt-4 space-y-3">
                  {template ? (
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs flex items-center gap-2">
                          <span className="text-slate-400">Template:</span> {template.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            template.category === 'UTILITY'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {template.category || 'MARKETING'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        {template.bodyPreview || template.message || 'No body text available'}
                      </p>
                    </div>
                  ) : (
                    <div
                      onClick={() => !readOnly && setActiveModalStepIndex(idx)}
                      className="border border-dashed border-slate-700 hover:border-emerald-500/60 p-4 rounded-xl text-center bg-slate-950/30 cursor-pointer transition group flex items-center justify-center gap-2"
                    >
                      <MousePointerClick className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                      <span className="text-xs text-slate-400 group-hover:text-emerald-400 transition font-medium">
                        Click to link an approved WhatsApp template for this step
                      </span>
                    </div>
                  )}

                  {/* Notes input */}
                  {!readOnly && (
                    <div>
                      <Input
                        placeholder="Internal notes or objective for this step (optional)..."
                        value={step.notes || ''}
                        onChange={(e) => handleUpdateStep(idx, { notes: e.target.value })}
                        className="bg-slate-950/40 border-slate-800 text-xs py-1"
                      />
                    </div>
                  )}

                  {/* Variable Mapping Section */}
                  {template && (
                    <VariableMappingForm
                      template={template}
                      variableMapping={step.variableMapping || []}
                      onChange={(newMapping) => handleUpdateStep(idx, { variableMapping: newMapping })}
                    />
                  )}

                  {/* Step Delivery Stats Row */}
                  {step.progress && (step.progress.sentCount > 0 || step.progress.failedCount > 0) && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-400 font-semibold">Step Execution:</span>
                        <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          ✓ {step.progress.sentCount} Sent
                        </span>
                        <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                          📨 {step.progress.deliveredCount} Delivered
                        </span>
                        <span className="text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                          👁️ {step.progress.readCount} Read
                        </span>
                        {step.progress.failedCount > 0 && (
                          <span className="text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                            ⚠️ {step.progress.failedCount} Failed
                          </span>
                        )}
                      </div>
                      {step.progress.lastSentAt && (
                        <span className="text-[11px] text-slate-500">
                          Last Dispatched: {new Date(step.progress.lastSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for selecting approved templates */}
      <ApprovedTemplateSelectorModal
        isOpen={activeModalStepIndex !== null}
        onClose={() => setActiveModalStepIndex(null)}
        currentSelectedId={
          activeModalStepIndex !== null
            ? steps[activeModalStepIndex]?.templateId?._id || steps[activeModalStepIndex]?.templateId || ''
            : ''
        }
        onSelect={(selectedTemplate) => {
          if (activeModalStepIndex !== null) {
            handleUpdateStep(activeModalStepIndex, {
              templateId: selectedTemplate._id,
              templateDetails: selectedTemplate,
            });
          }
        }}
      />

      {/* Modal for reviewing and editing draft template copy */}
      <EditDraftTemplateModal
        isOpen={editingTemplate !== null}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate}
        onTemplateUpdated={(updatedT) => {
          if (onTemplateUpdated) onTemplateUpdated(updatedT);
          // Also update in-memory steps list
          const nextSteps = steps.map((s) => {
            const currentTId = s.templateId?._id ? String(s.templateId._id) : String(s.templateId || '');
            if (currentTId === String(updatedT._id)) {
              return { ...s, templateId: updatedT, templateDetails: updatedT, metaStatus: updatedT.metaStatus };
            }
            return s;
          });
          onChange(nextSteps);
        }}
      />

      {/* Modal for sending a real test step WhatsApp message */}
      {testStepModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" /> Send Test Step {testStepModal.order} Message
              </h3>
              <button
                type="button"
                onClick={() => setTestStepModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Instantly dispatch this step's approved WhatsApp template directly to your phone to test message rendering and delivery.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Your WhatsApp Phone Number (with Country Code)
              </label>
              <Input
                placeholder="e.g. 919876543210"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="bg-slate-950 border-slate-700 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">Example: 916386299554</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTestStepModal(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSendTestMessage}
                disabled={sendingTest}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Test Message Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
