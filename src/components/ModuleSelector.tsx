import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import { LearningModule, getModulesForSubject } from "@/services/bookingService";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";

interface ModuleSelectorProps {
  subject: string;
  onModuleSelect: (module: LearningModule | null) => void;
  teacherId?: string; // Optional - for filtering by teacher's selected modules
}

export const ModuleSelector = ({ 
  subject, 
  onModuleSelect,
  teacherId
}: ModuleSelectorProps) => {
  const { user } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [teacherModuleIds, setTeacherModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [studentProgress, setStudentProgress] = useState<Record<string, any>>({});
  
  // Fetch modules for the selected subject
  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        // Fetch all modules for this subject
        const allModules = await getModulesForSubject(subject);
        
        // If teacherId is provided, filter by teacher's selected modules
        if (teacherId) {
          // Fetch teacher's module selections for this subject
          const { data, error } = await supabase
            .from('teachers')
            .select('teacher_modules')
            .eq('id', teacherId)
            .single();
          
          if (error) {
            console.error("Error fetching teacher modules:", error);
            setModules(allModules); // Fall back to all modules
          } else {
            // Get the teacher's selected modules for this subject
            const teacherModules = data.teacher_modules || {};
            const selectedModuleIds = teacherModules[subject] || [];
            setTeacherModuleIds(selectedModuleIds);
            
            if (selectedModuleIds.length > 0) {
              // Filter modules to only those the teacher has selected
              const filteredModules = allModules.filter(
                module => selectedModuleIds.includes(module.id)
              );
              setModules(filteredModules.length > 0 ? filteredModules : allModules);
            } else {
              // If teacher hasn't selected any modules, show all
              setModules(allModules);
            }
          }
        } else {
          // If no teacherId, just use all modules
          setModules(allModules);
        }
        
        // If user is logged in (student), fetch their progress
        if (user?.id) {
          const { data: progressData, error: progressError } = await supabase
            .from('student_progress')
            .select('*')
            .eq('student_id', user.id);
          
          if (!progressError && progressData) {
            // Convert to a lookup object by module_id
            const progressByModule: Record<string, any> = {};
            progressData.forEach(entry => {
              progressByModule[entry.module_id] = entry;
            });
            
            setStudentProgress(progressByModule);
          }
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (subject) {
      fetchModules();
    }
  }, [subject, teacherId, user?.id]);
  
  // Handle selecting a module
  const handleSelectModule = (module: LearningModule) => {
    setSelectedModule(module);
    onModuleSelect(module);
  };
  
  // Handle skipping module selection
  const handleSkipSelection = () => {
    setSelectedModule(null);
    onModuleSelect(null);
  };
  
  // Calculate progress percentage for a module
  const getModuleProgress = (moduleId: string) => {
    const progress = studentProgress[moduleId];
    if (!progress) return 0;
    
    const { completed_lessons, lessons } = progress;
    return lessons > 0 ? Math.min(100, Math.round((completed_lessons / lessons) * 100)) : 0;
  };
  
  // Determine if a module is in progress
  const isModuleInProgress = (moduleId: string) => {
    return moduleId in studentProgress;
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-6">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Group modules by level
  const modulesByLevel: Record<string, LearningModule[]> = {
    Beginner: modules.filter(m => m.level === 'Beginner'),
    Intermediate: modules.filter(m => m.level === 'Intermediate'),
    Advanced: modules.filter(m => m.level === 'Advanced')
  };
  
  // Get a message about module availability
  const getModuleAvailabilityMessage = () => {
    if (modules.length === 0) {
      return "No learning modules are currently available for this subject.";
    }
    
    if (teacherId && teacherModuleIds.length === 0) {
      return "This teacher hasn't selected specific modules to teach for this subject yet.";
    }
    
    return null;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span>{subject} Learning Modules</span>
        </CardTitle>
        <CardDescription>
          Select a module to track your learning progress
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {getModuleAvailabilityMessage() ? (
          <div className="text-center py-4 text-gray-500">
            {getModuleAvailabilityMessage()}
          </div>
        ) : (
          Object.entries(modulesByLevel).map(([level, levelModules]) => 
            levelModules.length > 0 && (
              <div key={level} className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {level} Level
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {levelModules.map(module => {
                    const inProgress = isModuleInProgress(module.id);
                    const progress = getModuleProgress(module.id);
                    
                    return (
                      <Card 
                        key={module.id}
                        className={`
                          overflow-hidden cursor-pointer transition-all
                          ${selectedModule?.id === module.id 
                            ? 'ring-2 ring-primary shadow-md' 
                            : 'hover:shadow-md'}
                        `}
                        onClick={() => handleSelectModule(module)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{module.name}</h4>
                            <Badge variant="outline">
                              {module.lessons} {module.lessons === 1 ? 'lesson' : 'lessons'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {module.description}
                          </p>
                          
                          {inProgress && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Progress</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )
          )
        )}
        
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline"
            onClick={handleSkipSelection}
          >
            Skip for now
          </Button>
          
          {selectedModule && (
            <Button 
              className="bg-gradient-to-r from-green-600 to-green-700"
              onClick={() => onModuleSelect(selectedModule)}
            >
              Select Module <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 