import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Download,
  Filter,
  Loader2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";

interface EarningItem {
  id: string | number;
  date: string;
  amount: number;
  studentName: string;
  subject: string;
  status: "paid" | "pending" | "failed";
  student_id?: string;
  booking_id?: string;
}

interface MonthlyEarning {
  month: number;
  year: number;
  totalAmount: number;
  totalLessons: number;
}

// Define interfaces for database response types
interface PaymentRecord {
  id: string;
  booking_id: string;
  amount_usd: number;
  teacher_payout_usd: number;
  status: string;
  created_at: string;
  payout_date: string | null;
  bookings: {
    teacher_id: string;
    student_id: string;
    subject: string;
  };
}

interface StudentRecord {
  id: string;
  first_name: string;
  last_name: string;
}

const TeacherEarnings = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [currentPeriod, setCurrentPeriod] = useState("thisMonth");
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch real earnings data from Supabase
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching earnings for teacher:", user.id);
        
        // First check if we have the payments table with the right structure
        const { error: structureError } = await supabase
          .from('payments')
          .select('id')
          .limit(1);
        
        if (structureError) {
          console.error("Error checking payments table:", structureError);
          throw new Error("Payments table may not exist");
        }
        
        // Try to get payments linked to bookings where this teacher is involved
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            booking_id,
            amount_usd,
            teacher_payout_usd,
            status,
            created_at,
            payout_date,
            bookings!booking_id(
              teacher_id,
              student_id,
              subject
            )
          `)
          .eq('bookings.teacher_id', user.id);
        
        if (error) {
          console.error("Error fetching payments:", error);
          throw error;
        }
        
        console.log("Raw payments data:", data);
        
        if (!data || data.length === 0) {
          console.log("No payments found for this teacher");
          setEarnings([]);
          setMonthlyEarnings([]);
          setIsLoading(false);
          return;
        }
        
        // Get unique student IDs
        const studentIds = [...new Set(data
          .filter(payment => (payment as any).bookings?.student_id)
          .map(payment => (payment as any).bookings.student_id)
        )];
        
        // Fetch student data
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .in('id', studentIds as any[]);
        
        if (studentsError) {
          console.error("Error fetching students:", studentsError);
          throw studentsError;
        }
        
        // Create a map of student names
        const studentNames = new Map();
        if (studentsData) {
          studentsData.forEach(student => {
            const s = student as any;
            studentNames.set(s.id, `${s.first_name} ${s.last_name}`);
          });
        }
        
        // Process payments into earnings items
        const processedEarnings: EarningItem[] = data.map(payment => {
          const p = payment as any;
          const studentId = p.bookings?.student_id;
          const studentName = studentId && studentNames.has(studentId) 
            ? studentNames.get(studentId) 
            : "Unknown Student";
          
          // Determine payment status
          let status: "paid" | "pending" | "failed";
          if (p.status === "paid" || p.status === "payout_completed") {
            status = "paid";
          } else if (p.status === "pending_payout") {
            status = "pending";
          } else {
            status = "failed";
          }
          
          // Use the teacher_payout_usd if available, otherwise use amount_usd
          const amount = p.teacher_payout_usd !== undefined && p.teacher_payout_usd !== null 
            ? p.teacher_payout_usd 
            : (p.amount_usd || 0);
          
          return {
            id: p.id,
            date: p.created_at || new Date().toISOString(),
            amount: amount,
            studentName: studentName,
            subject: p.bookings?.subject || "General Lesson",
            status: status,
            student_id: studentId,
            booking_id: p.booking_id
          };
        });
        
        console.log("Processed earnings:", processedEarnings);
        setEarnings(processedEarnings);
        
        // Calculate monthly totals
        const monthlyData: Map<string, MonthlyEarning> = new Map();
        
        processedEarnings.forEach(earning => {
          const date = new Date(earning.date);
          const year = date.getFullYear();
          const month = date.getMonth();
          const key = `${year}-${month}`;
          
          if (!monthlyData.has(key)) {
            monthlyData.set(key, {
              year,
              month,
              totalAmount: 0,
              totalLessons: 0
            });
          }
          
          const monthData = monthlyData.get(key)!;
          
          if (earning.status === "paid") {
            monthData.totalAmount += earning.amount;
          }
          monthData.totalLessons += 1;
        });
        
        const sortedMonthlyEarnings = Array.from(monthlyData.values())
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });
        
        setMonthlyEarnings(sortedMonthlyEarnings);
        
        // Calculate totals
        const total = processedEarnings.reduce((sum, item) => 
          item.status === "paid" ? sum + item.amount : sum, 0);
        const pending = processedEarnings.reduce((sum, item) => 
          item.status === "pending" ? sum + item.amount : sum, 0);
        const lessons = processedEarnings.length;
        
        setTotalEarnings(total);
        setPendingAmount(pending);
        setTotalLessons(lessons);
      } catch (err) {
        console.error("Failed to fetch earnings:", err);
        setError("Failed to load earnings data. Please try again later.");
        
        // Fallback to mock data
        const mockEarnings: EarningItem[] = [
          {
            id: 1,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: 50,
            studentName: "John Smith",
            subject: "Mathematics",
            status: "paid"
          },
          {
            id: 2,
            date: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
            amount: 45,
            studentName: "Emily Johnson",
            subject: "Algebra",
            status: "paid"
          },
          {
            id: 3,
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: 60,
            studentName: "Michael Brown",
            subject: "Geometry",
            status: "pending"
          }
        ];

        const mockMonthlyEarnings: MonthlyEarning[] = [
          {
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            totalAmount: 110,
            totalLessons: 2
          },
          {
            month: subMonths(new Date(), 1).getMonth(),
            year: subMonths(new Date(), 1).getFullYear(),
            totalAmount: 45,
            totalLessons: 1
          }
        ];

        setEarnings(mockEarnings);
        setMonthlyEarnings(mockMonthlyEarnings);
        
        const total = mockEarnings.reduce((sum, item) => 
          item.status === "paid" ? sum + item.amount : sum, 0);
        const pending = mockEarnings.reduce((sum, item) => 
          item.status === "pending" ? sum + item.amount : sum, 0);
        const lessons = mockEarnings.length;
        
        setTotalEarnings(total);
        setPendingAmount(pending);
        setTotalLessons(lessons);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEarnings();
  }, [user?.id]);

  // Filter earnings based on selected period
  const filteredEarnings = earnings.filter(earning => {
    const earningDate = new Date(earning.date);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    switch (currentPeriod) {
      case "thisMonth":
        return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear;
      case "lastMonth": {
        const lastMonth = subMonths(currentDate, 1);
        return earningDate.getMonth() === lastMonth.getMonth() && earningDate.getFullYear() === lastMonth.getFullYear();
      }
      case "last3Months": {
        const threeMonthsAgo = subMonths(currentDate, 3);
        return earningDate >= threeMonthsAgo;
      }
      case "allTime":
        return true;
      default:
        return true;
    }
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: "paid" | "pending" | "failed") => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="teacher" showBackButton={true} backTo="/teacher/profile">
      <div className="container mx-auto px-4 py-8 pt-4">
        <h1 className="text-3xl font-bold mb-6">My Earnings</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading earnings data...</span>
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
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
                  <p className="text-sm text-gray-500 mt-1">Lifetime earnings</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Pending Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(pendingAmount)}</p>
                  <p className="text-sm text-gray-500 mt-1">To be processed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Total Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">{totalLessons}</p>
                  <p className="text-sm text-gray-500 mt-1">Lessons completed</p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="transactions" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                      <SelectItem value="last3Months">Last 3 Months</SelectItem>
                      <SelectItem value="allTime">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <TabsContent value="transactions" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                      All your earnings from lessons
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredEarnings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="py-3 px-4 font-medium">Date</th>
                              <th className="py-3 px-4 font-medium">Student</th>
                              <th className="py-3 px-4 font-medium">Subject</th>
                              <th className="py-3 px-4 font-medium text-right">Amount</th>
                              <th className="py-3 px-4 font-medium text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEarnings.map((earning) => (
                              <tr key={earning.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{format(new Date(earning.date), 'MMM d, yyyy')}</td>
                                <td className="py-3 px-4">{earning.studentName}</td>
                                <td className="py-3 px-4">{earning.subject}</td>
                                <td className="py-3 px-4 text-right font-medium">{formatCurrency(earning.amount)}</td>
                                <td className="py-3 px-4 text-center">{getStatusBadge(earning.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No transactions found for the selected period.</p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-end">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Earnings</CardTitle>
                    <CardDescription>
                      Your earnings breakdown by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyEarnings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="py-3 px-4 font-medium">Month</th>
                              <th className="py-3 px-4 font-medium text-right">Lessons</th>
                              <th className="py-3 px-4 font-medium text-right">Earnings</th>
                              <th className="py-3 px-4 font-medium text-right">Avg. per Lesson</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyEarnings.map((month) => (
                              <tr key={`${month.year}-${month.month}`} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  {format(new Date(month.year, month.month), 'MMMM yyyy')}
                                </td>
                                <td className="py-3 px-4 text-right">{month.totalLessons}</td>
                                <td className="py-3 px-4 text-right font-medium">
                                  {formatCurrency(month.totalAmount)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {formatCurrency(month.totalLessons > 0 ? month.totalAmount / month.totalLessons : 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No monthly earnings data available.</p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-end">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherEarnings; 