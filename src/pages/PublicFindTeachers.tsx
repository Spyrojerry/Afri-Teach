import { useState } from "react";
import { Layout } from "@/components/Layout";
import FindTeachers from "./FindTeachers";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

const PublicFindTeachers = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Function to handle actions that require authentication
  const handleProtectedAction = (action: string) => {
    if (user) {
      // If user is already authenticated, proceed with the action
      if (action === 'view-profile' || action === 'book-lesson') {
        // These actions are handled directly by the FindTeachers component
        return true;
      }
    } else {
      // If not authenticated, show the auth modal
      setIsAuthModalOpen(true);
      return false;
    }
  };
  
  return (
    <Layout>
      <FindTeachers 
        isPublic={true}
        onProtectedAction={handleProtectedAction}
      />
      
      <AuthRequiredModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Sign in to Continue"
        description="Create an account or sign in to book lessons with teachers, view profiles, and more."
        redirectUrl="/login"
      />
    </Layout>
  );
};

export default PublicFindTeachers; 