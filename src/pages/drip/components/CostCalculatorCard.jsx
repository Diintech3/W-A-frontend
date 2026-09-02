import React from 'react';
import { BarChart2 } from 'lucide-react';

export default function CostCalculatorCard({ audienceCount = 0, steps = [], templates = [] }) {
  const templateMap = new Map((templates || []).map((t) => [String(t._id), t]));

  let marketingSteps = 0;
  let utilitySteps = 0;

  steps.forEach((s) => {
    const template = templateMap.get(String(s.templateId)) || s;
    const cat = (template.category || template.suggestedCategory || 'MARKETING').toUpperCase();
    if (cat === 'UTILITY') utilitySteps++;
    else marketingSteps++;
  });

  const totalSteps = steps.length;
  const totalMarketingMessages = marketingSteps * audienceCount;
  const totalUtilityMessages = utilitySteps * audienceCount;
  const totalMessages = totalMarketingMessages + totalUtilityMessages;

  // Approx Meta rates in INR
  const marketingRate = 0.86;
  const utilityRate = 0.14;
  const estimatedCost = (totalMarketingMessages * marketingRate) + (totalUtilityMessages * utilityRate);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <BarChart2 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">Campaign Cost & Volume Estimator</h3>
            <p className="text-[11px] text-slate-400">Real-time projection based on Meta conversation categories</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Estimated Meta Cost</div>
          <div className="text-lg font-extrabold text-emerald-400">
            ₹{estimatedCost.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400">Target Audience</div>
          <div className="text-base font-bold text-white mt-0.5">{audienceCount.toLocaleString()}</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400">Total Steps</div>
          <div className="text-base font-bold text-cyan-400 mt-0.5">{totalSteps}</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-purple-400">Marketing Steps</div>
          <div className="text-base font-bold text-purple-300 mt-0.5">
            {marketingSteps} <span className="text-[10px] text-slate-500">({totalMarketingMessages})</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[11px] font-medium text-blue-400">Utility Steps</div>
          <div className="text-base font-bold text-blue-300 mt-0.5">
            {utilitySteps} <span className="text-[10px] text-slate-500">({totalUtilityMessages})</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Total WhatsApp Dispatches over campaign duration:</span>
        <span className="font-bold text-white">{totalMessages.toLocaleString()} messages</span>
      </div>
    </div>
  );
}
