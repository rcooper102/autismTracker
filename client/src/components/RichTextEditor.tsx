import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import { Button } from '@/components/ui/button';
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  List as ListIcon, 
  ListOrdered as ListOrderedIcon,
  Heading1,
  Heading2
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ content, onChange, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      Bold,
      Italic,
      BulletList,
      OrderedList,
      ListItem,
      Heading.configure({
        levels: [1, 2],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1 border-b pb-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
          type="button"
          aria-label="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
          type="button"
          aria-label="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}`}
          type="button"
          aria-label="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`}
          type="button"
          aria-label="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
          type="button"
          aria-label="Bullet List"
        >
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
          type="button"
          aria-label="Ordered List"
        >
          <ListOrderedIcon className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent 
        editor={editor} 
        placeholder={placeholder}
        className="overflow-y-auto"
      />
    </div>
  );
};

export default RichTextEditor;