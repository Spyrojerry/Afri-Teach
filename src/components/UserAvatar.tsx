
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

interface UserAvatarProps {
  userName?: string;
  userImage?: string;
  userType: "student" | "teacher";
}

export const UserAvatar = ({ userName = "John Doe", userImage, userType }: UserAvatarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium text-gray-700">{userName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
        <DropdownMenuItem asChild>
          <Link
            to={`/${userType}/profile`}
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/login"
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
