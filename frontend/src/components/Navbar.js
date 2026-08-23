import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import Avatar from './Avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import api from '../lib/api';
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
  Shield,
  MessageCircle,
  BookOpen,
  Tag,
  Store,
  Settings,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll only while mobile sidebar is open without losing scroll position
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Fetch unread count if authenticated
  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/conversations');
        if (Array.isArray(res.data)) {
          const totalUnread = res.data.reduce((sum, c) => sum + (c.unread_count || 0), 0);
          setUnreadMessages(totalUnread);
        }
      } catch (err) {
        // Silently catch polling errors
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  // =========================================================================
  // MOBILE / TABLET PORTAL-RENDERED SLIDE-IN SIDEBAR DRAWER
  // =========================================================================
  const renderMobileSidebar = () => {
    if (typeof document === 'undefined') return null;

    return createPortal(
      <div className="md:hidden">
        {/* 1. Backdrop Overlay (Dimmed background) */}
        <div 
          className={`fixed inset-0 z-[1000] bg-black/65 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* 2. Slide-In Sidebar Panel (100% Solid Opaque Surface) */}
        <aside 
          className={`fixed inset-y-0 right-0 z-[1010] w-[min(88vw,380px)] sm:w-[min(75vw,420px)] h-[100dvh] bg-background text-foreground border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          data-testid="mobile-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Sidebar Top Header (Solid Opaque) */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-background shrink-0">
            <Logo size="sm" asLink={true} onClick={() => setMobileMenuOpen(false)} />
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Toggle Theme"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-500" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9 rounded-xl text-foreground hover:bg-muted"
                aria-label="Close Navigation"
                data-testid="sidebar-close-btn"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Scrollable Body Content (Solid Opaque, No Page Bleed-through) */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 bg-background">
            
            {/* User Profile Card (Authenticated - 100% Opaque, No Email) */}
            {user ? (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border shadow-sm">
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="lg"
                  className="w-11 h-11 border border-violet-500/20"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                    {user.is_seller_verified && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
                        Verified ✓
                      </Badge>
                    )}
                  </div>
                  {user.username && (
                    <p className="text-xs text-violet-400 font-mono truncate mt-0.5">@{user.username}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Unauthenticated Quick Action: Login & Sign Up (Secondary Outline + Primary Violet) */
              <div className="flex gap-2 p-1">
                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full text-xs h-10 font-bold rounded-xl border-border bg-card/80 hover:bg-muted text-foreground transition-all" 
                    data-testid="mobile-login-btn"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    type="button"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-10 font-bold rounded-xl shadow-md shadow-violet-600/20 hover:shadow-violet-600/30 transition-all" 
                    data-testid="mobile-signup-btn"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Prominent Sell Button */}
            <div>
              <Link to={user ? "/post" : "/login"} className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  type="button"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 text-sm cursor-pointer transition-all" 
                  data-testid="sidebar-sell-btn"
                >
                  <Plus className="w-5 h-5" />
                  <span>+ Sell (Post Your Ad)</span>
                </Button>
              </Link>
            </div>

            {/* Main Navigation Links */}
            <div className="space-y-1 pt-1">
              <Link 
                to="/marketplace" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive('/marketplace') ? 'bg-violet-500/10 text-violet-500 font-bold' : 'text-foreground hover:bg-muted'}`}
                data-testid="mobile-marketplace-link"
              >
                <Store className="w-4 h-4 text-violet-500" />
                <span>Marketplace</span>
              </Link>

              <Link 
                to="/categories" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive('/categories') ? 'bg-violet-500/10 text-violet-500 font-bold' : 'text-foreground hover:bg-muted'}`}
                data-testid="mobile-categories-link"
              >
                <Tag className="w-4 h-4 text-cyan-500" />
                <span>Categories</span>
              </Link>

              <Link 
                to="/blog" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive('/blog') ? 'bg-violet-500/10 text-violet-500 font-bold' : 'text-foreground hover:bg-muted'}`}
                data-testid="mobile-blog-link"
              >
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Blog</span>
              </Link>

              {user && (
                <Link 
                  to="/messages" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive('/messages') ? 'bg-violet-500/10 text-violet-500 font-bold' : 'text-foreground hover:bg-muted'}`}
                  data-testid="mobile-messages-link"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-amber-500" />
                    <span>Messages</span>
                  </div>
                  {unreadMessages > 0 && (
                    <Badge className="h-5 px-2 text-[10px] bg-violet-600 text-white font-bold">
                      {unreadMessages}
                    </Badge>
                  )}
                </Link>
              )}
            </div>

            {/* Account Section (Authenticated) */}
            {user && (
              <div className="space-y-1 pt-3 border-t border-border">
                <p className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Account</p>
                
                <Link 
                  to="/dashboard?tab=settings" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  data-testid="mobile-profile-link"
                >
                  <User className="w-4 h-4 text-violet-500" />
                  <span>Profile & Settings</span>
                </Link>

                <Link 
                  to="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  data-testid="mobile-dashboard-link"
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-500" />
                  <span>Dashboard & My Listings</span>
                </Link>

                <Link 
                  to="/dashboard?tab=wishlist" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  data-testid="mobile-wishlist-link"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Wishlist</span>
                </Link>

                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors mt-2"
                    data-testid="mobile-admin-link"
                  >
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button 
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors text-left cursor-pointer mt-2"
                  data-testid="mobile-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Trust & Support Section (Always Available for both Authenticated and Logged-Out Users) */}
            <div className="space-y-1 pt-3 border-t border-border text-xs">
              <p className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Trust & Support</p>
              <Link to="/page/safety" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Marketplace Safety</span>
              </Link>
              <Link to="/page/terms" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <span>Terms & Conditions</span>
              </Link>
              <Link to="/page/refund-policy" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <span>Refund Policy</span>
              </Link>
              <Link to="/page/contact" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-violet-400 font-semibold hover:bg-muted/50 transition-colors">
                <span>Contact Support</span>
              </Link>
            </div>

            {/* Mobile Sidebar Footer Brand Watermark */}
            <div className="pt-4 pb-2 text-center border-t border-border/60">
              <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">GAME GEAR SWAP</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">Kerala's Gaming Marketplace</p>
            </div>
          </div>
        </aside>
      </div>,
      document.body
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* 1. GGS Official Logo */}
            <div className="shrink-0">
              <Logo size="md" />
            </div>

            {/* Desktop Navigation Items: Exactly Marketplace, Categories, Blog, Theme, Sell, Messages, Profile */}
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
              
              {/* 1. Marketplace */}
              <Link to="/marketplace">
                <Button 
                  type="button"
                  variant={isActive('/marketplace') ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`font-semibold text-sm transition-all ${isActive('/marketplace') ? 'text-violet-500 font-bold' : 'text-foreground/80 hover:text-foreground'}`}
                  data-testid="marketplace-link"
                >
                  <Store className="w-4 h-4 mr-1.5 text-violet-500" />
                  Marketplace
                </Button>
              </Link>

              {/* 2. Categories */}
              <Link to="/categories">
                <Button 
                  type="button"
                  variant={isActive('/categories') ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`font-semibold text-sm transition-all ${isActive('/categories') ? 'text-violet-500 font-bold' : 'text-foreground/80 hover:text-foreground'}`}
                  data-testid="categories-link"
                >
                  <Tag className="w-4 h-4 mr-1.5 text-cyan-500" />
                  Categories
                </Button>
              </Link>

              {/* 3. Blog */}
              <Link to="/blog">
                <Button 
                  type="button"
                  variant={isActive('/blog') ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`font-semibold text-sm transition-all ${isActive('/blog') ? 'text-violet-500 font-bold' : 'text-foreground/80 hover:text-foreground'}`}
                  data-testid="blog-link"
                >
                  <BookOpen className="w-4 h-4 mr-1.5 text-purple-400" />
                  Blog
                </Button>
              </Link>

              {/* 4. Theme Selection */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                data-testid="theme-toggle"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-violet-500 transition-transform rotate-0 hover:-rotate-12" />
                )}
              </Button>

              {/* If Authenticated: Sell, Messages, Profile Dropdown */}
              {user ? (
                <>
                  {/* 5. Sell */}
                  <Link to="/post">
                    <Button 
                      type="button"
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9 px-3.5 rounded-xl shadow-md shadow-violet-600/20 hover:shadow-violet-600/30 transition-all flex items-center gap-1.5" 
                      size="sm" 
                      data-testid="post-listing-btn"
                    >
                      <Plus className="w-4 h-4" />
                      Sell
                    </Button>
                  </Link>

                  {/* 6. Messages */}
                  <Link to="/messages" className="relative">
                    <Button 
                      type="button"
                      variant={isActive('/messages') ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-9 w-9 rounded-xl hover:bg-muted relative text-muted-foreground hover:text-foreground"
                      title="Messages"
                      data-testid="messages-link"
                      aria-label="Messages"
                    >
                      <MessageCircle className={`w-4 h-4 ${isActive('/messages') ? 'text-violet-500' : ''}`} />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* 7. Profile Dropdown Menu (Desktop) */}
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border bg-card/60 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all cursor-pointer group"
                        data-testid="user-menu-trigger"
                        aria-label="User Profile Menu"
                      >
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          size="sm"
                          className="w-7 h-7 border border-violet-500/20 group-hover:scale-105 transition-transform"
                        />
                        <span className="text-xs font-semibold text-foreground max-w-[100px] truncate hidden lg:inline-block">
                          {user.name.split(' ')[0]}
                        </span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 p-1.5 bg-popover/95 backdrop-blur-xl border border-border shadow-xl rounded-xl animate-in fade-in-50 zoom-in-95"
                    >
                      {/* User Identity Header (No Email) */}
                      <div className="px-3 py-2 rounded-lg bg-muted/40 mb-1 border border-border/40">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                          {user.is_seller_verified && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
                              Verified ✓
                            </Badge>
                          )}
                        </div>
                        {user.username && (
                          <p className="text-[11px] text-violet-400 font-mono truncate mt-0.5">
                            @{user.username}
                          </p>
                        )}
                      </div>

                      <DropdownMenuSeparator className="my-1" />

                      {/* Profile */}
                      <DropdownMenuItem asChild>
                        <Link 
                          to="/dashboard?tab=settings" 
                          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                          data-testid="dropdown-profile-link"
                        >
                          <User className="w-4 h-4 text-violet-500" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Dashboard */}
                      <DropdownMenuItem asChild>
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                          data-testid="dropdown-dashboard-link"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-500" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Wishlist */}
                      <DropdownMenuItem asChild>
                        <Link 
                          to="/dashboard?tab=wishlist" 
                          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                          data-testid="dropdown-wishlist-link"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>Wishlist</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Messages */}
                      <DropdownMenuItem asChild>
                        <Link 
                          to="/messages" 
                          className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                          data-testid="dropdown-messages-link"
                        >
                          <div className="flex items-center gap-2.5">
                            <MessageCircle className="w-4 h-4 text-amber-500" />
                            <span>Messages</span>
                          </div>
                          {unreadMessages > 0 && (
                            <Badge className="h-4 px-1 text-[9px] bg-violet-600 text-white font-bold">
                              {unreadMessages}
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>

                      {/* Settings */}
                      <DropdownMenuItem asChild>
                        <Link 
                          to="/dashboard?tab=settings" 
                          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
                          data-testid="dropdown-settings-link"
                        >
                          <Settings className="w-4 h-4 text-purple-400" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Admin Panel (Strictly Only When User is Actually Admin) */}
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem asChild>
                            <Link 
                              to="/admin" 
                              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold rounded-lg cursor-pointer bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                              data-testid="dropdown-admin-link"
                            >
                              <Shield className="w-4 h-4 text-amber-500" />
                              <span>Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator className="my-1" />

                      {/* Logout */}
                      <DropdownMenuItem 
                        onClick={handleLogout} 
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-red-500 dark:text-red-400 rounded-lg cursor-pointer hover:bg-red-500/10 hover:text-red-600 transition-colors"
                        data-testid="dropdown-logout-btn"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                /* If Unauthenticated: Login and Sign Up (Desktop) */
                <div className="flex items-center gap-2 ml-1">
                  <Link to="/login">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      className="font-bold text-xs h-9 px-3.5 rounded-xl border-border bg-card/80 hover:bg-muted text-foreground transition-all" 
                      data-testid="login-link"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button 
                      type="button"
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-violet-600/20 hover:shadow-violet-600/30 transition-all" 
                      size="sm" 
                      data-testid="signup-link"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Right Controls: Theme Toggle & Hamburger Drawer Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl text-muted-foreground"
                aria-label="Toggle Theme"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-500" />}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="h-9 w-9 rounded-xl text-foreground"
                data-testid="mobile-menu-toggle"
                aria-label="Open Navigation Menu"
              >
                {user ? (
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="xs"
                    className="w-6 h-6 border border-violet-500/30"
                  />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Render Mobile Sidebar in React Portal at document.body level */}
      {renderMobileSidebar()}
    </>
  );
}
