import React, { useState } from 'react';
import { Box, Sparkles, CheckCircle2, Play, Eye, Layers, Plus, Edit3, Trash2 } from 'lucide-react';
import { MAYA_MODELS } from '../data/portfolioData';
import { MayaModelItem, DesignerInfo } from '../types/portfolio';
import { InlineEdit } from './InlineEdit';
import { SectionControls } from './SectionControls';
import { MediaUploadOverlay } from './MediaUploadOverlay';

interface MayaShowcaseProps {
  models?: MayaModelItem[];
  designerInfo?: DesignerInfo;
  isOwnerMode?: boolean;
  onPlayInReel: (timestamp: number) => void;
  onAddModel?: () => void;
  onEditModel?: (model: MayaModelItem) => void;
  onDeleteModel?: (id: string) => void;
  onUpdateDesignerInfo?: (updates: Partial<DesignerInfo>) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onHide?: () => void;
  onAddSectionBelow?: () => void;
}

export const MayaShowcase: React.FC<MayaShowcaseProps> = ({
  models = MAYA_MODELS,
  designerInfo,
  isOwnerMode = false,
  onPlayInReel,
  onAddModel,
  onEditModel,
  onDeleteModel,
  onUpdateDesignerInfo,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onHide,
  onAddSectionBelow
}) => {
  const currentModels = models && models.length > 0 ? models : MAYA_MODELS;
  const [selectedModelId, setSelectedModelId] = useState(currentModels[0]?.id || '');
  const [viewMode, setViewMode] = useState<'textured' | 'wireframe' | 'clay'>('textured');

  const selectedModel = currentModels.find(m => m.id === selectedModelId) || currentModels[0];

  return (
    <section id="maya" className="py-10 sm:py-12 relative bg-[#09090c] border-t border-zinc-800/80">
      
      {/* Section Controls for Owner */}
      {isOwnerMode && (
        <SectionControls
          sectionId="maya"
          sectionTitle="Autodesk Maya 3D Assets"
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onHide={onHide}
          onEditSettings={onAddModel}
          onAddSectionBelow={onAddSectionBelow}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-6 gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span>Autodesk Maya Hard-Surface Suite</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black uppercase text-white tracking-tight">
              <InlineEdit
                value={designerInfo?.mayaHeading || '3D Modeling & Assets'}
                onSave={(val) => onUpdateDesignerInfo?.({ mayaHeading: val })}
                isOwnerMode={isOwnerMode}
                className="text-white font-black"
              />
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              <InlineEdit
                value={designerInfo?.mayaSubheading || '“Created these models using Autodesk Maya.” Hard-surface props and interior environments built with clean edge loops, optimized topology, and game-ready UV mapping.'}
                onSave={(val) => onUpdateDesignerInfo?.({ mayaSubheading: val })}
                isOwnerMode={isOwnerMode}
                multiline={true}
                className="text-zinc-400"
              />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOwnerMode && (
              <button
                onClick={onAddModel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                title="Add new Maya 3D Model"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add 3D Model</span>
              </button>
            )}
            <button
              onClick={() => onPlayInReel(110)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 hover:border-amber-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer w-fit"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400" />
              <span>Watch Maya Segment (01:50)</span>
            </button>
          </div>
        </div>

        {/* Interactive Maya Model Showcase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
          
          {/* Left: Interactive 3D Asset Viewport Frame */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              
              {/* Asset Image with simulated render shader modes */}
              <img
                src={selectedModel.thumbnail}
                alt={selectedModel.title}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  viewMode === 'wireframe'
                    ? 'filter contrast-200 invert hue-rotate-180 brightness-90'
                    : viewMode === 'clay'
                    ? 'filter grayscale contrast-125 brightness-110'
                    : 'filter brightness-100'
                }`}
              />
              
              {/* Direct In-place 3D Render Upload for Owner */}
              <MediaUploadOverlay
                currentUrl={selectedModel.thumbnail}
                mediaType="image"
                isOwnerMode={isOwnerMode}
                onMediaUploaded={(newUrl) => onEditModel?.({ ...selectedModel, thumbnail: newUrl })}
                label="Upload 3D Render"
                position="top-right"
                className="mt-10 mr-2"
              />

              {/* Viewport Top Bar */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-black/75 backdrop-blur-md text-[11px] font-mono text-amber-400 border border-zinc-700">
                  AUTODESK MAYA VIEWPORT // {selectedModel.specs.category}
                </span>

                {/* Shader mode switcher */}
                <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-zinc-700 text-[10px] font-mono">
                  <button
                    onClick={() => setViewMode('textured')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${viewMode === 'textured' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Shaded
                  </button>
                  <button
                    onClick={() => setViewMode('clay')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${viewMode === 'clay' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Clay
                  </button>
                  <button
                    onClick={() => setViewMode('wireframe')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${viewMode === 'wireframe' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Edge Flow
                  </button>
                </div>
              </div>

              {/* Bottom Caption */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                    Active Inspection Asset
                  </span>
                  <h3 className="text-white font-bold text-lg">{selectedModel.title}</h3>
                </div>
                <span className="text-[11px] font-mono text-amber-400 bg-black/70 px-2 py-1 rounded border border-zinc-800">
                  Maya Sub-D
                </span>
              </div>
            </div>

            {/* Model Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedModel.id === model.id
                      ? 'bg-zinc-800/90 border-amber-500 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700'
                  }`}
                >
                  <h4 className={`text-xs font-bold truncate ${selectedModel.id === model.id ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {model.title}
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500 block truncate mt-0.5">
                    {model.specs.category}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Right: Technical Specs & Modeling Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                Modeling Spec Sheet
              </span>
              <h3 className="text-2xl font-heading font-black text-white">
                {selectedModel.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {selectedModel.description}
              </p>
            </div>

            {/* Topology & Materials Box */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400 font-mono">Modeling Package:</span>
                <span className="text-amber-400 font-semibold font-mono">{selectedModel.software}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400 font-mono">Mesh Topology:</span>
                <span className="text-zinc-200 font-medium">{selectedModel.specs.topology}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Materials / Shading:</span>
                <span className="text-zinc-200 font-medium">{selectedModel.specs.textures}</span>
              </div>
            </div>

            {/* Modeling Highlights */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Edge Flow & Construction Highlights:
              </span>
              <ul className="space-y-2">
                {selectedModel.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Owner Actions for active model */}
            {isOwnerMode && (
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                <button
                  onClick={() => onEditModel?.(selectedModel)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  title="Edit model specs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Model</span>
                </button>
                {currentModels.length > 1 && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete 3D model "${selectedModel.title}"?`)) {
                        onDeleteModel?.(selectedModel.id);
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Delete model"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => onPlayInReel(110)}
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Watch Maya Reel Segment</span>
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};
