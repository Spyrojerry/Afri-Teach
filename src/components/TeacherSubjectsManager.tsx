import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus, Trash2, Save, BookOpen, Edit, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { LearningModule, getModulesForSubject } from "@/services/bookingService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeacherSubjectsManagerProps {
  teacherId?: string; // Optional - if not provided, uses the logged-in teacher
  readOnly?: boolean; // Optional - if true, display-only mode (no editing)
}

interface SubjectWithModules {
  name: string;
  modules: LearningModule[];
  selectedModules: string[]; // Array of module IDs that the teacher can teach
}

export const TeacherSubjectsManager = ({ 
  teacherId, 
  readOnly = false 
}: TeacherSubjectsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectWithModules[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // The ID of the teacher whose subjects we're managing
  const effectiveTeacherId = teacherId || user?.id;
  
  // Fetch teacher's subjects and available modules
  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      if (!effectiveTeacherId) return;
      
      setIsLoading(true);
      try {
        // Fetch teacher data to get current subjects
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('subjects, teacher_modules')
          .eq('id', effectiveTeacherId)
          .single();
        
        if (teacherError) {
          console.error("Error fetching teacher data:", teacherError);
          throw teacherError;
        }
        
        // Fetch all available subjects
        const { data: allSubjects, error: subjectsError } = await supabase
          .from('learning_modules')
          .select('subject')
          .order('subject');
        
        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError);
          throw subjectsError;
        }
        
        // Get unique subjects
        const uniqueSubjects = [...new Set(allSubjects.map(s => s.subject))];
        setAvailableSubjects(uniqueSubjects);
        
        // Process teacher's subjects
        const teacherSubjects = teacherData.subjects || [];
        const teacherModules = teacherData.teacher_modules || {};
        
        // Create subject with modules structures
        const subjectsWithModules: SubjectWithModules[] = [];
        
        // Process each subject that the teacher teaches
        for (const subject of teacherSubjects) {
          // Fetch modules for this subject
          const modules = await getModulesForSubject(subject);
          
          // Get selected modules for this subject
          const selectedModules = teacherModules[subject] || [];
          
          subjectsWithModules.push({
            name: subject,
            modules,
            selectedModules
          });
        }
        
        setSubjects(subjectsWithModules);
      } catch (err) {
        console.error("Failed to fetch teacher subjects:", err);
        setError("Failed to load subjects. Please try again later.");
        
        // Use mock data if needed
        setSubjects([
          {
            name: "Mathematics",
            modules: await getModulesForSubject("Mathematics"),
            selectedModules: ["m1", "m2"]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherSubjects();
  }, [effectiveTeacherId]);
  
  // Add a new subject
  const handleAddSubject = async () => {
    if (!newSubject) return;
    
    // Check if subject already exists
    if (subjects.some(s => s.name === newSubject)) {
      toast({
        title: "Subject already added",
        description: `You already have ${newSubject} in your subjects list.`,
        variant: "destructive"
      });
      return;
    }
    
    // Fetch modules for this subject
    const modules = await getModulesForSubject(newSubject);
    
    // Add the new subject
    setSubjects([
      ...subjects,
      {
        name: newSubject,
        modules,
        selectedModules: [] // By default, no modules are selected
      }
    ]);
    
    // Clear the input
    setNewSubject("");
  };
  
  // Remove a subject
  const handleRemoveSubject = (subjectName: string) => {
    setSubjects(subjects.filter(s => s.name !== subjectName));
  };
  
  // Toggle a module selection
  const handleToggleModule = (subjectName: string, moduleId: string) => {
    setSubjects(subjects.map(subject => {
      if (subject.name === subjectName) {
        // Check if module is already selected
        const isSelected = subject.selectedModules.includes(moduleId);
        
        return {
          ...subject,
          selectedModules: isSelected
            ? subject.selectedModules.filter(id => id !== moduleId) // Remove
            : [...subject.selectedModules, moduleId] // Add
        };
      }
      return subject;
    }));
  };
  
  // Save changes to database
  const handleSaveChanges = async () => {
    if (!effectiveTeacherId) return;
    
    setIsSaving(true);
    try {
      // Convert subjects to the format needed for database
      const subjectsArray = subjects.map(s => s.name);
      
      // Create teacher_modules object
      const modulesObject: Record<string, string[]> = {};
      subjects.forEach(subject => {
        modulesObject[subject.name] = subject.selectedModules;
      });
      
      // Update the teacher record
      const { error } = await supabase
        .from('teachers')
        .update({
          subjects: subjectsArray,
          teacher_modules: modulesObject
        })
        .eq('id', effectiveTeacherId);
      
      if (error) {
        console.error("Error updating teacher subjects:", error);
        throw error;
      }
      
      toast({
        title: "Changes saved",
        description: "Your teaching subjects and modules have been updated."
      });
      
      // Close the modal
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save changes:", err);
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teaching Subjects</CardTitle>
          <CardDescription>Loading your teaching subjects...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teaching Subjects</CardTitle>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Teaching Subjects</CardTitle>
            <CardDescription>
              {readOnly 
                ? "Subjects and modules this teacher can teach" 
                : "Manage your teaching subjects and modules"}
            </CardDescription>
          </div>
          
          {!readOnly && (
            <Button 
              variant="default"
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-purple-800"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Subjects
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Subject list (view-only) */}
          <div className="space-y-4">
            {subjects.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {readOnly
                  ? "This teacher hasn't added any teaching subjects yet."
                  : "You haven't added any teaching subjects yet."}
              </div>
            ) : (
              subjects.map((subject) => (
                <div key={subject.name} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{subject.name}</h3>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="mb-2 block">Modules</Label>
                    <div className="space-y-2">
                      {subject.modules.length === 0 ? (
                        <p className="text-gray-500 text-sm">No modules available for this subject</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {subject.modules.map((module) => {
                            const isSelected = subject.selectedModules.includes(module.id);
                            
                            return isSelected ? (
                              <Badge 
                                key={module.id}
                                variant="default"
                                className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                <BookOpen className="h-3 w-3" />
                                <span>{module.name}</span>
                                <span className="text-xs opacity-70">({module.level})</span>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Teaching Subjects</DialogTitle>
            <DialogDescription>
              Add subjects you can teach and select specific modules within each subject.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 py-4">
            <div className="space-y-6 pr-4">
              {/* Subject list (edit mode) */}
              {subjects.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No subjects added yet. Add a subject below to get started.
                </div>
              ) : (
                <div className="space-y-6">
                  {subjects.map((subject) => (
                    <div key={subject.name} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{subject.name}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveSubject(subject.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="mb-2 block">Select modules you can teach</Label>
                        <div className="space-y-2">
                          {subject.modules.length === 0 ? (
                            <p className="text-gray-500 text-sm">No modules available for this subject</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {subject.modules.map((module) => {
                                const isSelected = subject.selectedModules.includes(module.id);
                                
                                return (
                                  <Badge 
                                    key={module.id}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`
                                      ${isSelected 
                                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                        : "text-gray-500"}
                                      cursor-pointer flex items-center gap-1
                                    `}
                                    onClick={() => handleToggleModule(subject.name, module.id)}
                                  >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    <BookOpen className="h-3 w-3" />
                                    <span>{module.name}</span>
                                    <span className="text-xs opacity-70">({module.level})</span>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add subject form */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">Add a new subject</h3>
                <div className="flex gap-2">
                  <Select value={newSubject} onValueChange={setNewSubject}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects
                        .filter(subject => !subjects.some(s => s.name === subject))
                        .map(subject => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleAddSubject}
                    disabled={!newSubject}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 