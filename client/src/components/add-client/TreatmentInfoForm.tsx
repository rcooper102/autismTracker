import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RequiredField } from "@/components/ui/required-field";
import clientConfig from "@/config/client-config.json";

interface TreatmentInfoFormProps {
  form: UseFormReturn<any>;
}

export default function TreatmentInfoForm({ form }: TreatmentInfoFormProps) {
  // Convert treatment plan options from the config to the format used in this component
  const treatmentPlans = clientConfig.treatmentPlanOptions.map(option => ({
    id: option.value,
    label: option.label
  }));
  
  // Convert treatment goal options from the config to the format used in this component
  const treatmentGoals = clientConfig.treatmentGoalOptions.map((option, index) => ({
    id: `goal-${index}`,
    label: option
  }));

  const handlePlanChange = (checked: boolean, plan: string) => {
    const currentPlans = form.getValues("treatmentPlan") || [];
    
    if (checked) {
      form.setValue("treatmentPlan", [...currentPlans, plan]);
    } else {
      form.setValue(
        "treatmentPlan",
        currentPlans.filter((p: string) => p !== plan)
      );
    }
  };

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
              <FormLabel><RequiredField>Treatment Plans</RequiredField></FormLabel>
              <div className="space-y-2">
                {treatmentPlans.map((plan) => {
                  // Ensure we have an array of values
                  const currentPlans = Array.isArray(field.value) ? field.value : [];
                  
                  // Check if this plan is in the currentPlans array
                  const isChecked = currentPlans.includes(plan.label);
                  
                  console.log(`Plan ${plan.label} checked: ${isChecked}`);
                  
                  return (
                    <div key={plan.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`plan-${plan.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handlePlanChange(checked as boolean, plan.label)
                        }
                      />
                      <label
                        htmlFor={`plan-${plan.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {plan.label}
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
          name="treatmentGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment Goals</FormLabel>
              <div className="space-y-2">
                {treatmentGoals.map((goal) => {
                  // Ensure we have an array of values
                  const currentGoals = Array.isArray(field.value) ? field.value : [];
                  
                  // Check if this goal is in the currentGoals array
                  const isChecked = currentGoals.includes(goal.label);
                  
                  console.log(`Goal ${goal.label} checked: ${isChecked}`);
                  
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
