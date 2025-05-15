import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RequiredField } from "@/components/ui/required-field";
import clientConfig from "@/config/client-config.json";

interface GuardianInfoFormProps {
  form: UseFormReturn<any>;
}

export default function GuardianInfoForm({ form }: GuardianInfoFormProps) {
  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Parent/Guardian Information</h2>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="guardianName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><RequiredField>Full Name</RequiredField></FormLabel>
              <FormControl>
                <Input placeholder="Enter guardian's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="guardianRelation"
          render={({ field }) => {
            console.log("Guardian relation field value:", field.value);
            return (
              <FormItem>
                <FormLabel><RequiredField>Relationship to Client</RequiredField></FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientConfig.guardianRelationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        
        <FormField
          control={form.control}
          name="guardianEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel><RequiredField>Email</RequiredField></FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter guardian's email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="guardianPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel><RequiredField>Phone Number</RequiredField></FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Enter guardian's phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
