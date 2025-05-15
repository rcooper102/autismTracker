import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MoodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const moods = [
    { value: "great", icon: "ri-emotion-laugh-line", label: "Great" },
    { value: "good", icon: "ri-emotion-line", label: "Good" },
    { value: "okay", icon: "ri-emotion-normal-line", label: "Okay" },
    { value: "not-good", icon: "ri-emotion-unhappy-line", label: "Not Good" },
    { value: "bad", icon: "ri-emotion-sad-line", label: "Bad" },
  ];

  return (
    <div className="mb-6">
      <Label className="block text-gray-700 font-medium mb-2">How are you feeling today?</Label>
      <div className="flex flex-wrap gap-4">
        {moods.map((mood) => (
          <label 
            key={mood.value}
            className={cn(
              "flex items-center justify-center px-4 py-2 border-2 rounded-lg cursor-pointer",
              value === mood.value 
                ? "border-primary bg-primary-50 text-primary" 
                : "border-gray-300 hover:bg-gray-50"
            )}
            onClick={() => onChange(mood.value)}
          >
            <input 
              type="radio" 
              name="mood" 
              value={mood.value} 
              className="sr-only" 
              checked={value === mood.value}
              onChange={() => {}}
            />
            <i className={`${mood.icon} text-2xl mr-2`}></i>
            <span>{mood.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
