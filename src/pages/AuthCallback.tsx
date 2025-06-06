import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Process the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the auth URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Check for errors in URL
        const hashError = hashParams.get('error');
        const queryError = queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        
        if (hashError || queryError) {
          console.error('Auth callback error:', errorDescription);
          setError(errorDescription || 'Authentication failed');
          toast({
            title: 'Authentication Error',
            description: errorDescription || 'Failed to sign in. Please try again.',
            variant: 'destructive',
          });
          navigate('/login', { replace: true });
          return;
        }

        // Check for session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        // Determine where to redirect based on session status
        if (data?.session) {
          console.log('User authenticated:', data.session.user.id);
          
          // Check if user has a profile already
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, user_type')
            .eq('id', data.session.user.id)
            .single();
          
          if (profileData) {
            // User has a profile, redirect to the appropriate dashboard
            const destination = profileData.user_type === 'teacher' 
              ? '/teacher/dashboard' 
              : '/student/dashboard';
            
            toast({
              title: 'Signed in successfully',
              description: 'Welcome back!',
            });
            
            navigate(destination, { replace: true });
          } else {
            // No profile, redirect to onboarding
            toast({
              title: 'Welcome to Afri-Teach!',
              description: 'Please complete your profile to continue.',
            });
            
            navigate('/onboarding', { replace: true });
          }
        } else {
          // No session, go back to login
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        toast({
          title: 'Authentication Error',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {error ? (
        <div className="text-center p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-xl font-medium">Completing your sign in...</h1>
          <p className="text-gray-500 mt-2">Please wait while we redirect you</p>
        </div>
      )}
    </div>
  );
} 