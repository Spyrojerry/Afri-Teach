import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Search,
  SendHorizontal,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Info,
  Loader2,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Define interfaces for our data structures
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  status: "online" | "offline" | "away";
  unreadCount: number;
  role: "student" | "teacher";
}

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

const Messages = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { userRole, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  // Handle resize events to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // For demo purposes, define your own user ID
  const currentUserId = user?.id || "999"; // This would come from auth context in a real app

  // Load contacts from Supabase
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        if (!user?.id) {
          console.log("No user ID available, cannot fetch contacts");
          return;
        }
        
        console.log("Fetching contacts for user:", user.id, "with role:", userRole);
        
        let contactsQuery;
        
        // Different queries based on user role
        if (userRole === "teacher") {
          console.log("Fetching students for teacher");
          // Get students who have bookings with this teacher
          const bookingsResponse = await supabase
            .from('bookings')
            .select('student_id')
            .eq('teacher_id', user.id);
          
          if (bookingsResponse.error) {
            console.error("Error fetching bookings:", bookingsResponse.error);
            throw bookingsResponse.error;
          }
          
          // Debug the structure of the first booking if available
          if (bookingsResponse.data && bookingsResponse.data.length > 0) {
            console.log("Sample booking structure:", Object.keys(bookingsResponse.data[0]));
          } else {
            console.log("No bookings found");
          }
          
          if (!bookingsResponse.data || bookingsResponse.data.length === 0) {
            console.log("No bookings found for this teacher");
            setContacts([]);
            setIsLoading(false);
            return;
          }
          
          console.log("Bookings data:", bookingsResponse.data);
          
          // Extract unique student IDs
          const studentIds = [...new Set(bookingsResponse.data.map(booking => booking.student_id))];
          console.log("Student IDs:", studentIds);
          
          if (studentIds.length === 0) {
            setContacts([]);
            setIsLoading(false);
            return;
          }
          
          // Fetch student data
          const studentsResponse = await supabase
            .from('students')
            .select('*')
            .in('id', studentIds);
          
          if (studentsResponse.error) {
            console.error("Error fetching students:", studentsResponse.error);
            throw studentsResponse.error;
          }
          
          console.log("Students data:", studentsResponse.data);
          
          // Transform data for our interface
          contactsQuery = studentsResponse.data.map(student => ({
            id: student.id,
            first_name: student.first_name || "Unknown",
            last_name: student.last_name || "Student",
            profile_picture_url: student.profile_picture_url,
            lastMessage: "Hello teacher, I have a question about my lessons.",
            lastMessageTime: new Date(Date.now() - Math.random() * 48 * 3600000).toISOString(),
            status: Math.random() > 0.5 ? "online" : "offline",
            unreadCount: Math.floor(Math.random() * 3),
            role: "student" as const
          }));
        } else {
          console.log("Fetching teachers for student");
          // For students, fetch teachers they have bookings with
          const bookingsResponse = await supabase
            .from('bookings')
            .select('teacher_id')
            .eq('student_id', user.id);
          
          if (bookingsResponse.error) {
            console.error("Error fetching bookings:", bookingsResponse.error);
            throw bookingsResponse.error;
          }
          
          if (!bookingsResponse.data || bookingsResponse.data.length === 0) {
            console.log("No bookings found for this student");
            setContacts([]);
            setIsLoading(false);
            return;
          }
          
          console.log("Bookings data:", bookingsResponse.data);
          
          // Extract unique teacher IDs
          const teacherIds = [...new Set(bookingsResponse.data.map(booking => booking.teacher_id))];
          console.log("Teacher IDs:", teacherIds);
          
          if (teacherIds.length === 0) {
            setContacts([]);
            setIsLoading(false);
            return;
          }
          
          // Fetch teacher data
          const teachersResponse = await supabase
            .from('teachers')
            .select('*')
            .in('id', teacherIds);
          
          if (teachersResponse.error) {
            console.error("Error fetching teachers:", teachersResponse.error);
            throw teachersResponse.error;
          }
          
          console.log("Teachers data:", teachersResponse.data);
          
          // Transform data for our interface
          contactsQuery = teachersResponse.data.map(teacher => ({
            id: teacher.id,
            first_name: teacher.first_name || "Unknown",
            last_name: teacher.last_name || "Teacher",
            profile_picture_url: teacher.profile_picture_url,
            lastMessage: "I've shared some materials for our next lesson.",
            lastMessageTime: new Date(Date.now() - Math.random() * 48 * 3600000).toISOString(),
            status: Math.random() > 0.5 ? "online" : "offline",
            unreadCount: Math.floor(Math.random() * 3),
            role: "teacher" as const
          }));
        }
        
        if (!contactsQuery || contactsQuery.length === 0) {
          console.log("No contacts found after processing");
          setContacts([]);
          setIsLoading(false);
          return;
        }
        
        console.log("Final contacts data:", contactsQuery);
        
        // Sort by most recent message
        contactsQuery.sort((a, b) => {
          if (!a.lastMessageTime || !b.lastMessageTime) return 0;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });
        
        setContacts(contactsQuery);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to load contacts. Please try again later.");
        
        // Fallback to mock data for testing
        setContacts(getMockContacts());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContacts();
  }, [userRole, user?.id]);
  
  // Mock contacts for fallback/testing
  const getMockContacts = (): Contact[] => {
    return [
      {
        id: "1",
        first_name: "John",
        last_name: "Smith",
        profile_picture_url: "/avatars/student-1.jpg",
        lastMessage: "When is our next lesson?",
        lastMessageTime: new Date(Date.now() - 10 * 60000).toISOString(),
        status: "online",
        unreadCount: 2,
        role: "student"
      },
      {
        id: "2",
        first_name: "Emily",
        last_name: "Johnson",
        profile_picture_url: "/avatars/student-2.jpg",
        lastMessage: "Thanks for the great lesson!",
        lastMessageTime: new Date(Date.now() - 3 * 3600000).toISOString(),
        status: "offline",
        unreadCount: 0,
        role: "student"
      },
      {
        id: "3",
        first_name: "Ade",
        last_name: "Johnson",
        profile_picture_url: "/avatars/teacher-1.jpg",
        lastMessage: "I've shared some additional resources for you",
        lastMessageTime: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        status: "away",
        unreadCount: 1,
        role: "teacher"
      }
    ];
  };

  // Load mock messages when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      // This would be an API call in a real app
      const mockMessages: Message[] = [
        {
          id: 1,
          senderId: selectedContact.id,
          receiverId: currentUserId,
          text: "Hello, how are you?",
          timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
          isRead: true
        },
        {
          id: 2,
          senderId: currentUserId,
          receiverId: selectedContact.id,
          text: "I'm doing well, thanks for asking! How about you?",
          timestamp: new Date(Date.now() - 3 * 24 * 3600000 + 10 * 60000).toISOString(),
          isRead: true
        },
        {
          id: 3,
          senderId: selectedContact.id,
          receiverId: currentUserId,
          text: "I'm good too. I wanted to ask about our next lesson.",
          timestamp: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
          isRead: true
        },
        {
          id: 4,
          senderId: currentUserId,
          receiverId: selectedContact.id,
          text: "Sure, I'm available next Tuesday at 2 PM. Does that work for you?",
          timestamp: new Date(Date.now() - 1 * 24 * 3600000 + 30 * 60000).toISOString(),
          isRead: true
        },
        {
          id: 5,
          senderId: selectedContact.id,
          receiverId: currentUserId,
          text: "That works perfectly. I'll book the slot.",
          timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
          isRead: true
        },
        {
          id: 6,
          senderId: selectedContact.id,
          receiverId: currentUserId,
          text: selectedContact.lastMessage || "When is our next lesson?",
          timestamp: selectedContact.lastMessageTime || new Date().toISOString(),
          isRead: selectedContact.unreadCount === 0
        }
      ];

      setMessages(mockMessages);

      // Mark contact messages as read
      if (selectedContact.unreadCount > 0) {
        setContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.id === selectedContact.id 
              ? { ...contact, unreadCount: 0 } 
              : contact
          )
        );
      }
    }
  }, [selectedContact, currentUserId]);

  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const newMessageObj: Message = {
      id: messages.length + 1,
      senderId: currentUserId,
      receiverId: selectedContact.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages([...messages, newMessageObj]);
    
    // Update last message in contacts
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === selectedContact.id 
          ? { 
              ...contact, 
              lastMessage: newMessage,
              lastMessageTime: new Date().toISOString()
            } 
          : contact
      )
    );
    
    setNewMessage("");
  };

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return format(date, "EEEE");
    } else {
      return format(date, "MMM d");
    }
  };

  // Format timestamp for message bubbles
  const formatBubbleTime = (timestamp: string) => {
    return format(new Date(timestamp), "h:mm a");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };
  
  // Render chat content for both desktop and mobile views
  const renderChatContent = () => (
    <>
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedContact?.profile_picture_url} alt={`${selectedContact?.first_name} ${selectedContact?.last_name}`} />
                <AvatarFallback>
                  {selectedContact?.first_name?.[0]}{selectedContact?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span 
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${getStatusColor(selectedContact?.status || 'offline')}`}
              ></span>
            </div>
            <div>
              <h3 className="font-medium">{selectedContact?.first_name} {selectedContact?.last_name}</h3>
              <p className="text-xs text-gray-500 capitalize">{selectedContact?.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Phone className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Video className="h-5 w-5 text-gray-600" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View profile</DropdownMenuItem>
                <DropdownMenuItem>Block contact</DropdownMenuItem>
                <DropdownMenuItem>Delete conversation</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      {/* Messages Area */}
      <CardContent className="flex-grow p-4 overflow-y-auto h-[calc(70vh-220px)]">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.senderId === currentUserId 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div 
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId ? 'text-purple-200' : 'text-gray-500'
                    }`}
                  >
                    {formatBubbleTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Message Input */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Paperclip className="h-5 w-5 text-gray-600" />
          </Button>
          <Input 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow"
          />
          <Button 
            variant="default" 
            size="icon" 
            className="rounded-full bg-purple-600 hover:bg-purple-700"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <DashboardLayout userType={userRole}>
      <div className="container mx-auto px-4 py-8 pt-4">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[70vh]">
          {/* Contacts List */}
          <Card className="lg:col-span-1 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                Conversations
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search contacts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading conversations...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[calc(70vh-135px)]">
                  {filteredContacts.length > 0 ? (
                    <div className="divide-y">
                      {filteredContacts.map(contact => (
                        <div 
                          key={contact.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedContact?.id === contact.id ? 'bg-purple-50' : ''
                          }`}
                          onClick={() => setSelectedContact(contact)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-12 w-12 border-2 border-gray-100">
                                <AvatarImage src={contact.profile_picture_url} alt={`${contact.first_name} ${contact.last_name}`} />
                                <AvatarFallback>
                                  {contact.first_name[0]}{contact.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span 
                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(contact.status)}`}
                              ></span>
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-center">
                                <h3 className="font-medium truncate">{contact.first_name} {contact.last_name}</h3>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                  {contact.lastMessageTime && formatMessageTime(contact.lastMessageTime)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-gray-500 truncate">
                                  {contact.lastMessage || "No messages yet"}
                                </p>
                                {contact.unreadCount > 0 && (
                                  <Badge className="ml-2 bg-red-500 rounded-full h-5 min-w-5 flex items-center justify-center">
                                    {contact.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-1">No conversations found</h3>
                      <p className="text-sm text-gray-400">
                        {searchQuery ? "Try a different search term" : "Start a new conversation"}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* Chat Window - Desktop View */}
          {!isMobileView && (
            <Card className="lg:col-span-2 flex flex-col">
              {selectedContact ? (
                renderChatContent()
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No conversation selected</h3>
                    <p className="text-gray-500">
                      Choose a contact from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
          
          {/* Chat Window - Mobile View */}
          {isMobileView && selectedContact && (
            <Sheet open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full">
                {renderChatContent()}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages; 