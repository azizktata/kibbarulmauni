"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { EyeIcon, PencilIcon, BoldIcon, ItalicIcon, Heading2Icon, ListIcon, DownloadIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteEditorBodyProps {
  noteId: string;
  initialContent: string;
  className?: string;
  variant?: "light" | "dark";
}

export function NoteEditorBody({
  noteId,
  initialContent,
  className,
  variant = "light",
}: NoteEditorBodyProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef(content);
  const isDark = variant === "dark";

  // Re-initialize when noteId changes
  useEffect(() => {
    setContent(initialContent);
    setSaveStatus("saved");
    latestContent.current = initialContent;
  }, [noteId, initialContent]);

  // Debounced auto-save
  useEffect(() => {
    latestContent.current = content;
    if (content === initialContent) return;
    setSaveStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setSaveStatus("saved");
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, noteId]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const c = latestContent.current;
        if (c !== initialContent) {
          fetch(`/api/notes/${noteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: c }),
          });
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const insertMarkdown = useCallback((prefix: string, suffix = "") => {
    const textarea = document.getElementById(`note-textarea-${noteId}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + selected.length;
      textarea.focus();
    }, 0);
  }, [content, noteId]);

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `note-${noteId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className={cn(
        "shrink-0 flex items-center gap-1 px-3 py-1.5 border-b",
        isDark ? "border-neutral-800 bg-neutral-950" : "border-stone-100 bg-stone-50"
      )}>
        <button
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => insertMarkdown("**", "**")}
          className={cn("p-1.5 rounded text-xs font-bold transition-colors", isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-stone-400 hover:text-stone-700 hover:bg-stone-200")}
          title="خط عريض"
        >
          <BoldIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => insertMarkdown("*", "*")}
          className={cn("p-1.5 rounded transition-colors", isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-stone-400 hover:text-stone-700 hover:bg-stone-200")}
          title="خط مائل"
        >
          <ItalicIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => insertMarkdown("## ")}
          className={cn("p-1.5 rounded transition-colors", isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-stone-400 hover:text-stone-700 hover:bg-stone-200")}
          title="عنوان"
        >
          <Heading2Icon className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => insertMarkdown("- ")}
          className={cn("p-1.5 rounded transition-colors", isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-stone-400 hover:text-stone-700 hover:bg-stone-200")}
          title="قائمة"
        >
          <ListIcon className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1" />

        {/* Word count + save status */}
        <span className={cn("text-[11px]", isDark ? "text-neutral-600" : "text-stone-300")}>
          {wordCount} كلمة
        </span>
        <span className={cn(
          "text-[11px] mx-2",
          saveStatus === "saved" ? (isDark ? "text-neutral-600" : "text-stone-400") :
          saveStatus === "saving" ? (isDark ? "text-neutral-400" : "text-stone-500") :
          (isDark ? "text-amber-400" : "text-amber-500")
        )}>
          {saveStatus === "saved" ? "✓ محفوظ" : saveStatus === "saving" ? "جاري الحفظ..." : "●"}
        </span>

        {/* Download */}
        <button
          onPointerDown={(e) => e.preventDefault()}
          onClick={handleDownload}
          className={cn("p-1.5 rounded transition-colors", isDark ? "text-neutral-500 hover:text-white hover:bg-neutral-800" : "text-stone-300 hover:text-stone-600 hover:bg-stone-200")}
          title="تحميل كـ Markdown"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
        </button>

        {/* Preview toggle */}
        <button
          onClick={() => setIsPreview((v) => !v)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors",
            isPreview
              ? (isDark ? "bg-neutral-700 text-white" : "bg-stone-200 text-stone-700")
              : (isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-stone-400 hover:text-stone-600 hover:bg-stone-200")
          )}
        >
          {isPreview ? <PencilIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
          <span className="hidden sm:inline">{isPreview ? "تحرير" : "معاينة"}</span>
        </button>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div className={cn(
          "flex-1 overflow-y-auto px-4 py-4 text-sm leading-loose",
          isDark ? "bg-neutral-950 text-neutral-200 prose-dark" : "bg-white text-stone-800",
          "prose prose-sm max-w-none",
          isDark ? "[&_h1,&_h2,&_h3]:text-neutral-100 [&_strong]:text-neutral-100 [&_code]:bg-neutral-800 [&_code]:text-neutral-200 [&_blockquote]:border-neutral-700 [&_blockquote]:text-neutral-400" : "[&_h1,&_h2,&_h3]:text-stone-800 [&_code]:bg-stone-100 [&_blockquote]:border-stone-300 [&_blockquote]:text-stone-500"
        )}>
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className={isDark ? "text-neutral-600" : "text-stone-300"}>لا يوجد محتوى للمعاينة...</p>
          )}
        </div>
      ) : (
        <textarea
          id={`note-textarea-${noteId}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          dir="rtl"
          autoFocus
          className={cn(
            "flex-1 w-full min-w-0 resize-none px-4 py-4 text-[16px] md:text-sm leading-loose focus:outline-none",
            isDark
              ? "bg-neutral-950 text-neutral-200 placeholder-neutral-700 caret-emerald-400"
              : "bg-white text-stone-800 placeholder-stone-300 caret-stone-600"
          )}
          placeholder="اكتب ملاحظتك هنا... (يدعم Markdown)"
          spellCheck={false}
        />
      )}
    </div>
  );
}
