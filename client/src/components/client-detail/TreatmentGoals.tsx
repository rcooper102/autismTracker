import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TreatmentGoalsProps {
  goals: string[];
  canUpdate: boolean;
  clientId: number;
}

export default function TreatmentGoals({ goals, canUpdate, clientId }: TreatmentGoalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkedGoals, setCheckedGoals] = useState<string[]>([]);
  
  // Default goals if none are specified
  const defaultGoals = [
    "Improve social interaction skills",
    "Reduce anxiety in school settings",
    "Develop coping mechanisms",
    "Improve executive functioning",
    "Establish consistent bedtime routine"
  ];
  
  // Use provided goals or default goals
  const displayGoals = goals.length > 0 ? goals : defaultGoals;
  
  const updateGoalsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/clients/${clientId}`, {
        treatmentGoals: checkedGoals,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Goals updated",
        description: "Treatment goals have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update goals",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleGoalChange = (goal: string, checked: boolean) => {
    if (checked) {
      setCheckedGoals([...checkedGoals, goal]);
    } else {
      setCheckedGoals(checkedGoals.filter(g => g !== goal));
    }
  };
  
  const handleUpdateGoals = () => {
    updateGoalsMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Treatment Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayGoals.map((goal, index) => (
          <div key={index} className="flex items-center">
            <Checkbox 
              id={`goal-${index}`}
              checked={checkedGoals.includes(goal)}
              onCheckedChange={(checked) => handleGoalChange(goal, checked === true)}
              disabled={!canUpdate}
            />
            <label 
              htmlFor={`goal-${index}`}
              className="ml-2 text-gray-800"
            >
              {goal}
            </label>
          </div>
        ))}
      </CardContent>
      {canUpdate && (
        <CardFooter>
          <Button 
            className="w-full flex items-center justify-center"
            onClick={handleUpdateGoals}
            disabled={updateGoalsMutation.isPending}
          >
            {updateGoalsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Goals...
              </>
            ) : (
              <>
                <i className="ri-edit-line mr-2"></i> Update Goals
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
