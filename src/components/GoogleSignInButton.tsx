import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/user";

interface GoogleSignInButtonProps {
  role?: UserRole;
  className?: string;
}

export function GoogleSignInButton({ className }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          title: "Google Sign-in Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google";
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
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      onClick={handleGoogleSignIn}
      className={`w-full bg-white/20 border-white/30 text-white hover:bg-white/30 ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Signing in...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <g transform="translate(0, 0)">
              <path
                d="M19.405 8.362h-9.218v3.637h5.3c-.247 1.218-1.016 2.254-2.168 2.943L16.663 18a9.993 9.993 0 0 0 2.742-9.637z"
                fill="#4285F4"
                stroke="none"
              />
              <path
                d="M10.188 20c2.856 0 5.26-.941 7.013-2.543l-3.346-2.597c-.927.619-2.11.983-3.667.983-2.824 0-5.216-1.91-6.077-4.471L.853 14.357a10 10 0 0 0 9.335 5.643z"
                fill="#34A853"
                stroke="none"
              />
              <path
                d="M4.11 11.372c-.217-.647-.34-1.333-.34-2.043 0-.71.123-1.396.34-2.043L.853 4.304a9.978 9.978 0 0 0 0 10.022l3.258-2.954z"
                fill="#FBBC05"
                stroke="none"
              />
              <path
                d="M10.188 3.875c1.594 0 3.025.548 4.147 1.622l2.972-2.972C15.432.933 13.028 0 10.188 0 6.18 0 2.74 2.29.853 5.643l3.258 2.954c.86-2.56 3.252-4.722 6.077-4.722z"
                fill="#EA4335"
                stroke="none"
              />
            </g>
          </svg>
          <span>Sign in with Google</span>
        </div>
      )}
    </Button>
  );
} 