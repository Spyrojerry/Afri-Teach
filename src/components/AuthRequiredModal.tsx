import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GraduationCap, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  redirectUrl?: string;
}

export const AuthRequiredModal = ({
  isOpen,
  onClose,
  title = "Sign in Required",
  description = "You need to sign in to access this feature. Create an account to unlock the full experience.",
  redirectUrl = "/login"
}: AuthRequiredModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-3 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 my-4">
          <Link to="/register" className="w-full">
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700">
              Create an Account
            </Button>
          </Link>
          
          <Link to={redirectUrl} className="w-full">
            <Button variant="outline" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </Link>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}; 