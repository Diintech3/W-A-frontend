import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Edit3,
  X,
  CheckCircle2,
  Clock,
  FileText,
  Save,
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  Phone,
  ExternalLink,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { templatesApi } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { TemplatePreview } from '../../../components/shared/TemplatePreview';

export default function EditDraftTemplateModal({ isOpen, onClose, template, onTemplateUpdated }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('MARKETING');
  const [language, setLanguage] = useState('en');
  const [headerType, setHeaderType] = useState('IMAGE');
  const [headerText, setHeaderText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState([]);
  const [loading, setLoading] = useState(false);
  function compressImageFile(file, maxDimension = 1080, quality = 0.85) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result);
        };
        img.src = e.target?.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (.jpg, .png, .jpeg, .webp)');
      return;
    }

    try {
      const optimizedDataUrl = await compressImageFile(file, 1080, 0.85);
      if (optimizedDataUrl) {
        setMediaUrl(optimizedDataUrl);
        toast.success('Image optimized and loaded successfully!');
      }
    } catch (err) {
      console.warn('Fallback direct read:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setMediaUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    if (!template) return;
    setName(template.name || '');
    setCategory(template.category || 'MARKETING');
    setLanguage(template.languageCode || 'en');
    setHeaderType(template.headerType || (template.headerText ? 'TEXT' : 'IMAGE'));
    setHeaderText(template.headerText || '');
    setMediaUrl(template.mediaUrl || 'https://placehold.co/600x350/064e3b/ffffff?text=Asha+Realty+Graphic');
    setBodyText(template.bodyPreview || template.message || '');
    setFooterText(template.footerText || '');
    setButtons(
      Array.isArray(template.buttons) && template.buttons.length > 0
        ? template.buttons
        : [
            { type: 'QUICK_REPLY', text: '📅 Book Site Visit' },
            { type: 'PHONE_NUMBER', text: 'Call Sales', phoneNumber: '+919876543210' },
          ]
    );
  }, [template, isOpen]);

  if (!isOpen || !template) return null;

  const isApproved = template.metaStatus === 'APPROVED';
  const isPendingAdmin = template.metaStatus === 'PENDING_ADMIN_APPROVAL';

  function handleAddButton(type) {
    if (buttons.length >= 3) {
      toast.error('Meta allows a maximum of 3 buttons per template');
      return;
    }
    if (type === 'PHONE_NUMBER' && buttons.some((b) => b.type === 'PHONE_NUMBER')) {
      toast.error('Meta allows maximum 1 Call button per template');
      return;
    }
    if (type === 'URL' && buttons.some((b) => b.type === 'URL')) {
      toast.error('Meta allows maximum 1 Website URL button per template');
      return;
    }
    setButtons([
      ...buttons,
      {
        type,
        text: type === 'PHONE_NUMBER' ? 'Call Us' : type === 'URL' ? 'Visit Website' : 'Quick Reply',
        phoneNumber: type === 'PHONE_NUMBER' ? '+919876543210' : '',
        url: type === 'URL' ? 'https://' : '',
      },
    ]);
  }

  function handleRemoveButton(index) {
    setButtons(buttons.filter((_, i) => i !== index));
  }

  function handleButtonChange(index, field, value) {
    const updated = [...buttons];
    updated[index][field] = value;
    setButtons(updated);
  }

  async function handleSaveDraft(e) {
    if (e) e.preventDefault();
    if (!bodyText.trim()) {
      toast.error('Template body text cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const res = await templatesApi.update(template._id, {
        name: name.trim() || template.name,
        category,
        languageCode: language,
        headerType,
        headerText,
        mediaUrl,
        bodyPreview: bodyText.trim(),
        footerText,
        buttons,
      });

      if (res.data?.success) {
        toast.success('Template draft updated successfully');
        if (onTemplateUpdated) onTemplateUpdated(res.data.data.template);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update template');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitToAdmin() {
    if (!bodyText.trim()) {
      toast.error('Template body text cannot be empty');
      return;
    }

    setSubmittingToAdmin(true);
    try {
      // 1. Save all details first
      await templatesApi.update(template._id, {
        name: name.trim() || template.name,
        category,
        languageCode: language,
        headerType,
        headerText,
        mediaUrl,
        bodyPreview: bodyText.trim(),
        footerText,
        buttons,
      });

      // 2. Submit to Admin
      const res = await templatesApi.submitToAdmin(template._id);
      if (res.data?.success) {
        toast.success('Template sent to Admin for Meta approval!');
        if (onTemplateUpdated) onTemplateUpdated(res.data.data.template);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit template to admin');
    } finally {
      setSubmittingToAdmin(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Edit3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Review & Edit AI Template Draft</h2>
              <p className="text-xs text-slate-400">
                Customize image graphic, copy, and CTA buttons before sending to Admin for Meta approval.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            {isApproved ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> APPROVED BY META
              </span>
            ) : isPendingAdmin ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> SENT TO ADMIN (AWAITING APPROVAL)
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1">
                <FileText className="w-3 h-3" /> CLIENT DRAFT (NOT SENT YET)
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {template.whatsappTemplateName || template.name}
          </span>
        </div>

        {/* 2-Column Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Template Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isApproved}
                className="bg-slate-950 border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isApproved}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="MARKETING">MARKETING (Promotions, Offers)</option>
                  <option value="UTILITY">UTILITY (Confirmations, Updates)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isApproved}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>
            </div>

            {/* Header Type Selection */}
            <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Header Type (Media / Graphic)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'NONE', label: 'None', icon: FileText },
                  { id: 'TEXT', label: 'Text 📝', icon: Edit3 },
                  { id: 'IMAGE', label: 'Image 📸', icon: ImageIcon },
                  { id: 'VIDEO', label: 'Video 🎥', icon: Video },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    disabled={isApproved}
                    onClick={() => setHeaderType(h.id)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                      headerType === h.id
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              {headerType === 'TEXT' && (
                <div className="pt-2">
                  <Input
                    label="Header Text"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    disabled={isApproved}
                    placeholder="e.g. Special Offer!"
                  />
                </div>
              )}

              {headerType === 'IMAGE' && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Select or Upload Graphic / Image *
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{uploadingMedia ? 'Uploading...' : '📁 Select from Device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isApproved || uploadingMedia}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    disabled={isApproved}
                    placeholder="https://yourdomain.com/banner.jpg"
                    className="bg-slate-950 border-slate-700 text-xs font-mono"
                  />

                  {/* Sample Gallery Presets */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      ✨ Or Choose from Real Estate Presets:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🏡 Master Layout', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Asha+Realty+Master+Layout' },
                        { label: '🏊 3D Amenities & Pool', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Clubhouse+and+Amenities' },
                        { label: '🗺️ Expressway Map', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Location+and+Expressway+Map' },
                        { label: '📜 RERA Certificate', url: 'https://placehold.co/600x350/064e3b/ffffff?text=RERA+Approved+Legal+Docs' },
                        { label: '🎁 ₹2 Lakh Discount Voucher', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Special+Discount+Voucher' },
                        { label: '🚗 Free AC Cab Pass', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Complimentary+AC+Cab+Pass' },
                        { label: '⏳ Weekend Visit Pass', url: 'https://placehold.co/600x350/064e3b/ffffff?text=Final+Weekend+Passes+Left' },
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          disabled={isApproved}
                          onClick={() => setMediaUrl(preset.url)}
                          className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${
                            mediaUrl === preset.url
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Body Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Message Body Text *</label>
                <span className="text-[10px] text-purple-400 font-semibold">
                  Use {'{{1}}'} for contact name
                </span>
              </div>
              <textarea
                rows={5}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                disabled={isApproved}
                placeholder="e.g. Hello {{1}}, welcome to Asha Realty..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>

            {/* Footer Text */}
            <Input
              label="Footer Text (Optional)"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              disabled={isApproved}
              placeholder="e.g. Asha Realty • RERA Approved"
              className="bg-slate-950 border-slate-700 text-xs"
            />

            {/* Interactive CTA Buttons Builder */}
            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Interactive CTA Buttons
                  </div>
                  <div className="text-[10px] text-slate-500">Max 3 buttons (Quick Reply, Call, or Website)</div>
                </div>
                {!isApproved && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddButton('QUICK_REPLY')}
                      className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 py-0.5 px-2 h-auto"
                      disabled={buttons.length >= 3}
                    >
                      + Quick Reply
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddButton('PHONE_NUMBER')}
                      className="text-[11px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 py-0.5 px-2 h-auto"
                      disabled={buttons.length >= 3 || buttons.some((b) => b.type === 'PHONE_NUMBER')}
                    >
                      + Call
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddButton('URL')}
                      className="text-[11px] bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 py-0.5 px-2 h-auto"
                      disabled={buttons.length >= 3 || buttons.some((b) => b.type === 'URL')}
                    >
                      + URL
                    </Button>
                  </div>
                )}
              </div>

              {buttons.length === 0 ? (
                <div className="text-center py-2 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No buttons added.
                </div>
              ) : (
                <div className="space-y-2">
                  {buttons.map((btn, idx) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-800 text-slate-400 shrink-0">
                        {btn.type === 'PHONE_NUMBER' ? '📞 Call' : btn.type === 'URL' ? '🌐 URL' : '💬 Reply'}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={btn.text}
                          disabled={isApproved}
                          onChange={(e) => handleButtonChange(idx, 'text', e.target.value)}
                          placeholder="Button Text"
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                        {btn.type === 'PHONE_NUMBER' && (
                          <input
                            type="text"
                            value={btn.phoneNumber}
                            disabled={isApproved}
                            onChange={(e) => handleButtonChange(idx, 'phoneNumber', e.target.value)}
                            placeholder="+919876543210"
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        )}
                        {btn.type === 'URL' && (
                          <input
                            type="text"
                            value={btn.url}
                            disabled={isApproved}
                            onChange={(e) => handleButtonChange(idx, 'url', e.target.value)}
                            placeholder="https://asharealty.com"
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        )}
                      </div>

                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live WhatsApp Preview */}
          <div className="lg:col-span-5 sticky top-0 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Live Phone Mockup</span>
              <span className="text-[10px] text-emerald-400 font-normal">Auto-updating</span>
            </div>
            <TemplatePreview
              name={name || 'Template Title'}
              bodyPreview={bodyText}
              languageCode={language}
              whatsappTemplateName={template.whatsappTemplateName || 'preview'}
              headerType={headerType}
              headerText={headerText}
              mediaUrl={mediaUrl}
              footerText={footerText}
              buttons={buttons}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto text-xs">
            Cancel
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isApproved && (
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || submittingToAdmin}
                className="flex-1 sm:flex-none text-xs border-slate-700 text-slate-300 hover:bg-slate-800 inline-flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> {loading ? 'Saving...' : 'Save Draft'}
              </Button>
            )}

            {!isApproved && (
              <Button
                onClick={handleSubmitToAdmin}
                disabled={loading || submittingToAdmin}
                className="flex-1 sm:flex-none text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg flex items-center gap-1.5"
              >
                {submittingToAdmin ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending to Admin...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send to Admin for Meta Approval
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
