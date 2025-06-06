import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface UserAvatarProps {
  userType?: "student" | "teacher";
}

export const UserAvatar = ({ userType }: UserAvatarProps) => {
  const { user, userRole } = useAuth();
  
  // Get user's name from auth context
  const userName = user?.user_metadata?.full_name || "User";
  const userImage = user?.user_metadata?.avatar_url;
  
  // Use provided userType or fallback to context userRole
  const actualUserType = userType || userRole || "student";
  
  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center space-x-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={userImage} alt={userName} />
        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      <span className="hidden sm:block text-sm font-medium text-gray-700">{userName}</span>
    </div>
  );
};
