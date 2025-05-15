import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SleepQualityProps {
  value: number;
  onChange: (value: number) => void;
}

export default function SleepQuality({ value, onChange }: SleepQualityProps) {
  return (
    <div className="mb-6">
      <Label className="block text-gray-700 font-medium mb-2">Sleep Quality</Label>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-2 focus:outline-none"
            onClick={() => onChange(star)}
          >
            <i className={cn(
              star <= value ? "ri-star-fill text-yellow-500" : "ri-star-line text-gray-300",
              "text-xl"
            )}></i>
          </button>
        ))}
      </div>
    </div>
  );
}
