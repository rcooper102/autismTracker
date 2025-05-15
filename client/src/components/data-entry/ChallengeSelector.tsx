import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ChallengeSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function ChallengeSelector({ value, onChange }: ChallengeSelectorProps) {
  const challenges = [
    { id: "school", label: "School" },
    { id: "social", label: "Social Interaction" },
    { id: "focus", label: "Focus/Attention" },
    { id: "sensory", label: "Sensory Issues" },
    { id: "communication", label: "Communication" },
  ];

  const handleChange = (challengeId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, challengeId]);
    } else {
      onChange(value.filter(v => v !== challengeId));
    }
  };

  return (
    <div className="mb-6">
      <Label className="block text-gray-700 font-medium mb-2">Did you encounter any challenges today?</Label>
      <div className="flex flex-wrap gap-3">
        {challenges.map((challenge) => (
          <label
            key={challenge.id}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Checkbox
              checked={value.includes(challenge.id)}
              onCheckedChange={(checked) => handleChange(challenge.id, checked === true)}
              className="mr-2"
            />
            <span>{challenge.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
