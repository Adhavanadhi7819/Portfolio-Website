import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Linkedin, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Palette
} from 'lucide-react';
import { DESIGNER_INFO } from '../data/portfolioData';
import { validateContactForm } from '../utils/portfolioLogic';
import { ContactFormData, ContactFormErrors, DesignerInfo } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { MediaUploadOverlay } from './MediaUploadOverlay';

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
}

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
  onAddSectionBelow
}) => {
  const info = designerInfo || DESIGNER_INFO;
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    projectType: 'Game Studio Position',
    message: ''
  });

  const [formErrors, setFormErrors] = useState<ContactFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateContactForm(formData);
    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }

    // Successfully validated
    setIsSubmitted(true);
    setFormErrors({});
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      projectType: 'Game Studio Position',
      message: ''
    });
    setIsSubmitted(false);
  };

  return (
    <section id="contact" className="pt-20 sm:pt-24 pb-12 sm:pb-16 relative bg-[#09090c] min-h-[calc(100vh-140px)]">
      
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="contact"
          sectionTitle="Contact & Inquiry Section"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onEditContact}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      {/* Background glow */}
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-6 gap-4">
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <InlineEdit
                value={info.contactBadge || 'Connect & Collaborate'}
                onSave={(val) => onUpdateDesignerInfo?.({ contactBadge: val })}
                isOwnerMode={isOwnerMode}
                className="text-amber-500 font-mono font-bold"
              />
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={info.contactHeading || 'GET IN TOUCH'}
                onSave={(val) => onUpdateDesignerInfo?.({ contactHeading: val })}
                isOwnerMode={isOwnerMode}
                className="text-white font-black"
              />
            </h2>
            <div className="flex items-start gap-2 mt-2">
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                <InlineEdit
                  value={info.contactSubheading || 'Interested in my game design work, level layouts, or vehicle mechanics? Let’s discuss studio positions, freelance inquiries, or creative collaborations.'}
                  onSave={(val) => onUpdateDesignerInfo?.({ contactSubheading: val })}
                  isOwnerMode={isOwnerMode}
                  multiline={true}
                  className="text-zinc-400"
                />
              </p>
              {isOwnerMode && (
                <button
                  onClick={onEditContact}
                  className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="Edit contact text"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {isOwnerMode && (
            <button
              onClick={onEditContact}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0"
              title="Edit email, phone, LinkedIn, heading, and subtitle"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Contact Section & Text</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Verified Contact Cards from Slide */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Quick Connected Profile Badges */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-xl shadow-amber-500/5 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Connected Direct Links</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* ArtStation ↗ */}
                <a
                  href={info.artstationUrl || 'https://www.artstation.com/adhavan7819'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-amber-500/60 transition-all group/link"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover/link:scale-110 transition-transform">
                      <Palette className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold tracking-tight">ArtStation</span>
                  </div>
                  <span className="text-amber-400 font-mono text-sm font-bold group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform">↗</span>
                </a>

                {/* LinkedIn ↗ */}
                <a
                  href={info.linkedinUrl || 'https://www.linkedin.com/in/adhavan-p'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-sky-500/60 transition-all group/link"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover/link:scale-110 transition-transform">
                      <Linkedin className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold tracking-tight">LinkedIn</span>
                  </div>
                  <span className="text-sky-400 font-mono text-sm font-bold group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform">↗</span>
                </a>

                {/* WhatsApp ↗ */}
                <a
                  href={info.whatsappUrl || 'https://wa.me/918072647909?text=Hi%20Adhavan%2C%20I%20saw%20your%20Game%20Designer%20portfolio!'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-emerald-500/60 transition-all group/link"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/link:scale-110 transition-transform">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold tracking-tight">WhatsApp</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-sm font-bold group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform">↗</span>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              
              {/* ArtStation Direct Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-colors flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                      3D Art & Showreel
                    </span>
                    <a
                      href={info.artstationUrl || 'https://www.artstation.com/adhavan7819'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <span>ArtStation Portfolio</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                </div>

                <a
                  href={info.artstationUrl || 'https://www.artstation.com/adhavan7819'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Open ↗</span>
                </a>
              </div>

              {/* LinkedIn Direct Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-colors flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                      Professional Network
                    </span>
                    <a
                      href={info.linkedinUrl || 'https://www.linkedin.com/in/adhavan-p'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <span>{info.linkedin || 'Adhavan P'}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                </div>

                <a
                  href={info.linkedinUrl || 'https://www.linkedin.com/in/adhavan-p'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-black font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Open ↗</span>
                </a>
              </div>

              {/* WhatsApp Direct Chat Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 transition-colors flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                      Instant Chat
                    </span>
                    <a
                      href={info.whatsappUrl || 'https://wa.me/918072647909?text=Hi%20Adhavan%2C%20I%20saw%20your%20Game%20Designer%20portfolio!'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <span>WhatsApp Direct</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  </div>
                </div>

                <a
                  href={info.whatsappUrl || 'https://wa.me/918072647909?text=Hi%20Adhavan%2C%20I%20saw%20your%20Game%20Designer%20portfolio!'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Chat ↗</span>
                </a>
              </div>

              {/* Email Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-colors flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${info.email}`}
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors break-all"
                    >
                      {info.email}
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(info.email, 'email')}
                  className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Copy email address"
                  title="Copy to clipboard"
                >
                  {copiedField === 'email' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Phone Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-colors flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                      Phone Number
                    </span>
                    <a
                      href={`tel:${info.phone}`}
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors"
                    >
                      {info.phone}
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(info.phone, 'phone')}
                  className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Copy phone number"
                  title="Copy to clipboard"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

            </div>

            {/* Video Slide Visual Reference Staging */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 overflow-hidden relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                  Showcase Stills from Get In Touch Slide:
                </span>
                {isOwnerMode && (
                  <button
                    onClick={onEditContact}
                    className="p-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Change Slide Photo URL"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[10px]">Edit Photo</span>
                  </button>
                )}
              </div>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-zinc-800">
                <img
                  src={info.contactSlidePhotoUrl || '/showcase/contact-slide.jpg'}
                  alt="Get In Touch Slide Showcase"
                  className="w-full h-full object-cover"
                />

                {/* Direct In-place Slide Photo Upload for Owner */}
                <MediaUploadOverlay
                  currentUrl={info.contactSlidePhotoUrl || '/showcase/contact-slide.jpg'}
                  mediaType="image"
                  isOwnerMode={isOwnerMode}
                  onMediaUploaded={(newUrl) => onUpdateDesignerInfo?.({ contactSlidePhotoUrl: newUrl })}
                  label="Upload Slide Photo"
                  position="top-right"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl relative">
              
              <div className="border-b border-zinc-800 pb-4 mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Send Direct Inquiry
                </span>
                <h3 className="text-2xl font-heading font-black text-white mt-1">
                  Message Adhavan
                </h3>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Thank You For Your Message!</h4>
                  <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Your inquiry has been received. You can also reach out directly via email at <strong className="text-amber-400">{info.email}</strong> or call <strong className="text-amber-400">{info.phone}</strong>.
                  </p>
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Alex Mercer"
                        className={`w-full px-4 py-3 rounded-xl bg-zinc-900 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                          formErrors.name ? 'border-red-500 focus:border-red-400' : 'border-zinc-800 focus:border-amber-500'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. alex@gamestudio.com"
                        className={`w-full px-4 py-3 rounded-xl bg-zinc-900 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors ${
                          formErrors.email ? 'border-red-500 focus:border-red-400' : 'border-zinc-800 focus:border-amber-500'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Project Type */}
                  <div>
                    <label htmlFor="projectType" className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                      Subject / Opportunity Type
                    </label>
                    <select
                      id="projectType"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="Game Studio Position">Game Studio Role (Level Designer / Unreal Dev)</option>
                      <option value="Freelance Environment Contract">Freelance Environment / Level Design Project</option>
                      <option value="Vehicle Rigging & Mechanix">Vehicle Rigging & Physics Consultation</option>
                      <option value="Maya 3D Modeling Request">3D Modeling Asset Request</option>
                      <option value="General Inquiries">Other Inquiries / Mentorship</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell me about the role, project scope, or level design challenges you'd like to collaborate on..."
                      className={`w-full px-4 py-3 rounded-xl bg-zinc-900 border text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors resize-none ${
                        formErrors.message ? 'border-red-500 focus:border-red-400' : 'border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    {formErrors.message && (
                      <p className="text-xs text-red-400 mt-1">{formErrors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold uppercase tracking-wider text-xs shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                  >
                    <Send className="w-4 h-4 fill-black text-black" />
                    <span>Send Message to Adhavan</span>
                  </button>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
