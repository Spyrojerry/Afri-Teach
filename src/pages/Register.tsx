
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff, User, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Layout } from "@/components/Layout";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"student" | "teacher" | null>(null);

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Join AfriTeach</CardTitle>
              <CardDescription className="text-gray-300">
                Create your account to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-3">
                <Label className="text-white">I am a:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserType("student")}
                    className={`p-4 rounded-lg border transition-all ${
                      userType === "student"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-white/10 border-white/30 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    <User className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Student</div>
                  </button>
                  <button
                    onClick={() => setUserType("teacher")}
                    className={`p-4 rounded-lg border transition-all ${
                      userType === "teacher"
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-white/10 border-white/30 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    <BookOpen className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Teacher</div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="bg-white/20 border-white/30 text-white placeholder-gray-300 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="rounded border-white/30 bg-white/20 mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-emerald-400 hover:text-emerald-300">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                disabled={!userType}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium py-3 disabled:opacity-50"
              >
                Create Account
              </Button>

              <div className="text-center">
                <span className="text-gray-300">Already have an account? </span>
                <Link
                  to="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
