import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface TreatmentInfoFormProps {
  form: UseFormReturn<any>;
}

export default function TreatmentInfoForm({ form }: TreatmentInfoFormProps) {
  const treatmentGoals = [
    { id: "social", label: "Improve social interaction skills" },
    { id: "anxiety", label: "Reduce anxiety in specific settings" },
    { id: "coping", label: "Develop coping mechanisms" },
    { id: "executive", label: "Improve executive functioning" },
    { id: "routines", label: "Establish consistent routines" },
  ];

  const handleGoalChange = (checked: boolean, goal: string) => {
    const currentGoals = form.getValues("treatmentGoals") || [];
    
    if (checked) {
      form.setValue("treatmentGoals", [...currentGoals, goal]);
    } else {
      form.setValue(
        "treatmentGoals",
        currentGoals.filter((g: string) => g !== goal)
      );
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-4">Treatment Information</h2>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="treatmentPlan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment Plan</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cbt">Cognitive Behavioral Therapy</SelectItem>
                  <SelectItem value="aba">Applied Behavior Analysis</SelectItem>
                  <SelectItem value="social-skills">Social Skills Training</SelectItem>
                  <SelectItem value="speech">Speech Therapy</SelectItem>
                  <SelectItem value="occupational">Occupational Therapy</SelectItem>
                  <SelectItem value="custom">Custom Plan (specify in notes)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="treatmentGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment Goals</FormLabel>
              <div className="space-y-2">
                {treatmentGoals.map((goal) => {
                  const currentGoals = field.value || [];
                  const isChecked = currentGoals.includes(goal.label);
                  
                  return (
                    <div key={goal.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleGoalChange(checked as boolean, goal.label)
                        }
                      />
                      <label
                        htmlFor={`goal-${goal.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {goal.label}
                      </label>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Include any relevant information about the client's needs, preferences, or specific concerns..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
