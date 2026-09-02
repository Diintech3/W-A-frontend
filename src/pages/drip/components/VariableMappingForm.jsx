import React from 'react';
import { Tag } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

export default function VariableMappingForm({ variableMapping = [], template, onChange }) {
  // Extract variable count from template body (e.g. {{1}}, {{2}})
  const bodyText = template?.bodyPreview || '';
  const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
  const distinctPositions = [...new Set(matches.map((m) => parseInt(m.replace(/\D/g, ''), 10)))].sort((a, b) => a - b);

  // If no {{N}} in body, check sampleParams
  const positions = distinctPositions.length > 0
    ? distinctPositions
    : (template?.sampleParams || []).map((_, i) => i + 1);

  if (!positions.length) {
    return (
      <div className="text-xs text-slate-500 italic py-1">
        This template contains no dynamic variables ({'{{1}}'}).
      </div>
    );
  }

  function handleSourceChange(pos, source) {
    const next = [...variableMapping];
    const idx = next.findIndex((v) => v.position === pos);
    if (idx >= 0) {
      next[idx] = { ...next[idx], source };
    } else {
      next.push({ position: pos, source, fallback: '' });
    }
    onChange(next);
  }

  function handleFallbackChange(pos, fallback) {
    const next = [...variableMapping];
    const idx = next.findIndex((v) => v.position === pos);
    if (idx >= 0) {
      next[idx] = { ...next[idx], fallback };
    } else {
      next.push({ position: pos, source: 'contact.name', fallback });
    }
    onChange(next);
  }

  return (
    <div className="space-y-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-cyan-400" /> Variable Personalization Mapping
        </span>
        <span className="text-[10px] text-slate-500">{positions.length} variable(s) found</span>
      </div>

      <div className="space-y-2">
        {positions.map((pos) => {
          const mapping = variableMapping.find((v) => v.position === pos) || {
            position: pos,
            source: pos === 1 ? 'contact.name' : 'contact.phone',
            fallback: pos === 1 ? 'Valued Contact' : '',
          };

          return (
            <div
              key={pos}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800"
            >
              <div className="sm:col-span-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/30">
                  {`{{${pos}}}`}
                </span>
              </div>

              <div className="sm:col-span-5">
                <select
                  value={mapping.source}
                  onChange={(e) => handleSourceChange(pos, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="contact.name">Contact Name (contact.name)</option>
                  <option value="contact.phone">Phone Number (contact.phone)</option>
                  <option value="contact.email">Email Address (contact.email)</option>
                  <option value="tag:primary">Primary Tag / Category</option>
                  <option value="custom">Custom Static Fallback</option>
                </select>
              </div>

              <div className="sm:col-span-5">
                <Input
                  placeholder="Default Fallback (if missing)"
                  value={mapping.fallback || ''}
                  onChange={(e) => handleFallbackChange(pos, e.target.value)}
                  className="bg-slate-800 border-slate-700 text-xs py-1"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
