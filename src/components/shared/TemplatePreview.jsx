import React from 'react';
import { Image as ImageIcon, Video, FileText, Phone, ExternalLink, MessageSquare } from 'lucide-react';

function resolvePublicMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let str = url.trim();
  if (str.includes('r2.cloudflarestorage.com')) {
    const publicBase = 'https://pub-922d0b8e92144ec8adc99d837e581709.r2.dev';
    const pathParts = str.split('/templates/');
    if (pathParts.length > 1) {
      return `${publicBase}/templates/${pathParts[1]}`;
    }
    const anyParts = str.split('/yovoai/');
    if (anyParts.length > 1) {
      return `${publicBase}/${anyParts[1]}`;
    }
  }
  return str;
}

export function TemplatePreview({
  name,
  bodyPreview,
  languageCode,
  whatsappTemplateName,
  headerType = 'NONE',
  headerText = '',
  mediaUrl = '',
  footerText = '',
  buttons = [],
}) {
  const isImage = headerType === 'IMAGE';
  const isVideo = headerType === 'VIDEO';
  const isDoc = headerType === 'DOCUMENT';
  const isText = headerType === 'TEXT' || (headerText && !['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType));
  const activeMediaUrl = resolvePublicMediaUrl(mediaUrl);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B141A] p-4 shadow-2xl max-w-sm mx-auto font-sans">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message Bubble
        </span>
        <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
          {languageCode || 'en'}
        </span>
      </div>

      {/* WhatsApp Message Container */}
      <div className="rounded-2xl bg-[#1F2C34] border border-slate-700/60 overflow-hidden shadow-lg">
        {/* Header: Media (Image/Video/Doc) */}
        {isImage && (
          <div className="w-full h-40 bg-slate-900 relative flex items-center justify-center overflow-hidden border-b border-slate-700/40">
            {activeMediaUrl ? (
              <img
                src={activeMediaUrl}
                alt="Template Header"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x350/064e3b/ffffff?text=Header+Image+Preview';
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-slate-400">
                <ImageIcon className="w-8 h-8 text-emerald-400" />
                <span className="text-[11px] font-medium">Header Image Preview</span>
              </div>
            )}
          </div>
        )}

        {isVideo && (
          <div className="w-full h-36 bg-slate-900 flex flex-col items-center justify-center gap-1.5 text-slate-400 border-b border-slate-700/40">
            <Video className="w-8 h-8 text-purple-400" />
            <span className="text-[11px] font-medium">Header Video Preview</span>
          </div>
        )}

        {isDoc && (
          <div className="p-3 bg-slate-900/90 flex items-center gap-2.5 border-b border-slate-700/40">
            <FileText className="w-6 h-6 text-blue-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium truncate">Document Attachment (PDF)</span>
          </div>
        )}

        {/* Message Body Content */}
        <div className="p-3.5 space-y-2">
          {/* Text Header */}
          {isText && headerText && (
            <div className="font-bold text-white text-sm leading-snug border-b border-slate-700/40 pb-1.5">
              {headerText}
            </div>
          )}

          {/* Body Text */}
          <div className="text-[13px] leading-relaxed text-slate-100 whitespace-pre-wrap font-normal">
            {bodyPreview ? (
              bodyPreview.split(/(\{\{\d+\}\})/g).map((part, i) =>
                /\{\{\d+\}\}/.test(part) ? (
                  <span key={i} className="text-emerald-400 font-mono font-semibold bg-emerald-950/60 px-1 rounded">
                    {part}
                  </span>
                ) : (
                  part
                )
              )
            ) : (
              <span className="text-slate-500 italic">No body text provided.</span>
            )}
          </div>

          {/* Footer Text */}
          {footerText && (
            <div className="text-[11px] text-slate-400 pt-1 font-medium">
              {footerText}
            </div>
          )}
        </div>

        {/* Interactive Buttons */}
        {buttons && buttons.length > 0 && (
          <div className="border-t border-slate-700/60 divide-y divide-slate-700/60 bg-[#1A252C]">
            {buttons
              .filter((b) => b && b.text && b.text.trim())
              .map((btn, idx) => (
                <div
                  key={idx}
                  className="py-2.5 px-3 text-center text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 hover:bg-slate-700/30 transition select-none"
                >
                  {btn.type === 'PHONE_NUMBER' ? (
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  ) : btn.type === 'URL' ? (
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{btn.text}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
