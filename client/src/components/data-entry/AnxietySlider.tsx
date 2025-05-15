import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface AnxietySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function AnxietySlider({ value, onChange }: AnxietySliderProps) {
  return (
    <div className="mb-6">
      <Label className="block text-gray-700 font-medium mb-2">Anxiety Level</Label>
      <div className="flex flex-col space-y-2">
        <Slider
          min={1}
          max={5}
          step={1}
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          className="w-full"
        />
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Very Low</span>
          <span className="text-sm text-gray-500">Very High</span>
        </div>
      </div>
    </div>
  );
}
