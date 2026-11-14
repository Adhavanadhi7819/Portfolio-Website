import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Phone,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Edit3,
  MessageSquare,
  ExternalLink,
  X,
  Plus,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { validateContactForm } from '../utils/portfolioLogic';
import { ContactFormData, ContactFormErrors, DesignerInfo, SectionTargetTab } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { submitContactMessage } from '../utils/portfolioServerSync';

interface ContactSectionProps {
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onEditContact?: () => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
  currentTab?: SectionTargetTab;
  onChangeTab?: (tab: SectionTargetTab) => void;
  showDragHandle?: boolean;
  onDragStartPointer?: (e: React.PointerEvent) => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Official Latest Brand SVG Logos (Icon-Only)
const LinkedInLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const ArtStationLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M1.77 16.88L3.89 20.5a2.1 2.1 0 001.82 1.05h11.02l-2.69-4.67H1.77zm18.7-1.66L13.7 3.5a2.1 2.1 0 00-1.82-1.05H8.56l10.22 17.71 1.69-2.94a2.1 2.1 0 000-2zm-7.53-.65L9.06 7.83 5.17 14.57h7.77z" />
  </svg>
);

const InstagramLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const YouTubeLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const WhatsAppLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375a9.92 9.92 0 004.75 1.219h.004c5.516 0 9.969-4.453 9.969-9.969 0-2.656-1.031-5.156-2.906-7.031A9.93 9.93 0 0012.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1-.328-1.719-.641-3.031-1.313-5-4.375-5.156-4.578-.156-.203-1.234-1.641-1.234-3.125 0-1.484.781-2.219 1.063-2.516.281-.297.609-.375.813-.375.203 0 .406 0 .578.016.188.016.438-.078.688.516.25.609.859 2.094.938 2.25.078.156.125.344.031.547-.094.203-.141.328-.281.5-.141.172-.297.375-.422.5-.141.141-.297.297-.125.594.172.297.766 1.266 1.641 2.047 1.125 1 2.078 1.313 2.375 1.469.297.156.469.125.641-.078.172-.203.734-.859.938-1.156.203-.297.406-.25.672-.141.266.109 1.703.813 2 .953.297.141.484.219.563.344.078.125.078.734-.172 1.438z" />
  </svg>
);

interface IstTimeParts {
  hours: string;
  minutes: string;
  seconds: string;
  period: string;
}

function getIstTimeParts(): IstTimeParts {
  const now = new Date();
  const timeParts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).formatToParts(now);

  const hour = timeParts.find((p) => p.type === 'hour')?.value || '12';
  const minute = timeParts.find((p) => p.type === 'minute')?.value || '00';
  const second = timeParts.find((p) => p.type === 'second')?.value || '00';
  const period = (timeParts.find((p) => p.type === 'dayPeriod')?.value || 'AM').toUpperCase();

  return {
    hours: hour,
    minutes: minute,
    seconds: second,
    period
  };
}

const DEFAULT_INQUIRY_OPTIONS = [
  'Game Design & Level Design',
  '3D Modeling & Environment Art',
  'Game Studio Role / Full-Time Inquiry',
  'Freelance / Collaboration Inquiry'
];

export const ContactSection: React.FC<ContactSectionProps> = ({
  designerInfo = DESIGNER_INFO,
  isOwnerMode = false,
  onEditContact,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow,
  currentTab,
  onChangeTab,
  showDragHandle,
  onDragStartPointer
}) => {
  const info = designerInfo || DESIGNER_INFO;
  const inquiryOptions =
    Array.isArray(info.contactInquiryOptions) && info.contactInquiryOptions.length > 0
      ? info.contactInquiryOptions
      : DEFAULT_INQUIRY_OPTIONS;

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    projectType: inquiryOptions[0] || 'Game Design & Level Design',
    message: ''
  });

  const [formErrors, setFormErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedDetails, setSubmittedDetails] = useState<{
    recipientEmail: string;
    subject: string;
    body: string;
  } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [istTime, setIstTime] = useState<IstTimeParts>(() => getIstTimeParts());
  const [editingSocialId, setEditingSocialId] = useState<
    'linkedin' | 'artstation' | 'instagram' | 'youtube' | 'whatsapp' | null
  >(null);
  const [socialUrlDraft, setSocialUrlDraft] = useState('');
  const [isEditingInquiryOptions, setIsEditingInquiryOptions] = useState(false);
  const [newInquiryOption, setNewInquiryOption] = useState('');

  useEffect(() => {
    if (!inquiryOptions.includes(formData.projectType) && inquiryOptions.length > 0) {
      setFormData((prev) => ({ ...prev, projectType: inquiryOptions[0] }));
    }
  }, [inquiryOptions, formData.projectType]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIstTime(getIstTimeParts());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof ContactFormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const result = validateContactForm(formData);
    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        projectType: formData.projectType,
        message: formData.message.trim(),
        recipientEmail: info.email
      });
      setSubmittedDetails({
        recipientEmail: response.recipientEmail || info.email,
        subject: `Portfolio Inquiry: ${formData.projectType} — ${formData.name.trim()}`,
        body: `Name: ${formData.name.trim()}\nEmail: ${formData.email.trim()}\nFocus: ${formData.projectType}\n\n${formData.message.trim()}`
      });
      setIsSubmitted(true);
      setFormErrors({});
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to send message right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      projectType: inquiryOptions[0] || 'Game Design & Level Design',
      message: ''
    });
    setIsSubmitted(false);
    setSubmittedDetails(null);
    setSubmitError(null);
  };

  const handleUpdateInquiryOption = (idx: number, val: string) => {
    const next = [...inquiryOptions];
    next[idx] = val;
    onUpdateDesignerInfo?.({ contactInquiryOptions: next });
  };

  const handleRemoveInquiryOption = (idx: number) => {
    if (inquiryOptions.length <= 1) return;
    const next = inquiryOptions.filter((_, i) => i !== idx);
    onUpdateDesignerInfo?.({ contactInquiryOptions: next });
  };

  const handleAddInquiryOption = () => {
    const trimmed = newInquiryOption.trim();
    if (!trimmed) return;
    onUpdateDesignerInfo?.({ contactInquiryOptions: [...inquiryOptions, trimmed] });
    setNewInquiryOption('');
  };

  const displayPhone = info.phone?.startsWith('+')
    ? info.phone
    : info.phone?.length === 10
    ? `+91 ${info.phone}`
    : info.phone;

  const socialPlatforms: Array<{
    id: 'linkedin' | 'artstation' | 'instagram' | 'youtube' | 'whatsapp';
    field: 'linkedinUrl' | 'artstationUrl' | 'instagramUrl' | 'youtubeUrl' | 'whatsappUrl';
    label: string;
    url: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'linkedin',
      field: 'linkedinUrl',
      label: 'LinkedIn',
      url: info.linkedinUrl || 'https://www.linkedin.com/in/adhavan-p',
      icon: <LinkedInLogo className="w-4.5 h-4.5" />
    },
    {
      id: 'artstation',
      field: 'artstationUrl',
      label: 'ArtStation',
      url: info.artstationUrl || 'https://www.artstation.com/adhavan7819',
      icon: <ArtStationLogo className="w-4.5 h-4.5" />
    },
    {
      id: 'instagram',
      field: 'instagramUrl',
      label: 'Instagram',
      url: info.instagramUrl || 'https://www.instagram.com/',
      icon: <InstagramLogo className="w-4.5 h-4.5" />
    },
    {
      id: 'youtube',
      field: 'youtubeUrl',
      label: 'YouTube',
      url: info.youtubeUrl || 'https://www.youtube.com/',
      icon: <YouTubeLogo className="w-4.5 h-4.5" />
    },
    {
      id: 'whatsapp',
      field: 'whatsappUrl',
      label: 'WhatsApp',
      url:
        info.whatsappUrl ||
        'https://wa.me/918072647909?text=Hi%20Adhavan%2C%20I%20saw%20your%20Game%20Designer%20portfolio!',
      icon: <WhatsAppLogo className="w-4.5 h-4.5" />
    }
  ];

  const handleOpenSocialEdit = (
    platform: (typeof socialPlatforms)[number]
  ) => {
    setEditingSocialId(platform.id);
    setSocialUrlDraft(platform.url);
  };

  const handleSaveSocialUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocialId) return;
    const target = socialPlatforms.find((p) => p.id === editingSocialId);
    if (!target) return;
    const trimmed = socialUrlDraft.trim();
    if (trimmed) {
      onUpdateDesignerInfo?.({ [target.field]: trimmed });
    }
    setEditingSocialId(null);
    setSocialUrlDraft('');
  };

  return (
    <section
      id="contact"
      className="pt-20 sm:pt-24 pb-10 sm:pb-12 relative bg-[#050507] flex-1 flex flex-col justify-center"
    >
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="contact"
          sectionTitle="Contact & Inquiry Section"
          currentTab={currentTab}
          onChangeTab={onChangeTab}
          showDragHandle={showDragHandle}
          onDragStartPointer={onDragStartPointer}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditContact}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      {/* Subtle Ambient Monochromatic Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[560px] h-[340px] bg-amber-500/8 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
        {/* 1. Centered Hero Title Block + Compact Live IST Pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <div className="text-xs font-mono tracking-[0.2em] text-amber-400 uppercase font-semibold">
            <InlineEdit
              value={info.contactBadge || 'GET IN TOUCH'}
              onSave={(val) => onUpdateDesignerInfo?.({ contactBadge: val })}
              isOwnerMode={isOwnerMode}
              className="text-amber-400 font-mono font-semibold"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tight">
            <InlineEdit
              value={info.contactHeading || "Let's Work Together"}
              onSave={(val) => onUpdateDesignerInfo?.({ contactHeading: val })}
              isOwnerMode={isOwnerMode}
              className="text-white font-black"
            />
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-lg mx-auto">
            <InlineEdit
              value={
                info.contactSubheading ||
                "Have a project in mind? I'd love to hear about it. Reach out for collaborations, freelance work, or just to say hello."
              }
              onSave={(val) => onUpdateDesignerInfo?.({ contactSubheading: val })}
              isOwnerMode={isOwnerMode}
              multiline={true}
              className="text-zinc-400"
            />
          </p>

          {/* Compact Centered Live IST Time Pill with Animated Seconds */}
          <div className="pt-3 flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(192,169,223,0.9)]" />
                <span className="font-semibold text-zinc-200">LIVE IST TIME</span>
                <span className="text-zinc-500 text-[10px] hidden sm:inline">(UTC+05:30)</span>
              </div>

              <span className="h-3.5 w-px bg-zinc-800" />

              <div className="flex items-baseline font-mono font-bold text-base sm:text-lg tracking-wider tabular-nums">
                <span className="text-white">{istTime.hours}</span>
                <span className="text-amber-400 mx-0.5">:</span>
                <span className="text-white">{istTime.minutes}</span>
                <span className="text-amber-400 mx-0.5">:</span>
                <span className="relative inline-flex justify-center min-w-[2.1ch] overflow-hidden align-bottom">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={istTime.seconds}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="text-amber-400 inline-block"
                    >
                      {istTime.seconds}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="ml-1.5 text-[11px] text-zinc-400 font-semibold">
                  {istTime.period}
                </span>
              </div>
            </div>
          </div>

          {isOwnerMode && (
            <div className="pt-1">
              <button
                onClick={onEditContact}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Contact Details &amp; Social URLs</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* 2. Two Equal Side-by-Side Contact Cards (Email + Phone / WhatsApp) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {/* Left Card: Email */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="rounded-2xl bg-zinc-950/90 border border-zinc-800/90 hover:border-amber-500/45 p-6 flex flex-col justify-between gap-6 transition-colors shadow-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Mail className="w-5 h-5" />
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(info.email, 'email')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Copy email address"
                >
                  {copiedField === 'email' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                  Email
                </span>
                <a
                  href={`mailto:${info.email}`}
                  className="text-base sm:text-lg font-heading font-bold text-white hover:text-amber-400 transition-colors break-all"
                >
                  {info.email}
                </a>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Best for project inquiries and collaborations. I typically respond within 24–48 hours.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <a
                href={`mailto:${info.email}`}
                className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 font-medium"
              >
                <span>Compose Mail</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-zinc-500 text-[11px]">Fast Turnaround</span>
            </div>
          </motion.div>

          {/* Right Card: Phone / WhatsApp */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="rounded-2xl bg-zinc-950/90 border border-zinc-800/90 hover:border-amber-500/45 p-6 flex flex-col justify-between gap-6 transition-colors shadow-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Phone className="w-5 h-5" />
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(displayPhone, 'phone')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Copy phone number"
                >
                  {copiedField === 'phone' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                  Phone / WhatsApp
                </span>
                <a
                  href={`tel:${info.phone}`}
                  className="text-base sm:text-lg font-heading font-bold text-white hover:text-amber-400 transition-colors"
                >
                  {displayPhone}
                </a>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  For urgent matters or quick calls. Available during IST business hours.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <a
                href={
                  info.whatsappUrl ||
                  'https://wa.me/918072647909?text=Hi%20Adhavan%2C%20I%20saw%20your%20Game%20Designer%20portfolio!'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 font-medium"
              >
                <span>Direct Dial / WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-zinc-500 text-[11px]">IST Business Hours</span>
            </div>
          </motion.div>
        </motion.div>

        {/* 3. Centered Direct Message Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease: EASE_OUT_EXPO }}
          className="max-w-2xl mx-auto rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex items-center gap-2.5 mb-6">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h2 className="text-base sm:text-lg font-heading font-bold text-white">
              Send Direct Message
            </h2>
          </div>

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Message Sent!</h4>
                <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Your message has been sent to{' '}
                  <strong className="text-amber-400">
                    {submittedDetails?.recipientEmail || info.email}
                  </strong>{' '}
                  and saved in Adhavan&apos;s inbox.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                  {submittedDetails && (
                    <a
                      href={`mailto:${submittedDetails.recipientEmail}?subject=${encodeURIComponent(
                        submittedDetails.subject
                      )}&body=${encodeURIComponent(submittedDetails.body)}`}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open in Mail App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-mono text-zinc-400 mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Alex Morgan"
                      className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                        formErrors.name
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-mono text-zinc-400 mb-1.5"
                    >
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="alex@studio.com"
                      className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                        formErrors.email
                          ? 'border-red-500 focus:border-red-400'
                          : 'border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="projectType"
                      className="block text-xs font-mono text-zinc-400"
                    >
                      Project Focus / Role
                    </label>
                    {isOwnerMode && (
                      <button
                        type="button"
                        onClick={() => setIsEditingInquiryOptions((v) => !v)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingInquiryOptions ? 'Done Editing' : 'Edit Options'}</span>
                      </button>
                    )}
                  </div>

                  <select
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {inquiryOptions.map((option, idx) => (
                      <option key={`${idx}-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  {isOwnerMode && isEditingInquiryOptions && (
                    <div className="mt-2.5 p-3 rounded-xl bg-zinc-900/80 border border-amber-500/35 space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                        Customize Dropdown Options (Add / Edit / Remove)
                      </span>
                      <div className="space-y-1.5">
                        {inquiryOptions.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleUpdateInquiryOption(idx, e.target.value)}
                              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                              aria-label={`Option ${idx + 1}`}
                            />
                            {inquiryOptions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveInquiryOption(idx)}
                                className="p-1.5 rounded-lg bg-zinc-950 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 cursor-pointer transition-colors"
                                title="Remove option"
                                aria-label={`Remove option ${option}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newInquiryOption}
                          onChange={(e) => setNewInquiryOption(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInquiryOption();
                            }
                          }}
                          placeholder="Add new dropdown option..."
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddInquiryOption}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-mono text-zinc-400 mb-1.5"
                  >
                    Project Details / Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Share a brief overview of your game, timeline, or requirements..."
                    className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none ${
                      formErrors.message
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  {formErrors.message && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.message}</p>
                  )}
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/60 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{submitError}</span>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.985 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                      <span>Transmitting Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-black" />
                      <span>Transmit Message</span>
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 4. Centered Social Icon Dock at Bottom (Icon-Only Official Latest Logos) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="pt-2 text-center space-y-4"
        >
          <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
            Connect On Social
          </span>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            {socialPlatforms.map((platform) => {
              const isEditingThis = editingSocialId === platform.id;
              return (
                <div key={platform.id} className="relative group/social">
                  <motion.a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform.label}
                    title={platform.label}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 24 }}
                    className={`w-11 h-11 rounded-xl bg-zinc-950 hover:bg-amber-500 text-zinc-300 hover:text-black border flex items-center justify-center transition-colors shadow-lg hover:shadow-amber-500/25 cursor-pointer ${
                      isEditingThis
                        ? 'border-amber-400 ring-2 ring-amber-500/40'
                        : 'border-zinc-800 hover:border-amber-400'
                    }`}
                  >
                    {platform.icon}
                  </motion.a>

                  {isOwnerMode && (
                    <button
                      type="button"
                      onClick={() => handleOpenSocialEdit(platform)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 text-black border border-[#050507] flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                      title={`Edit ${platform.label} link`}
                      aria-label={`Edit ${platform.label} link`}
                    >
                      <Edit3 className="w-2.5 h-2.5 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Owner On-Point Inline Social Link Editor */}
          <AnimatePresence>
            {isOwnerMode && editingSocialId && (
              <motion.form
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSaveSocialUrl}
                className="max-w-lg mx-auto p-3 rounded-xl bg-zinc-950 border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-left"
              >
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold shrink-0 px-1">
                  {socialPlatforms.find((p) => p.id === editingSocialId)?.label} URL:
                </span>
                <input
                  type="url"
                  value={socialUrlDraft}
                  onChange={(e) => setSocialUrlDraft(e.target.value)}
                  placeholder="https://..."
                  autoFocus
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSocialId(null);
                      setSocialUrlDraft('');
                    }}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
                    aria-label="Cancel editing link"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Centered Location & Worldwide Availability Note Below Social Icons */}
          <div className="text-xs font-mono text-zinc-400 tracking-wide pt-1">
            <InlineEdit
              value={info.contactLocationNote || 'Based in India · Available Worldwide'}
              onSave={(val) => onUpdateDesignerInfo?.({ contactLocationNote: val })}
              isOwnerMode={isOwnerMode}
              label="Location & Availability Note"
              className="text-zinc-400"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
