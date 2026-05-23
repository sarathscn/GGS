import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  LayoutDashboard,
  Plus,
  Heart,
  Gamepad2,
  Shield,
  MessageCircle
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Full Name */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black">
                <span className="gradient-text">Game Gear Swap</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/marketplace">
              <Button variant="ghost" size="sm" data-testid="marketplace-link">Marketplace</Button>
            </Link>
            <Link to="/categories">
              <Button variant="ghost" size="sm" data-testid="categories-link">Categories</Button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {user ? (
              <>
                <Link to="/sell">
                  <Button className="bg-violet-600 hover:bg-violet-700" size="sm" data-testid="post-listing-btn">
                    <Plus className="w-4 h-4 mr-1" />
                    Sell
                  </Button>
                </Link>
                
                <Link to="/messages">
                  <Button variant="ghost" size="icon" data-testid="messages-link">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full" data-testid="user-menu-trigger">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email || user.phone}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer" data-testid="dashboard-link">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard?tab=wishlist" className="cursor-pointer" data-testid="wishlist-link">
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="cursor-pointer">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer" data-testid="admin-link">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500" data-testid="logout-btn">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" data-testid="login-link">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-violet-600 hover:bg-violet-700" size="sm" data-testid="signup-link">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Marketplace</Button>
              </Link>
              <Link to="/categories" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Categories</Button>
              </Link>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Blog</Button>
              </Link>
              
              {user ? (
                <>
                  <Link to="/sell" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your Ad
                    </Button>
                  </Link>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/messages" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Messages
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" className="w-full justify-start text-red-500" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">Login</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
