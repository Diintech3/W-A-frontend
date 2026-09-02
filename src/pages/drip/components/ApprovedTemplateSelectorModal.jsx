import React, { useState, useEffect } from 'react';
import { CheckCircle2, Zap, X, Inbox, Search } from 'lucide-react';
import { templatesApi } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function ApprovedTemplateSelectorModal({ isOpen, onClose, onSelect, currentSelectedId }) {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchApprovedTemplates();
  }, [isOpen]);

  async function fetchApprovedTemplates() {
    setLoading(true);
    try {
      const res = await templatesApi.list();
      if (res.data?.success) {
        const allT = res.data.data?.templates || [];
        // Strictly filter only APPROVED templates
        setTemplates(allT.filter((t) => t.metaStatus === 'APPROVED'));
      }
    } catch (err) {
      console.error('Failed to load approved templates:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.bodyPreview && t.bodyPreview.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" /> Select Meta-Approved Template
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Only verified and approved templates can be used for automated WhatsApp drip campaigns.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search approved templates by name or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border-slate-700 text-sm pl-8"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
          </div>
          <div className="flex gap-2">
            {['ALL', 'MARKETING', 'UTILITY'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  categoryFilter === cat
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading approved templates...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="flex justify-center">
                <Inbox className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium text-sm">No approved templates found</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ensure templates are submitted and approved in the Templates section.
              </p>
            </div>
          ) : (
            filtered.map((t) => {
              const isSelected = currentSelectedId === t._id;
              return (
                <div
                  key={t._id}
                  onClick={() => {
                    onSelect(t);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{t.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.category === 'UTILITY'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {t.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> APPROVED
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        ● Selected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 font-mono whitespace-pre-wrap line-clamp-3">
                    {t.bodyPreview || 'No preview text'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Language: <strong className="text-slate-400">{t.languageCode || 'en'}</strong></span>
                    <span>Header: <strong className="text-slate-400">{t.headerType || 'TEXT'}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="text-sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
