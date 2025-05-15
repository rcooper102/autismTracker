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
  // Debug the form values
  const formValues = form.getValues();
  console.log("TreatmentInfoForm - Initial Form Values:", formValues);
  console.log("TreatmentInfoForm - Treatment Plan:", formValues.treatmentPlan);
  console.log("TreatmentInfoForm - Treatment Goals:", formValues.treatmentGoals);
  
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
    // Get current plans and ensure it's an array
    let currentPlans = form.getValues("treatmentPlan");
    currentPlans = Array.isArray(currentPlans) ? currentPlans : [];
    
    console.log("Current plans before change:", currentPlans);
    
    if (checked) {
      form.setValue("treatmentPlan", [...currentPlans, plan]);
    } else {
      form.setValue(
        "treatmentPlan",
        currentPlans.filter((p: string) => p !== plan)
      );
    }
    
    console.log("Plans after change:", form.getValues("treatmentPlan"));
  };

  const handleGoalChange = (checked: boolean, goal: string) => {
    // Get current goals and ensure it's an array
    let currentGoals = form.getValues("treatmentGoals");
    currentGoals = Array.isArray(currentGoals) ? currentGoals : [];
    
    console.log("Current goals before change:", currentGoals);
    
    if (checked) {
      form.setValue("treatmentGoals", [...currentGoals, goal]);
    } else {
      form.setValue(
        "treatmentGoals",
        currentGoals.filter((g: string) => g !== goal)
      );
    }
    
    console.log("Goals after change:", form.getValues("treatmentGoals"));
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
                  
                  // FIXED: Check if current plan is selected by checking for both label and label without "(CBT)" suffix
                  const isChecked = currentPlans.includes(plan.label) || 
                                    (plan.label === "Cognitive Behavioral Therapy (CBT)" && 
                                     currentPlans.includes("Cognitive Behavioral Therapy"));
                  
                  console.log(`Plan ${plan.label} checked: ${isChecked}`, currentPlans);
                  
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
                  
                  console.log(`Goal ${goal.label} checked: ${isChecked}`, currentGoals);
                  
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
