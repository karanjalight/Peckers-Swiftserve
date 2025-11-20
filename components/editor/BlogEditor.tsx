"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

interface BlogEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function BlogEditor({ value, onChange }: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "border min-h-[200px] p-3 rounded focus:outline-none prose max-w-none",
      },
    },
    immediatelyRender: false, // avoid SSR mismatch
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded">
      {/* Toolbar */}
      <div className="flex gap-2 p-2 border-b bg-gray-50 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("bold") ? "bg-gray-300" : ""
          }`}
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("italic") ? "bg-gray-300" : ""
          }`}
        >
          Italic
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("heading", { level: 2 }) ? "bg-gray-300" : ""
          }`}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded ${
            editor.isActive("bulletList") ? "bg-gray-300" : ""
          }`}
        >
          • List
        </button>

        <button
          type="button"
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className="px-2 py-1 rounded"
        >
          Link
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
