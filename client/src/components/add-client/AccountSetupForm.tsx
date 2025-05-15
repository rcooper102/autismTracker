import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequiredField } from "@/components/ui/required-field";

interface AccountSetupFormProps {
  form: UseFormReturn<any>;
}

export default function AccountSetupForm({ form }: AccountSetupFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-4">Account Setup</h2>
      
      <Alert className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 text-blue-700">
        <AlertDescription className="flex items-start">
          <i className="ri-information-line text-blue-500 mr-2 mt-0.5"></i>
          <span>
            An account will be created for the client/guardian. They will receive an email with instructions to set up their password.
          </span>
        </AlertDescription>
      </Alert>
      
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel><RequiredField>Username</RequiredField></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., jason_dawson" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex-1">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel><RequiredField>Temporary Password</RequiredField></FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••" 
                      {...field}
                    />
                  </FormControl>
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
