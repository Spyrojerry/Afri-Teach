import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/user";

// Define schema for form validation
const formSchema = z.object({
  userType: z.enum(["student", "teacher"], {
    required_error: "Please select whether you are a student or teacher",
  }),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type FormValues = z.infer<typeof formSchema>;

const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: undefined,
      firstName: user?.user_metadata?.first_name || "",
      lastName: user?.user_metadata?.last_name || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Update user metadata with form values
      const { error } = await supabase.auth.updateUser({
        data: { 
          role: values.userType,
          first_name: values.firstName,
          last_name: values.lastName,
          full_name: `${values.firstName} ${values.lastName}`,
          onboarding_completed: true
        }
      });
      
      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your information has been saved successfully",
        });
        
        // Redirect to the appropriate dashboard based on role
        if (values.userType === "student") {
          navigate("/student/dashboard");
        } else if (values.userType === "teacher") {
          navigate("/teacher/dashboard");
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast({
        title: "An error occurred",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome to AfriTeach</CardTitle>
              <CardDescription className="text-gray-300">
                Please tell us a bit more about yourself to complete your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* User Type Selection */}
                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-white">I am a:</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => field.onChange("student")}
                            className={`p-4 rounded-lg border transition-all ${field.value === "student"
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "bg-white/10 border-white/30 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            <User className="h-6 w-6 mx-auto mb-2" />
                            <div className="text-sm font-medium">Student</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("teacher")}
                            className={`p-4 rounded-lg border transition-all ${field.value === "teacher"
                              ? "bg-blue-500/20 border-blue-500 text-blue-400"
                              : "bg-white/10 border-white/30 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            <BookOpen className="h-6 w-6 mx-auto mb-2" />
                            <div className="text-sm font-medium">Teacher</div>
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel htmlFor="firstName" className="text-white">First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="John"
                                className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel htmlFor="lastName" className="text-white">Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Doe"
                                className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium py-3 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Complete Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Onboarding; 