import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { toNumber } from "@/utils/typeConversions";

interface ProfileFormData {
  firstName?: string;
  lastName?: string;
  fullName?: string; // For backward compatibility
  email?: string;
  bio?: string;
  avatar_url?: string;
  profile_picture_url?: string; // New schema name
  introVideoUrl?: string;
  qualifications?: any;
  interests?: string[];
  timeZone?: string;
  contactNumber?: string;
  experience?: string;
  // For backward compatibility
  hourlyRate?: number;
  country?: string;
  education?: string;
  subjects?: string[];
  languages?: string[];
  [key: string]: any;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileFormData) => void;
  initialData: ProfileFormData;
  profileType: 'student' | 'teacher';
  userId: string;
}

export const ProfileModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  profileType,
  userId
}: ProfileModalProps) => {
  const [formData, setFormData] = useState<ProfileFormData>(initialData);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === 'hourlyRate') {
      const numValue = value === '' ? undefined : toNumber(value, undefined);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      // Set both old and new field names for compatibility
      avatar_url: url,
      profile_picture_url: url
    }));
  };
  
  // Get display name based on profile type
  const getDisplayName = () => {
    if (profileType === 'student' || profileType === 'teacher') {
      return `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
    } else {
      // For backward compatibility
      return formData.fullName || '';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md md:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information below
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-1 my-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Uploader */}
            <div className="flex justify-center py-4">
              <CloudinaryUploader
                currentImageUrl={formData.avatar_url || formData.profile_picture_url}
                userId={userId}
                onImageUpload={handleImageUpload}
                name={getDisplayName()}
                size="lg"
              />
            </div>
            
            <div>
              {/* Common fields for both profile types - name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
                
              {/* Teacher specific fields */}
              {profileType === 'teacher' && (
                <>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="introVideoUrl">Introduction Video URL (optional)</Label>
                    <Input
                      id="introVideoUrl"
                      name="introVideoUrl"
                      value={formData.introVideoUrl || ''}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-gray-500">Link to your Cloudinary or YouTube intro video</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeZone">Time Zone</Label>
                      <Input
                        id="timeZone"
                        name="timeZone"
                        value={formData.timeZone || ''}
                        onChange={handleChange}
                        placeholder="e.g., Africa/Lagos"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number (optional)</Label>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        value={formData.contactNumber || ''}
                        onChange={handleChange}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      name="experience"
                      value={formData.experience || ''}
                      onChange={handleChange}
                      placeholder="Describe your teaching experience"
                      className="min-h-[80px]"
                    />
                  </div>
                </>
              )}
              
              {/* Student specific fields */}
              {profileType === 'student' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Input
                    id="timeZone"
                    name="timeZone"
                    value={formData.timeZone || ''}
                    onChange={handleChange}
                    placeholder="e.g., America/New_York"
                  />
                </div>
              )}
              
              {/* Common fields for both profile types */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </form>
        </div>
        
        <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-purple-800"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 