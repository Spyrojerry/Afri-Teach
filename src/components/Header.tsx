import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Function to scroll to section if on home page, otherwise navigate to home with hash
  const scrollToSection = (sectionId: string) => {
    if (isHomePage) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 fixed top-0 z-50 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
              AfriTeach
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-purple-600 transition-colors">
              Home
            </Link>

            <button 
              onClick={() => scrollToSection('features')} 
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              How It Works
            </button>
            <Link to="/teachers" className="text-gray-600 hover:text-purple-600 transition-colors">
              Find Teachers
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-600">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 w-full">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-purple-600 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <button
                className="text-left text-gray-600 hover:text-purple-600 transition-colors px-2 py-1"
                onClick={() => {
                  scrollToSection('how-it-works');
                  setIsMenuOpen(false);
                }}
              >
                How It Works
              </button>
              <button
                className="text-left text-gray-600 hover:text-purple-600 transition-colors px-2 py-1"
                onClick={() => {
                  scrollToSection('features');
                  setIsMenuOpen(false);
                }}
              >
                About
              </button>
              <Link
                to="/student/find-teachers"
                className="text-gray-600 hover:text-purple-600 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Teachers
              </Link>
              <hr className="border-gray-200" />
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-600">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
