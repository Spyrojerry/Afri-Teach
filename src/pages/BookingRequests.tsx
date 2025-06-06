import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { BookingRequest, getTeacherBookingRequests, updateBookingRequestStatus } from "@/services/bookingRequestService";
import { useToast } from "@/components/ui/use-toast";
import { 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  XCircle,
  Calendar,
  ClipboardCheck,
  Filter
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BookingRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    const fetchBookingRequests = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const requests = await getTeacherBookingRequests(user.id);
        setBookingRequests(requests);
      } catch (error) {
        console.error("Error fetching booking requests:", error);
        toast({
          title: "Failed to load booking requests",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingRequests();
  }, [user?.id, toast]);

  // Get all unique subjects from booking requests
  const allSubjects = Array.from(
    new Set(bookingRequests.map(request => request.subject))
  ).sort();

  // Filter booking requests based on active tab and selected subject
  const filteredRequests = bookingRequests.filter(request => {
    // Filter by status
    if (activeTab !== "all" && request.status !== activeTab) {
      return false;
    }
    
    // Filter by subject
    if (selectedSubject !== "all" && request.subject !== selectedSubject) {
      return false;
    }
    
    return true;
  });

  // Handle accepting a booking request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await updateBookingRequestStatus(requestId, "approved");
      if (success) {
        // Update local state
        setBookingRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId ? { ...req, status: "approved" } : req
          )
        );
        
        toast({
          title: "Booking request accepted",
          description: "The student will be notified about your decision.",
        });
        
        // Close dialog if open
        setShowDetailsDialog(false);
      } else {
        throw new Error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error accepting booking request:", error);
      toast({
        title: "Failed to accept booking",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Handle rejecting a booking request
  const handleRejectRequest = async (requestId: string) => {
    try {
      const success = await updateBookingRequestStatus(requestId, "rejected");
      if (success) {
        // Update local state
        setBookingRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId ? { ...req, status: "rejected" } : req
          )
        );
        
        toast({
          title: "Booking request rejected",
          description: "The student will be notified about your decision.",
        });
        
        // Close dialog if open
        setShowDetailsDialog(false);
      } else {
        throw new Error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error rejecting booking request:", error);
      toast({
        title: "Failed to reject booking",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Format time from API
  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Format relative time for created_at
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return "just now";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return "unknown time";
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Show request details dialog
  const showRequestDetails = (request: BookingRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="teacher">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading booking requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="teacher">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Booking Requests</h1>
            <p className="text-gray-500">Manage and respond to student booking requests</p>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {allSubjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-purple-600" />
              Booking Requests
            </CardTitle>
            <CardDescription>
              Review and respond to lesson booking requests from students
            </CardDescription>
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending
                  <Badge className="ml-2 bg-yellow-500">
                    {bookingRequests.filter(req => req.status === "pending").length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filteredRequests.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-4">
                  {filteredRequests.map(request => (
                    <div 
                      key={request.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => showRequestDetails(request)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.studentAvatar} />
                          <AvatarFallback>
                            {request.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <h3 className="font-semibold">{request.studentName}</h3>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(request.status)}
                              <span className="text-xs text-gray-500">{formatRelativeTime(request.created_at)}</span>
                            </div>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm font-medium">{request.subject} Lesson</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>{formatDate(request.date)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>{request.startTime} - {request.endTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {request.message && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          {request.message}
                        </div>
                      )}
                      {request.status === "pending" && (
                        <div className="flex justify-end mt-3 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectRequest(request.id);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptRequest(request.id);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-1">No {activeTab} booking requests</h3>
                <p className="text-sm text-gray-400">
                  {activeTab === "pending" 
                    ? "You have no pending booking requests to review" 
                    : activeTab === "approved"
                    ? "You haven't approved any booking requests yet"
                    : "You haven't rejected any booking requests yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Request Details</DialogTitle>
              <DialogDescription>
                Review the details of this booking request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedRequest.studentAvatar} />
                  <AvatarFallback>
                    {selectedRequest.studentName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedRequest.studentName}</h3>
                  <p className="text-sm text-gray-500">Student</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  <p>{selectedRequest.subject}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p>{formatDate(selectedRequest.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p>{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                </div>
                
                {selectedRequest.message && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Message</p>
                    <p className="bg-gray-50 p-2 rounded-md text-sm">{selectedRequest.message}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              {selectedRequest.status === "pending" ? (
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleAcceptRequest(selectedRequest.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowDetailsDialog(false)} className="w-full">
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default BookingRequests; 