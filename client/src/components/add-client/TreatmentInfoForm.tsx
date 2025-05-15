import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RequiredField } from "@/components/ui/required-field";
import clientConfig from "@/config/client-config.json";
import { useEffect, useState } from "react";

interface TreatmentInfoFormProps {
  form: UseFormReturn<any>;
}

export default function TreatmentInfoForm({ form }: TreatmentInfoFormProps) {
  // Local state to track selected items
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // Treatment plan options from config
  const treatmentPlans = clientConfig.treatmentPlanOptions;
  const treatmentGoals = clientConfig.treatmentGoalOptions;
  
  // Initialize from form values when component loads
  useEffect(() => {
    const formValues = form.getValues();
    console.log("TreatmentInfoForm - Form Values on Load:", formValues);
    
    // Initialize selected plans from form
    let plans: string[] = [];
    if (Array.isArray(formValues.treatmentPlan)) {
      plans = formValues.treatmentPlan;
    } else if (typeof formValues.treatmentPlan === 'string') {
      try {
        const parsed = JSON.parse(formValues.treatmentPlan);
        plans = Array.isArray(parsed) ? parsed : [];
      } catch {
        plans = formValues.treatmentPlan ? [formValues.treatmentPlan] : [];
      }
    }
    
    // Special case handling for "Cognitive Behavioral Therapy"
    if (plans.includes("Cognitive Behavioral Therapy")) {
      plans = plans.map(plan => 
        plan === "Cognitive Behavioral Therapy" ? "Cognitive Behavioral Therapy (CBT)" : plan
      );
    }
    
    setSelectedPlans(plans);
    
    // Initialize selected goals from form
    let goals: string[] = [];
    if (Array.isArray(formValues.treatmentGoals)) {
      goals = formValues.treatmentGoals;
    } else if (typeof formValues.treatmentGoals === 'string') {
      goals = formValues.treatmentGoals.split(',').map(g => g.trim()).filter(Boolean);
    }
    
    setSelectedGoals(goals);
    
    // Update form values
    form.setValue("treatmentPlan", plans);
    form.setValue("treatmentGoals", goals);
    
    console.log("Initialized plans:", plans);
    console.log("Initialized goals:", goals);
  }, [form]);
  
  // Handle plan checkbox toggle
  const handlePlanToggle = (checked: boolean, planLabel: string) => {
    const updatedPlans = checked
      ? [...selectedPlans, planLabel]
      : selectedPlans.filter(p => p !== planLabel);
    
    setSelectedPlans(updatedPlans);
    form.setValue("treatmentPlan", updatedPlans);
    console.log("Updated plans:", updatedPlans);
  };
  
  // Handle goal checkbox toggle
  const handleGoalToggle = (checked: boolean, goalLabel: string) => {
    const updatedGoals = checked
      ? [...selectedGoals, goalLabel]
      : selectedGoals.filter(g => g !== goalLabel);
    
    setSelectedGoals(updatedGoals);
    form.setValue("treatmentGoals", updatedGoals);
    console.log("Updated goals:", updatedGoals);
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-4">Treatment Information</h2>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="treatmentPlan"
          render={() => (
            <FormItem>
              <FormLabel><RequiredField>Treatment Plans</RequiredField></FormLabel>
              <div className="space-y-2">
                {treatmentPlans.map((plan) => {
                  const isChecked = selectedPlans.includes(plan.label);
                  
                  return (
                    <div key={plan.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`plan-${plan.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handlePlanToggle(checked as boolean, plan.label)
                        }
                      />
                      <label
                        htmlFor={`plan-${plan.value}`}
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
          render={() => (
            <FormItem>
              <FormLabel>Treatment Goals</FormLabel>
              <div className="space-y-2">
                {treatmentGoals.map((goal, index) => {
                  const isChecked = selectedGoals.includes(goal);
                  
                  return (
                    <div key={`goal-${index}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${index}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleGoalToggle(checked as boolean, goal)
                        }
                      />
                      <label
                        htmlFor={`goal-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {goal}
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
