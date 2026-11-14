import React, { useRef, useState } from 'react';
import { Reorder, motion } from 'motion/react';
import {
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Film,
  GripVertical,
  Link as LinkIcon,
  X,
  Check
} from 'lucide-react';
import {
  PortfolioSectionConfig,
  CustomSectionCard,
  CustomSectionData,
  CustomMediaBlock,
  SectionTargetTab
} from '../types/portfolio';
import { SectionControls } from './SectionControls';
import { InlineEdit } from './InlineEdit';
import { uploadImageAsset, uploadVideoAsset } from '../utils/fileHelpers';

interface CustomSectionProps {
  section: PortfolioSectionConfig;
  isOwnerMode?: boolean;
  currentTab?: SectionTargetTab;
  onChangeTab?: (tab: SectionTargetTab) => void;
  onDragStartPointer?: (e: React.PointerEvent) => void;
  showDragHandle?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onDelete?: () => void;
  onEditSettings?: () => void;
  onAddSectionBelow?: () => void;
  onUpdateSectionData?: (updates: Partial<CustomSectionData>) => void;
  onAddCard?: () => void;
  onEditCard?: (card: CustomSectionCard) => void;
  onDeleteCard?: (cardId: string) => void;
}

function getEmbedVideoUrl(rawUrl: string): string | null {
  const url = (rawUrl || '').trim();
  if (!url) return null;
  try {
    if (url.includes('youtube.com/watch')) {
      const u = new URL(url);
      const vid = u.searchParams.get('v');
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    }
    if (url.includes('youtu.be/')) {
      const vid = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    }
    if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
      const vid = url.split('vimeo.com/')[1]?.split(/[?&/]/)[0];
      if (vid && /^\d+$/.test(vid)) return `https://player.vimeo.com/video/${vid}`;
    }
    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/')) {
      return url;
    }
  } catch {}
  return null;
}

export const CustomSection: React.FC<CustomSectionProps> = ({
  section,
  isOwnerMode = false,
  currentTab,
  onChangeTab,
  onDragStartPointer,
  showDragHandle = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onDelete,
  onEditSettings,
  onAddSectionBelow,
  onUpdateSectionData,
  onAddCard,
  onEditCard,
  onDeleteCard
}) => {
  const data = section.customData || {
    heading: section.title || 'Custom Section',
    subheading: 'Customizable portfolio segment',
    bodyText: 'Add your game design breakdowns, videos, photos, awards, or custom showcase notes here.',
    cards: [],
    mediaItems: []
  };

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [urlPromptType, setUrlPromptType] = useState<'image' | 'video' | null>(null);
  const [urlPromptValue, setUrlPromptValue] = useState('');
  const [urlPromptTitle, setUrlPromptTitle] = useState('');

  const mediaItems: CustomMediaBlock[] = data.mediaItems || [];

  const handleUpdateField = <K extends keyof CustomSectionData>(
    field: K,
    value: CustomSectionData[K]
  ) => {
    if (onUpdateSectionData) {
      onUpdateSectionData({ [field]: value });
    }
  };

  const handleUploadMediaFile = async (
    file: File | undefined,
    type: 'image' | 'video'
  ) => {
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const url =
        type === 'image' ? await uploadImageAsset(file) : await uploadVideoAsset(file);
      const nextBlock: CustomMediaBlock = {
        id: `${type}_${Date.now()}`,
        type,
        url,
        title: file.name.replace(/\.[^.]+$/, ''),
        caption: type === 'video' ? 'Uploaded showcase video' : 'Uploaded showcase image'
      };
      handleUpdateField('mediaItems', [...mediaItems, nextBlock]);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleAddMediaByUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlPromptType || !urlPromptValue.trim()) return;
    const nextBlock: CustomMediaBlock = {
      id: `${urlPromptType}_${Date.now()}`,
      type: urlPromptType,
      url: urlPromptValue.trim(),
      title:
        urlPromptTitle.trim() ||
        (urlPromptType === 'video' ? 'Featured Video' : 'Featured Image'),
      caption: ''
    };
    handleUpdateField('mediaItems', [...mediaItems, nextBlock]);
    setUrlPromptType(null);
    setUrlPromptValue('');
    setUrlPromptTitle('');
  };

  const handleDeleteMediaBlock = (id: string) => {
    handleUpdateField(
      'mediaItems',
      mediaItems.filter((item) => item.id !== id)
    );
  };

  const handleReorderMedia = (newOrderedIds: string[]) => {
    const map = new Map(mediaItems.map((m) => [m.id, m]));
    const reordered = newOrderedIds
      .map((id) => map.get(id))
      .filter((m): m is CustomMediaBlock => Boolean(m));
    handleUpdateField('mediaItems', reordered);
  };

  const renderVideoElement = (videoUrl: string, title?: string) => {
    const embedUrl = getEmbedVideoUrl(videoUrl);
    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          title={title || 'Embedded Showcase Video'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <video
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-cover bg-black"
      />
    );
  };

  return (
    <section
      id={section.id}
      className="py-8 sm:py-10 relative bg-[#070709] border-t border-zinc-800/80 scroll-mt-[68px]"
    >
      {/* Floating Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId={section.id}
          sectionTitle={section.title}
          isCustom={true}
          currentTab={currentTab}
          onChangeTab={onChangeTab}
          onDragStartPointer={onDragStartPointer}
          showDragHandle={showDragHandle}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onDelete={onDelete}
          onEditSettings={onEditSettings}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div className="max-w-3xl space-y-2">
            <div>
              <InlineEdit
                value={data.badge || 'CUSTOM SHOWCASE'}
                onSave={(val) => handleUpdateField('badge', val)}
                isOwnerMode={isOwnerMode}
                label="Section Badge"
                className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 inline-flex items-center gap-1.5"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{data.badge || 'CUSTOM SHOWCASE'}</span>
                </span>
              </InlineEdit>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={data.heading || section.title}
                onSave={(val) => handleUpdateField('heading', val)}
                isOwnerMode={isOwnerMode}
                label="Section Heading"
              />
            </h2>

            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed text-justify">
              <InlineEdit
                value={data.subheading || ''}
                onSave={(val) => handleUpdateField('subheading', val)}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Section Subheading"
                placeholder="Click to add a subheading description..."
                as="span"
                className="text-justify"
              />
            </p>
          </div>

          {/* Owner Quick Action Toolbar: Add Photo, Add Video, Add Card */}
          {isOwnerMode && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleUploadMediaFile(e.target.files?.[0], 'image');
                  e.target.value = '';
                }}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  handleUploadMediaFile(e.target.files?.[0], 'video');
                  e.target.value = '';
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>+ Photo</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>+ Video</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUrlPromptType('video');
                  setUrlPromptValue('');
                  setUrlPromptTitle('');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono uppercase transition-colors cursor-pointer"
                title="Embed YouTube, Vimeo, or Video/Photo URL"
              >
                <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Media URL</span>
              </button>

              {onAddCard && (
                <button
                  type="button"
                  onClick={onAddCard}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Card</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inline URL Modal for Adding Photo/Video Link */}
        {urlPromptType && (
          <form
            onSubmit={handleAddMediaByUrl}
            className="mb-8 p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/40 flex flex-wrap items-end gap-3"
          >
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Type</label>
              <select
                value={urlPromptType}
                onChange={(e) => setUrlPromptType(e.target.value as 'image' | 'video')}
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-amber-300"
              >
                <option value="video">Video (YouTube/Vimeo/MP4)</option>
                <option value="image">Photo URL</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">Title</label>
              <input
                type="text"
                value={urlPromptTitle}
                onChange={(e) => setUrlPromptTitle(e.target.value)}
                placeholder="Media title"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex-[2] min-w-[240px] space-y-1">
              <label className="block text-[10px] font-mono uppercase text-zinc-400">
                URL or /showcase/ path *
              </label>
              <input
                type="text"
                value={urlPromptValue}
                onChange={(e) => setUrlPromptValue(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or /showcase/shot.jpg"
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => setUrlPromptType(null)}
                className="p-2 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Spotlight Legacy Single Video / Image if provided */}
        {data.videoUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-zinc-800 relative aspect-video max-h-[520px] bg-black shadow-2xl">
            {renderVideoElement(data.videoUrl, data.heading)}
          </div>
        )}

        {data.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-zinc-800 relative aspect-video max-h-[480px] bg-zinc-950 group">
            <img
              src={data.imageUrl}
              alt={data.heading || 'Section Media'}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}

        {/* Mixed Drag-Reorderable Photos & Videos Gallery */}
        {mediaItems.length > 0 && (
          <div className="mb-10">
            {isOwnerMode ? (
              <Reorder.Group
                axis="y"
                values={mediaItems.map((m) => m.id)}
                onReorder={handleReorderMedia}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {mediaItems.map((item) => (
                  <Reorder.Item
                    key={item.id}
                    value={item.id}
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="rounded-2xl overflow-hidden bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 flex flex-col group"
                  >
                    <div className="px-3.5 py-2 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2 text-zinc-300 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                        <span className="uppercase text-[10px] text-amber-400">
                          {item.type}
                        </span>
                        <span className="truncate max-w-[200px]">{item.title || 'Media'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMediaBlock(item.id)}
                        className="p-1 rounded bg-zinc-900 hover:bg-red-500 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Remove media item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="aspect-video bg-black overflow-hidden">
                      {item.type === 'video' ? (
                        renderVideoElement(item.url, item.title)
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title || 'Section photo'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {mediaItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout="position"
                    className="rounded-2xl overflow-hidden bg-zinc-900/50 border border-zinc-800 flex flex-col"
                  >
                    <div className="aspect-video bg-black overflow-hidden">
                      {item.type === 'video' ? (
                        renderVideoElement(item.url, item.title)
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title || 'Section photo'}
                          className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                        />
                      )}
                    </div>
                    {(item.title || item.caption) && (
                      <div className="px-4 py-3 border-t border-zinc-800/80">
                        {item.title && (
                          <div className="text-sm font-bold text-white">{item.title}</div>
                        )}
                        {item.caption && (
                          <p className="text-xs text-zinc-400 mt-0.5 text-justify">{item.caption}</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Narrative / Body Text */}
        {data.bodyText && (
          <div className="mb-8 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 w-full">
            <InlineEdit
              value={data.bodyText}
              onSave={(val) => handleUpdateField('bodyText', val)}
              isOwnerMode={isOwnerMode}
              multiline={true}
              label="Body Text"
              as="p"
              className="text-zinc-300 text-base leading-relaxed text-justify"
            />
          </div>
        )}

        {/* Feature Cards Grid */}
        {data.cards && data.cards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 items-stretch">
            {data.cards.map((card) => (
              <div
                key={card.id}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 hover:border-amber-500/40 transition-all group flex flex-col justify-between space-y-4 relative"
              >
                {isOwnerMode && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity z-10">
                    {onEditCard && (
                      <button
                        type="button"
                        onClick={() => onEditCard(card)}
                        className="p-1 rounded bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 transition-colors cursor-pointer"
                        title="Edit Card"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteCard && (
                      <button
                        type="button"
                        onClick={() => onDeleteCard(card.id)}
                        className="p-1 rounded bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-300 transition-colors cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {card.videoUrl ? (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                    {renderVideoElement(card.videoUrl, card.title)}
                  </div>
                ) : (
                  card.imageUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black/60 border border-zinc-800">
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )
                )}

                <div className="space-y-2">
                  {card.tag && (
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                      {card.tag}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    <InlineEdit
                      value={card.title}
                      onSave={(val) => {
                        const updated = data.cards?.map((c) =>
                          c.id === card.id ? { ...c, title: val } : c
                        );
                        handleUpdateField('cards', updated);
                      }}
                      isOwnerMode={isOwnerMode}
                      label="Card Title"
                    />
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed text-justify">
                    <InlineEdit
                      value={card.description}
                      onSave={(val) => {
                        const updated = data.cards?.map((c) =>
                          c.id === card.id ? { ...c, description: val } : c
                        );
                        handleUpdateField('cards', updated);
                      }}
                      isOwnerMode={isOwnerMode}
                      multiline={true}
                      label="Card Description"
                      as="span"
                      className="text-justify"
                    />
                  </p>
                </div>

                {card.link && (
                  <div className="pt-2">
                    <a
                      href={card.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                    >
                      <span>{card.linkLabel || 'Learn More'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
