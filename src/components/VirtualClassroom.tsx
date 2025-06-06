import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  MessageCircle, 
  Users, 
  Share, 
  FileText, 
  ScreenShare,
  Send,
  Clock
} from "lucide-react";
import { format } from "date-fns";

// Lesson interface
interface Lesson {
  id: string;
  subject: string;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  teacher: {
    id: string;
    name: string;
    avatar?: string;
  };
  student: {
    id: string;
    name: string;
    avatar?: string;
  };
  notes?: string;
}

// Message interface
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
}

// Props interface
interface VirtualClassroomProps {
  lesson: Lesson;
  userRole: 'teacher' | 'student';
  userId: string;
  onEndSession?: () => void;
}

export const VirtualClassroom = ({ lesson, userRole, userId, onEndSession }: VirtualClassroomProps) => {
  const [activeTab, setActiveTab] = useState("video");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Mock data for participants
  const participants = [
    lesson.teacher,
    lesson.student
  ];
  
  // Calculate remaining time
  useEffect(() => {
    const calculateRemainingTime = () => {
      const now = new Date();
      const [hours, minutes] = lesson.endTime.split(':').map(Number);
      const endTime = new Date(lesson.date);
      endTime.setHours(hours, minutes);
      
      const diff = endTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        return "Session ended";
      }
      
      const minutesRemaining = Math.floor(diff / 60000);
      const hoursRemaining = Math.floor(minutesRemaining / 60);
      const mins = minutesRemaining % 60;
      
      return hoursRemaining > 0 
        ? `${hoursRemaining}h ${mins}m remaining` 
        : `${mins}m remaining`;
    };
    
    setRemainingTime(calculateRemainingTime());
    
    const interval = setInterval(() => {
      setRemainingTime(calculateRemainingTime());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [lesson.date, lesson.endTime]);
  
  // Mock webcam stream (in a real implementation, this would use WebRTC)
  useEffect(() => {
    const setupMockVideo = async () => {
      try {
        if (videoRef.current && isVideoEnabled) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: isAudioEnabled
          });
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };
    
    if (isVideoEnabled) {
      setupMockVideo();
    } else if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isVideoEnabled, isAudioEnabled]);
  
  // Mock screen sharing
  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
      } else {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        
        if (isVideoEnabled) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Error during screen sharing:", error);
    }
  };
  
  // Send chat message
  const sendMessage = () => {
    if (message.trim() === "") return;
    
    const currentUser = userRole === 'teacher' ? lesson.teacher : lesson.student;
    
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: userId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: message,
      timestamp: new Date()
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setMessage("");
    
    // Scroll to bottom of chat
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };
  
  // End the session
  const handleEndSession = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    
    if (onEndSession) {
      onEndSession();
    }
  };
  
  // Get the other participant
  const otherParticipant = userRole === 'teacher' ? lesson.student : lesson.teacher;
  
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{lesson.subject}</h1>
          <p className="text-gray-500">
            {format(new Date(lesson.date), 'EEEE, MMMM d, yyyy')} • {lesson.startTime} - {lesson.endTime}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <Clock className="h-3 w-3" />
            {remainingTime}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {lesson.status}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        <div className="lg:col-span-3 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Video</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Materials</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Video Tab */}
            <TabsContent value="video" className="flex-1 flex flex-col">
              <div className="flex-1 bg-gray-900 rounded-md overflow-hidden relative">
                {isVideoEnabled ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted={!isAudioEnabled} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-gray-400">
                      <VideoOff className="h-16 w-16 mx-auto mb-2" />
                      <p>Video is turned off</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <Avatar className="h-20 w-20 border-2 border-white">
                    <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-xl text-white">
                      {otherParticipant.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                  <Button 
                    variant={isAudioEnabled ? "default" : "destructive"} 
                    size="icon" 
                    className="rounded-full h-12 w-12"
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button 
                    variant={isVideoEnabled ? "default" : "destructive"} 
                    size="icon" 
                    className="rounded-full h-12 w-12"
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button 
                    variant={isScreenSharing ? "destructive" : "default"} 
                    size="icon" 
                    className="rounded-full h-12 w-12"
                    onClick={handleScreenShare}
                  >
                    <ScreenShare className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="rounded-full h-12 w-12"
                    onClick={handleEndSession}
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col data-[state=active]:flex-1">
              <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 flex flex-col p-4 h-[calc(100%-2rem)]">
                  <ScrollArea className="flex-1 pr-4" ref={chatScrollRef}>
                    <div className="space-y-4 py-4">
                      {chatMessages.length > 0 ? (
                        chatMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex items-start gap-2 ${msg.senderId === userId ? 'justify-end' : ''}`}
                          >
                            {msg.senderId !== userId && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs">
                                  {msg.senderName.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div 
                              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                msg.senderId === userId 
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                                : 'bg-gray-100'
                              }`}
                            >
                              {msg.senderId !== userId && (
                                <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                              )}
                              <p>{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1 text-right">
                                {format(msg.timestamp, 'hh:mm a')}
                              </p>
                            </div>
                            {msg.senderId === userId && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs">
                                  {msg.senderName.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="mt-4 flex gap-2">
                    <Textarea 
                      placeholder="Type your message..." 
                      className="flex-1"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button 
                      className="self-end"
                      onClick={sendMessage}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Materials Tab */}
            <TabsContent value="materials" className="flex-1 flex flex-col data-[state=active]:flex-1">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Learning Materials</CardTitle>
                  <CardDescription>
                    Share and access resources for this lesson
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {userRole === 'teacher' && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2">Share Material</h3>
                      <div className="flex gap-2">
                        <Input type="file" />
                        <Button>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="border rounded-md p-8 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="mb-2">No materials shared yet</p>
                    {userRole === 'teacher' && (
                      <p className="text-sm">Upload files to share with your student</p>
                    )}
                    {userRole === 'student' && (
                      <p className="text-sm">Your teacher hasn't shared any materials yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={participant.avatar} alt={participant.name} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                        {participant.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {participant.id === lesson.teacher.id ? 'Teacher' : 'Student'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium mb-3">Session Notes</h3>
                <Textarea 
                  placeholder="Take notes during your session..."
                  className="h-[200px]"
                  defaultValue={lesson.notes}
                />
                <Button className="w-full mt-2">Save Notes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 