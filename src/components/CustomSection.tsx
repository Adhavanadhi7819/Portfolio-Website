import React from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  Image as ImageIcon,
  Play
} from 'lucide-react';
import { PortfolioSectionConfig, CustomSectionCard } from '../types/portfolio';
import { SectionControls } from './SectionControls';
import { InlineEdit } from './InlineEdit';

interface CustomSectionProps {
  section: PortfolioSectionConfig;
  isOwnerMode?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onDelete?: () => void;
  onEditSettings?: () => void;
  onAddSectionBelow?: () => void;
  onUpdateSectionData?: (updates: Partial<PortfolioSectionConfig['customData']>) => void;
  onAddCard?: () => void;
  onEditCard?: (card: CustomSectionCard) => void;
  onDeleteCard?: (cardId: string) => void;
}

export const CustomSection: React.FC<CustomSectionProps> = ({
  section,
  isOwnerMode = false,
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
    bodyText: 'Add your game design breakdowns, devlogs, awards, or custom showcase notes here.',
    cards: []
  };

  const handleUpdateField = (field: string, value: any) => {
    if (onUpdateSectionData) {
      onUpdateSectionData({
        [field]: value
      });
    }
  };

  return (
    <section id={section.id} className="py-24 relative bg-[#070709] border-t border-zinc-800/80">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[350px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none"></div>

      {/* Floating Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId={section.id}
          sectionTitle={section.title}
          isCustom={true}
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-3xl space-y-3">
            
            {/* Badge */}
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

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={data.heading || section.title}
                onSave={(val) => handleUpdateField('heading', val)}
                isOwnerMode={isOwnerMode}
                label="Section Heading"
              />
            </h2>

            {/* Subheading */}
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              <InlineEdit
                value={data.subheading || ''}
                onSave={(val) => handleUpdateField('subheading', val)}
                isOwnerMode={isOwnerMode}
                multiline={true}
                label="Section Subheading"
                placeholder="Click to add a subheading description..."
              />
            </p>

          </div>

          {/* Owner Quick Action: Add Card or Edit */}
          {isOwnerMode && (
            <div className="flex items-center gap-2 shrink-0">
              {onAddCard && (
                <button
                  onClick={onAddCard}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Feature Card</span>
                </button>
              )}
              {onEditSettings && (
                <button
                  onClick={onEditSettings}
                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                  title="Edit full section settings"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Optional Media (Image or Video) */}
        {data.imageUrl && (
          <div className="mb-12 rounded-2xl overflow-hidden border border-zinc-800 relative aspect-video max-h-[480px] bg-zinc-950 group">
            <img
              src={data.imageUrl}
              alt={data.heading || 'Section Media'}
              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
            {isOwnerMode && (
              <button
                onClick={onEditSettings}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-amber-400 border border-amber-500/50 text-xs font-mono uppercase cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Change Media</span>
              </button>
            )}
          </div>
        )}

        {/* Narrative / Body Text */}
        {data.bodyText && (
          <div className="mb-12 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 max-w-4xl">
            <InlineEdit
              value={data.bodyText}
              onSave={(val) => handleUpdateField('bodyText', val)}
              isOwnerMode={isOwnerMode}
              multiline={true}
              label="Body Text"
              className="text-zinc-300 text-base leading-relaxed"
            />
          </div>
        )}

        {/* Feature Cards Grid */}
        {data.cards && data.cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.cards.map((card) => (
              <div
                key={card.id}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 hover:border-amber-500/40 transition-all group flex flex-col justify-between space-y-4 relative"
              >
                {/* Owner card controls */}
                {isOwnerMode && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {onEditCard && (
                      <button
                        onClick={() => onEditCard(card)}
                        className="p-1 rounded bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 transition-colors cursor-pointer"
                        title="Edit Card"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteCard && (
                      <button
                        onClick={() => onDeleteCard(card.id)}
                        className="p-1 rounded bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-300 transition-colors cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Card thumbnail if provided */}
                {card.imageUrl && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black/60 border border-zinc-800">
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
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
                        const updated = data.cards?.map(c => c.id === card.id ? { ...c, title: val } : c);
                        handleUpdateField('cards', updated);
                      }}
                      isOwnerMode={isOwnerMode}
                      label="Card Title"
                    />
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    <InlineEdit
                      value={card.description}
                      onSave={(val) => {
                        const updated = data.cards?.map(c => c.id === card.id ? { ...c, description: val } : c);
                        handleUpdateField('cards', updated);
                      }}
                      isOwnerMode={isOwnerMode}
                      multiline={true}
                      label="Card Description"
                    />
                  </p>
                </div>

                {/* Optional Link */}
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
        ) : (
          isOwnerMode && (
            <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-800 text-center space-y-3">
              <p className="text-zinc-500 text-sm font-mono">
                No cards added yet to this section.
              </p>
              {onAddCard && (
                <button
                  onClick={onAddCard}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Feature Card</span>
                </button>
              )}
            </div>
          )
        )}

      </div>
    </section>
  );
};
