"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Quote, 
  Code, 
  Eye, 
  Edit3,
  Save,
  X
} from "lucide-react";

interface MarkdownEditorProps {
  initialContent?: string;
  initialSeoTitle?: string;
  initialSeoDescription?: string;
  onSave: (data: { content: string; seoTitle: string; seoDescription: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function MarkdownEditor({
  initialContent = "",
  initialSeoTitle = "",
  initialSeoDescription = "",
  onSave,
  onCancel,
  loading = false
}: MarkdownEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle);
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Toolbar actions
  const insertMarkdown = useCallback((before: string, after: string = "", placeholder: string = "") => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;
    
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after the inserted text
    const newCursorPos = start + before.length + (selectedText || placeholder).length;
    setCursorPosition(newCursorPos);
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast("Conținutul nu poate fi gol.", "error");
      return;
    }

    try {
      await onSave({
        content: content.trim(),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim()
      });
    } catch (error) {
      toast("Nu s-a putut salva conținutul.", "error");
    }
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertMarkdown("**", "**", "text bold")
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertMarkdown("*", "*", "text italic")
    },
    {
      icon: List,
      label: "Listă",
      action: () => insertMarkdown("- ", "", "element listă")
    },
    {
      icon: ListOrdered,
      label: "Listă numerotată",
      action: () => insertMarkdown("1. ", "", "element listă")
    },
    {
      icon: Link,
      label: "Link",
      action: () => insertMarkdown("[", "](https://example.com)", "text link")
    },
    {
      icon: Quote,
      label: "Citat",
      action: () => insertMarkdown("> ", "", "text citat")
    },
    {
      icon: Code,
      label: "Cod",
      action: () => insertMarkdown("`", "`", "cod")
    }
  ];

  return (
    <div className="space-y-6">
      {/* SEO Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="seo-title">Titlu SEO</Label>
          <Input
            id="seo-title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Titlul paginii pentru motoarele de căutare"
            maxLength={60}
          />
          <p className="text-xs text-slate-500 mt-1">
            {seoTitle.length}/60 caractere
          </p>
        </div>
        <div>
          <Label htmlFor="seo-description">Descriere SEO</Label>
          <Input
            id="seo-description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Descrierea paginii pentru motoarele de căutare"
            maxLength={160}
          />
          <p className="text-xs text-slate-500 mt-1">
            {seoDescription.length}/160 caractere
          </p>
        </div>
      </div>

      {/* Editor/Preview Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {viewMode === "edit" ? "Editare" : "Previzualizare"}
          </Badge>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {content.length} caractere
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "edit" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("edit")}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editează
          </Button>
          <Button
            variant={viewMode === "preview" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Previzualizare
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {viewMode === "edit" && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.label}
              className="h-8 w-8 p-0"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}

      {/* Editor/Preview Content */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        {viewMode === "edit" ? (
          <Textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Scrie conținutul paginii despre tine folosind Markdown...

Exemple:
# Titlu principal
## Subtitlu
**Text bold** și *text italic*
- Listă cu bullet points
1. Listă numerotată
[Link către site](https://example.com)
> Citat important

Pentru mai multe opțiuni, folosește butoanele din toolbar."
            className="min-h-[400px] resize-none border-0 focus:ring-0"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace" }}
          />
        ) : (
          <div className="p-6 min-h-[400px]">
            {content ? (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    a: ({ href, children, ...props }) => {
                      const isExternal = href?.startsWith('http') && !href?.includes('pots.ro');
                      
                      return (
                        <a
                          href={href}
                          rel={isExternal ? "nofollow noopener" : undefined}
                          target={isExternal ? "_blank" : undefined}
                          className="text-brand hover:text-brand-dark underline"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 text-center py-12">
                Nu există conținut de previzualizat. 
                <br />
                Comută la modul de editare pentru a adăuga conținut.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Sfaturi pentru conținut:</h4>
        <ul className="space-y-1 text-xs">
          <li>• Folosește titluri clare (H1, H2) pentru structura conținutului</li>
          <li>• Adaugă linkuri către site-ul tău sau rețelele sociale</li>
          <li>• Menționează experiența și specializarea ta</li>
          <li>• Include informații despre calitatea produselor</li>
          <li>• Adaugă detalii de contact și politici</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Anulează
        </Button>

        <Button
          onClick={handleSave}
          disabled={loading || !content.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Se salvează..." : "Salvează"}
        </Button>
      </div>
    </div>
  );
}
