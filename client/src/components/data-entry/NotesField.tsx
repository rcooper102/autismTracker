import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesField({ value, onChange }: NotesFieldProps) {
  return (
    <div className="mb-6">
      <Label htmlFor="notes" className="block text-gray-700 font-medium mb-2">Additional Notes</Label>
      <Textarea
        id="notes"
        rows={4}
        placeholder="Share more about your day..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
