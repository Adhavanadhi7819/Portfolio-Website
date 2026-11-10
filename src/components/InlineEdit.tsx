import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (val: string) => void;
  isOwnerMode?: boolean;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  label?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'blockquote' | 'div';
  children?: React.ReactNode;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  isOwnerMode = false,
  multiline = false,
  className = '',
  inputClassName = '',
  placeholder = 'Click to edit text...',
  label,
  as: Component = 'span',
  children
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!isOwnerMode) {
    return <Component className={className}>{children || value}</Component>;
  }

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(value);
    setIsEditing(true);
  };

  const handleSave = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div 
        className="relative inline-block w-full max-w-full my-1 z-30" 
        onClick={(e) => e.stopPropagation()}
      >
        {label && (
          <span className="block text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1">
            Editing {label}:
          </span>
        )}
        <div className="relative flex flex-col gap-1.5 p-2 rounded-xl bg-zinc-950/95 border-2 border-amber-500 shadow-2xl backdrop-blur-md">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={3}
              className={`w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm border border-zinc-700 focus:border-amber-400 focus:outline-none resize-y ${inputClassName}`}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm border border-zinc-700 focus:border-amber-400 focus:outline-none ${inputClassName}`}
            />
          )}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-zinc-500 font-mono text-[10px]">
              {multiline ? 'Ctrl+Enter or click Save' : 'Enter to save • Esc to cancel'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1 text-xs cursor-pointer transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1 text-xs cursor-pointer transition-colors shadow-md shadow-amber-500/20"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span
      onClick={handleStart}
      className={`group/inline relative inline-flex items-baseline cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-amber-500/70 hover:bg-amber-500/5 rounded px-1 -mx-1 transition-all ${className}`}
      title={label ? `Click to edit ${label}` : 'Click to edit this text'}
    >
      <Component className="inline">
        {children || value || <span className="italic text-zinc-600">{placeholder}</span>}
      </Component>
      <span className="opacity-0 group-hover/inline:opacity-100 transition-opacity ml-1.5 shrink-0 inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-mono leading-none align-middle pointer-events-none">
        <Edit3 className="w-2.5 h-2.5" />
      </span>
    </span>
  );
};
