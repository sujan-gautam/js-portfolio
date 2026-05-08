import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Quote, Heading1, Heading2, 
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  Strikethrough, Code, Maximize, Minimize
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const buttons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: 'bold', label: 'Bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: 'italic', label: 'Italic' },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: 'underline', label: 'Underline' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: 'strike', label: 'Strikethrough' },
    { divider: true },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: { heading: { level: 1 } }, label: 'H1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: { heading: { level: 2 } }, label: 'H2' },
    { divider: true },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: 'bulletList', label: 'Bullet List' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: 'orderedList', label: 'Ordered List' },
    { divider: true },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: 'blockquote', label: 'Quote' },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: 'codeBlock', label: 'Code' },
    { divider: true },
    { icon: LinkIcon, action: setLink, active: 'link', label: 'Link' },
    { icon: ImageIcon, action: addImage, label: 'Image' },
    { divider: true },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), label: 'Undo' },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), label: 'Redo' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
      {buttons.map((btn, i) => (
        btn.divider ? (
          <div key={i} className="w-[1px] h-4 bg-slate-200 mx-1" />
        ) : (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); btn.action?.(); }}
            className={cn(
              "p-1.5 rounded-md transition-all hover:bg-white hover:shadow-sm text-slate-600",
              btn.active && editor.isActive(btn.active) && "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
            )}
            title={btn.label}
          >
            {btn.icon && <btn.icon size={16} />}
          </button>
        )
      ))}
    </div>
  )
}

const TiptapEditor = ({ content, onChange, placeholder }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto border border-slate-200 shadow-sm my-4',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-6 text-slate-700 leading-relaxed',
      },
    },
  })

  // Support external updates (like AI refine or DB load) without re-mounting the component
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Use a small timeout or check to prevent feedback loops
      const isActuallyDifferent = content.replace(/\s/g, '') !== editor.getHTML().replace(/\s/g, '');
      if (isActuallyDifferent) {
         editor.commands.setContent(content, false) // false = don't emit update event
      }
    }
  }, [content, editor])

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
           outline: none !important;
        }
        .prose h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #0f172a; }
        .prose h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1e293b; }
        .prose p { margin-bottom: 1.25rem; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .prose blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; font-style: italic; color: #64748b; margin-bottom: 1.25rem; }
      `}</style>
    </div>
  )
}

export default TiptapEditor
