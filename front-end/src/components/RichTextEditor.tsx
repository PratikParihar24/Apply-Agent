import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className = "", minHeight = "150px" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync incoming value to contentEditable when not focused
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className={`relative flex flex-col rounded-card border ${isFocused ? 'border-sage ring-1 ring-sage' : 'border-cardborder'} bg-darkbg overflow-hidden transition-all ${className}`}>
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-cardborder bg-cardbg px-2 py-1.5">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
          className="p-1.5 rounded hover:bg-white/10 text-mutedtext hover:text-cream transition-colors"
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
          className="p-1.5 rounded hover:bg-white/10 text-mutedtext hover:text-cream transition-colors"
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <div className="w-px h-4 bg-cardborder mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
          className="p-1.5 rounded hover:bg-white/10 text-mutedtext hover:text-cream transition-colors"
          title="Bullet List"
        >
          <List size={14} />
        </button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="p-3 text-sm text-cream/90 focus:outline-none prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-sm max-w-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      
      {/* Placeholder */}
      {!value && !isFocused && (
        <div className="absolute top-[42px] left-3 pointer-events-none text-mutedtext text-sm italic">
          {placeholder}
        </div>
      )}
    </div>
  );
}
