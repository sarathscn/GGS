import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { generateInvoicePdf } from '../lib/invoicePdf';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { getDistricts, getTaluks, getAreas, formatLocation } from '../lib/keralaLocations';
import { 
  validateFullName, 
  sanitizeFullNameInput, 
  FULL_NAME_ERROR_MESSAGE,
  validateUsername, 
  sanitizeUsernameInput, 
  USERNAME_ERROR_MESSAGE 
} from '../lib/userValidation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import ProductCard from '../components/ProductCard';
import Avatar from '../components/Avatar';
import ProfilePictureModal from '../components/ProfilePictureModal';
import PaginationControls from '../components/ui/PaginationControls';
import { toast } from 'sonner';
import {
  User,
  Package,
  Heart,
  CreditCard,
  Settings,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Camera,
  Phone,
  Shield,
  ShieldCheck,
  Upload,
  X,
  XCircle,
  Mail,
  Lock,
  MapPin,
  Sparkles,
  RefreshCw,
  Check,
  AlertTriangle,
  Receipt,
  Flag,
  Clock,
  HelpCircle,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Tag
} from 'lucide-react';

export default function Dashboard() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();

  const resolveTab = (tab) => {
    if (!tab) return 'listings';
    if (tab === 'settings' || tab === 'profile') return 'profile';
    if (tab === 'reports' || tab === 'my-reports') return 'reports';
    return tab;
  };

  const [activeTab, setActiveTab] = useState(() => resolveTab(searchParams.get('tab')));
  const [myListings, setMyListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [payments, setPayments] = useState([]);
  const [kycStatusData, setKycStatusData] = useState(null);
  const [allowanceData, setAllowanceData] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [requestsSubTab, setRequestsSubTab] = useState('all'); // 'all', 'tickets', 'reports', 'verification'
  const [loading, setLoading] = useState(true);
  const [markingSoldId, setMarkingSoldId] = useState(null);
  const [listingSubTab, setListingSubTab] = useState('active'); // 'active', 'sold', 'all'
  const fileInputRef = useRef(null);

  // Synchronize tab with searchParams on route changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(resolveTab(tab));
    }
  }, [searchParams]);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [district, setDistrict] = useState(user?.location_district || '');
  const [taluk, setTaluk] = useState(user?.location_taluk || '');
  const [area, setArea] = useState(user?.location_area || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Derived location data
  const districts = getDistricts();
  const taluks = district ? getTaluks(district) : [];
  const areas = district && taluk ? getAreas(district, taluk) : [];

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email change OTP Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Phone OTP Modal
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Google Disconnect Modal
  const [showDisconnectGoogleModal, setShowDisconnectGoogleModal] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  // Google Connect Modal
  const [showConnectGoogleModal, setShowConnectGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [connectGoogleLoading, setConnectGoogleLoading] = useState(false);

  // KYC Verification Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [kycDocType, setKycDocType] = useState('');
  const [kycDocNumber, setKycDocNumber] = useState('');
  const [kycDocImage, setKycDocImage] = useState(null);
  const [kycDocFile, setKycDocFile] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Avatar modal state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setDistrict(user.location_district || '');
      setTaluk(user.location_taluk || '');
      setArea(user.location_area || '');
    }
  }, [user]);

  // Cooldown countdown timers
  useEffect(() => {
    let timer;
    if (emailCooldown > 0) {
      timer = setInterval(() => setEmailCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emailCooldown]);

  useEffect(() => {
    let timer;
    if (phoneCooldown > 0) {
      timer = setInterval(() => setPhoneCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  const fetchData = async () => {
    try {
      const [listingsRes, wishlistRes, paymentsRes, kycRes, allowanceRes, reportsRes, ticketsRes] = await Promise.allSettled([
        api.get('/my-listings'),
        api.get('/wishlist'),
        api.get('/payments/my'),
        api.get('/kyc/status'),
        api.get('/listings/free-posts-allowance'),
        api.get('/reports/my'),
        api.get('/support/my')
      ]);
      if (listingsRes.status === 'fulfilled') setMyListings(listingsRes.value.data || []);
      if (wishlistRes.status === 'fulfilled') setWishlist(wishlistRes.value.data || []);
      if (paymentsRes.status === 'fulfilled') setPayments(paymentsRes.value.data || []);
      if (kycRes.status === 'fulfilled') setKycStatusData(kycRes.value.data);
      if (allowanceRes.status === 'fulfilled') setAllowanceData(allowanceRes.value.data);
      if (reportsRes.status === 'fulfilled') setMyReports(reportsRes.value.data || []);
      if (ticketsRes.status === 'fulfilled') setMyTickets(ticketsRes.value.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/invoice`);
      const invoice = response.data;
      generateInvoicePdf(invoice);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to download invoice');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const nameCheck = validateFullName(name);
    if (!nameCheck.isValid) {
      toast.error(nameCheck.error);
      return;
    }

    if (username && username.trim()) {
      const usernameCheck = validateUsername(username);
      if (!usernameCheck.isValid) {
        toast.error(usernameCheck.error);
        return;
      }
    }

    setProfileLoading(true);
    try {
      const fullLocation = formatLocation(district, taluk, area);
      await updateProfile({ 
        name: nameCheck.cleanName,
        username: username ? username.trim() : '',
        location: fullLocation,
        location_district: district || null,
        location_taluk: taluk || null,
        location_area: area || null
      });
      if (refreshUser) refreshUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Email Change Handlers
  const handleSendEmailOtp = async () => {
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('This is already your current email address');
      return;
    }

    setEmailLoading(true);
    try {
      const res = await api.post('/profile/email-otp/send', { new_email: newEmail.trim() });
      setEmailOtpSent(true);
      setEmailCooldown(60);
      toast.success(res.data?.message || 'Verification code sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setEmailLoading(true);
    try {
      await api.post('/profile/update-email', {
        new_email: newEmail.trim(),
        otp: emailOtp.trim()
      });
      if (refreshUser) refreshUser();
      setShowEmailModal(false);
      setEmailOtpSent(false);
      setEmailOtp('');
      setNewEmail('');
      toast.success('Email address verified and updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setEmailLoading(false);
    }
  };

  // Phone Change Handlers
  const handleSendPhoneOtp = async () => {
    const cleanNumber = newPhone.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setPhoneLoading(true);
    try {
      const res = await api.post('/profile/phone-otp/send', { phone: `+91${cleanNumber}` });
      setPhoneOtpSent(true);
      setPhoneCooldown(60);
      toast.success(res.data?.message || 'Verification code sent to your phone');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setPhoneLoading(true);
    try {
      const cleanNumber = newPhone.replace(/\D/g, '');
      await api.post('/profile/update-phone', {
        phone: `+91${cleanNumber}`,
        otp: phoneOtp.trim()
      });
      if (refreshUser) refreshUser();
      setShowPhoneModal(false);
      setPhoneOtpSent(false);
      setPhoneOtp('');
      setNewPhone('');
      toast.success('Phone number verified and updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Google Connect & Disconnect Handlers
  const handleConnectGoogle = async () => {
    if (!googleEmailInput || !/^\S+@\S+\.\S+$/.test(googleEmailInput.trim())) {
      toast.error('Please enter a valid Google email address');
      return;
    }

    setConnectGoogleLoading(true);
    try {
      await api.post('/profile/connect-google', {
        email: googleEmailInput.trim(),
        name: user?.name,
        avatar: user?.avatar
      });
      if (refreshUser) refreshUser();
      setShowConnectGoogleModal(false);
      setGoogleEmailInput('');
      toast.success('Google account connected successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to connect Google account');
    } finally {
      setConnectGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setDisconnectLoading(true);
    try {
      await api.post('/profile/disconnect-google');
      if (refreshUser) refreshUser();
      setShowDisconnectGoogleModal(false);
      toast.success('Google account disconnected successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to disconnect Google account');
    } finally {
      setDisconnectLoading(false);
    }
  };

  // Password Change Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (user?.has_password && !currentPassword) {
      toast.error('Current password is required');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/profile/change-password', {
        current_password: user?.has_password ? currentPassword : undefined,
        new_password: newPassword
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (refreshUser) refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Avatar Change Handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const avatarUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`;
      await api.put('/profile', { avatar: avatarUrl });
      
      if (refreshUser) refreshUser();
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setAvatarLoading(false);
    }
  };

  // KYC Handlers
  const handleKycImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setKycDocImage(reader.result);
    };
    reader.readAsDataURL(file);
    setKycDocFile(file);
  };

  const handleKycSubmit = async () => {
    if (!kycDocType || !kycDocNumber || !kycDocFile) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setVerifyLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', kycDocFile);
      formData.append('type', 'kyc');
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const docImageUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`;
      
      await api.post('/kyc/submit', {
        document_type: kycDocType,
        document_number: kycDocNumber,
        document_image_url: docImageUrl
      });
      
      if (refreshUser) refreshUser();
      setShowVerifyModal(false);
      setKycDocType('');
      setKycDocNumber('');
      setKycDocImage(null);
      setKycDocFile(null);
      toast.success('KYC documents submitted! Our moderation team will review them shortly.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit KYC');
    } finally {
      setVerifyLoading(false);
    }
  };

// Compact Dashboard Listing Card Component
function DashboardListingCard({ 
  listing, 
  user, 
  markingSoldId, 
  onMarkSold, 
  onDelete, 
  onRequestExtension, 
  onRequestFreeEdit 
}) {
  // Normalize raw images
  const images = useMemo(() => {
    if (!listing) return ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=600&auto=format&fit=crop&q=80'];
    let list = [];
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      list = listing.images;
    } else if (typeof listing.images === 'string') {
      try {
        const parsed = JSON.parse(listing.images);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {
        list = [listing.images];
      }
    } else if (listing.image_url) {
      list = [listing.image_url];
    } else if (listing.image) {
      list = [listing.image];
    }
    const clean = list.filter((img) => typeof img === 'string' && img.trim().length > 0);
    return clean.length > 0
      ? clean
      : ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=600&auto=format&fit=crop&q=80'];
  }, [listing]);

  const hasMultipleImages = images.length > 1;
  const extendedSlides = useMemo(() => {
    if (!hasMultipleImages) return images;
    return [images[images.length - 1], ...images, images[0]];
  }, [images, hasMultipleImages]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(hasMultipleImages ? 1 : 0);
  const [withTransition, setWithTransition] = useState(true);
  const isTransitioningRef = useRef(false);

  const activeImageIdx = useMemo(() => {
    if (!hasMultipleImages) return 0;
    if (currentSlideIndex === 0) return images.length - 1;
    if (currentSlideIndex === extendedSlides.length - 1) return 0;
    return currentSlideIndex - 1;
  }, [currentSlideIndex, extendedSlides.length, images.length, hasMultipleImages]);

  useEffect(() => {
    setWithTransition(false);
    setCurrentSlideIndex(hasMultipleImages ? 1 : 0);
    isTransitioningRef.current = false;
    const timer = setTimeout(() => setWithTransition(true), 50);
    return () => clearTimeout(timer);
  }, [listing?.id, hasMultipleImages]);

  const handleTransitionEnd = useCallback(() => {
    isTransitioningRef.current = false;
    if (!hasMultipleImages) return;
    if (currentSlideIndex === extendedSlides.length - 1) {
      setWithTransition(false);
      setCurrentSlideIndex(1);
    } else if (currentSlideIndex === 0) {
      setWithTransition(false);
      setCurrentSlideIndex(images.length);
    }
  }, [currentSlideIndex, extendedSlides.length, hasMultipleImages, images.length]);

  useEffect(() => {
    if (!withTransition) {
      const raf = requestAnimationFrame(() => setWithTransition(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [withTransition]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (isTransitioningRef.current || !hasMultipleImages) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentSlideIndex(prev => prev - 1);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (isTransitioningRef.current || !hasMultipleImages) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentSlideIndex(prev => prev + 1);
  };

  const conditionColors = {
    BrandNew: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
    LikeNew: 'border-cyan-500/30 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10',
    Good: 'border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-500/10',
    Fair: 'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10',
    Refurbished: 'border-purple-500/30 text-purple-700 dark:text-purple-400 bg-purple-500/10',
  };

  const isSold = listing.status === 'sold' || listing.status === 'completed';
  const isDeleted = listing.status === 'deleted' || listing.is_deleted;
  const isExpired = listing.status === 'expired' || listing.is_expired;
  const isActive = listing.status === 'active' || (!isSold && !isDeleted && !isExpired && listing.status !== 'rejected');
  const canEdit = user?.role === 'admin' || listing.free_edit_allowed || listing.free_edit_available;
  const listingUrl = `/listing/${listing.slug || listing.id}`;

  const formatPrice = (price) => {
    if (listing?.price_type === 'free') return 'Free';
    if (listing?.price_type === 'negotiable' && (!price || Number(price) === 0)) return 'Negotiable';
    if (listing?.price_type === 'exchange' && (!price || Number(price) === 0)) return 'Exchange';
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div 
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all flex flex-col justify-start h-auto min-w-0 max-w-full"
      data-testid={`dashboard-listing-card-${listing.id}`}
    >
      {/* Photo Gallery Area with Status Badge */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950/70 select-none group/carousel">
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${currentSlideIndex * 100}%)`,
            transition: withTransition ? 'transform 400ms ease-in-out' : 'none',
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((imgSrc, idx) => (
            <div
              key={idx}
              className="w-full min-w-full h-full shrink-0 flex items-center justify-center bg-zinc-950/80"
              style={{ width: '100%', minWidth: '100%', flexShrink: 0 }}
            >
              <img
                src={imgSrc}
                alt={`${listing.title || 'Product'} photo`}
                loading={idx <= 1 ? 'eager' : 'lazy'}
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* Top-Left: Prominent Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1">
          {isDeleted ? (
            <Badge className="bg-red-500/90 text-white font-bold text-xs px-2.5 py-0.5 shadow-md backdrop-blur-sm">
              ● Deleted
            </Badge>
          ) : isExpired ? (
            <Badge className="bg-amber-500/90 text-white font-bold text-xs px-2.5 py-0.5 shadow-md backdrop-blur-sm">
              ● Expired
            </Badge>
          ) : isSold ? (
            <Badge className="bg-zinc-900/90 hover:bg-zinc-900 text-zinc-300 border border-zinc-700 font-bold text-xs px-2.5 py-0.5 shadow-md backdrop-blur-sm">
              ● Sold
            </Badge>
          ) : isActive ? (
            <Badge className="bg-emerald-600/95 hover:bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5 shadow-md flex items-center gap-1.5 backdrop-blur-sm border-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Active
            </Badge>
          ) : (
            <Badge className="bg-amber-500/95 hover:bg-amber-500 text-white font-bold text-xs px-2.5 py-0.5 shadow-md backdrop-blur-sm border-0">
              {listing.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Top-Right: Featured Badge (if applicable) */}
        {listing.featured && (
          <div className="absolute top-2.5 right-2.5 z-20">
            <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 shadow-md">
              Featured
            </Badge>
          </div>
        )}

        {/* Bottom-Left: Views Count */}
        {listing.views_count > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full z-10 shadow-sm">
            <Eye className="w-3 h-3 text-violet-300" />
            <span>{listing.views_count} views</span>
          </div>
        )}

        {/* Multi-image Chevrons & Dots */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous image"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity flex items-center justify-center z-10 shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next image"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity flex items-center justify-center z-10 shadow-sm"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 inset-x-0 flex justify-center items-center gap-1 z-10">
              {images.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dotIdx === activeImageIdx ? 'w-3.5 bg-white shadow-sm' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Content Section */}
      <div className="p-3 sm:p-3.5 flex flex-col gap-2 min-w-0">
        {/* Category + Condition Row */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md truncate max-w-[65%]" title={listing.category_name}>
            <Tag className="w-3 h-3 shrink-0 text-cyan-400" />
            <span className="truncate">{listing.category_name || 'Gaming Gear'}</span>
          </div>
          {listing.condition && (
            <Badge variant="outline" className={`shrink-0 text-[10px] py-0 px-1.5 font-semibold ${conditionColors[listing.condition] || 'border-border text-muted-foreground'}`}>
              {listing.condition}
            </Badge>
          )}
        </div>

        {/* Title */}
        <Link to={listingUrl} className="block group-hover:text-violet-400 text-foreground transition-colors min-w-0" title={listing.title}>
          <h3 className="font-bold text-xs sm:text-sm line-clamp-2 leading-snug break-words overflow-hidden text-foreground">
            {listing.title}
          </h3>
        </Link>

        {/* Price & Location Row */}
        <div className="flex items-center justify-between gap-2 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0 max-w-[65%]">
            <span
              className={`font-mono text-base sm:text-lg font-black tracking-tight leading-none ${
                listing.price_type === 'free' || (listing.price_type === 'negotiable' && (!listing.price || Number(listing.price) === 0))
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-violet-700 dark:text-violet-400'
              }`}
              title={formatPrice(listing.price)}
            >
              {formatPrice(listing.price)}
            </span>
            {listing.price_type === 'exchange' && Number(listing.price) > 0 && (
              <span className="text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 shrink-0 leading-tight">
                Exchange
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px] sm:text-[11px] text-muted-foreground min-w-0 shrink truncate max-w-[40%]" title={listing.location}>
            <MapPin className="w-3 h-3 shrink-0 text-violet-400" />
            <span className="truncate">{listing.location || 'Kerala'}</span>
          </div>
        </div>

        {/* 90-Day Validity & Expiry Information */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
          <span>Posted: {formatDate(listing.published_at || listing.created_at)}</span>
          {listing.expires_at ? (
            <span className={isExpired ? 'text-red-400 font-medium' : (listing.days_remaining !== undefined && listing.days_remaining <= 14) ? 'text-amber-400 font-medium' : 'text-zinc-400 font-medium'}>
              {isExpired ? `Expired on ${formatDate(listing.expires_at)}` : `Expires: ${formatDate(listing.expires_at)} (${listing.days_remaining !== undefined ? `${listing.days_remaining}d left` : '90d'})`}
            </span>
          ) : (
            <span className="text-zinc-500">90-Day Validity</span>
          )}
        </div>

        {/* Edit Allowance & Expiry Extension Row */}
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-1 border-t border-border/40 text-muted-foreground">
          {/* Extension Status / Action */}
          {listing.extension_count >= 1 ? (
            <span className="text-purple-400 font-medium text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
              ✓ 30d Extended
            </span>
          ) : (listing.extension_eligible || ((listing.days_remaining <= 30 || isExpired) && (listing.extension_count || 0) < 1 && !isDeleted)) ? (
            <button
              type="button"
              onClick={() => onRequestExtension && onRequestExtension(listing)}
              className="text-violet-400 hover:text-violet-300 font-semibold text-[10px] bg-violet-500/10 hover:bg-violet-500/20 px-1.5 py-0.5 rounded border border-violet-500/30 transition-colors"
              title="Request 30-Day Validity Extension via Support"
            >
              + 30d Extension
            </button>
          ) : null}

          {/* Free Edit Allowance / Action */}
          {user?.role === 'admin' ? (
            <span className="text-violet-400 font-medium">Admin Edit</span>
          ) : listing.free_edit_allowed ? (
            <span className="text-emerald-400 font-medium text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              ● 1 Free Edit Available
            </span>
          ) : listing.free_edit_available ? (
            <span className="text-emerald-400 font-medium text-[10px]">
              ● Free Edit ({listing.free_edit_hours_left || 24}h)
            </span>
          ) : listing.free_edit_history && listing.free_edit_history.length > 0 ? (
            <span className="text-zinc-500 text-[10px]">Edit Used</span>
          ) : !isSold && !isDeleted ? (
            <button
              type="button"
              onClick={() => onRequestFreeEdit && onRequestFreeEdit(listing)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30 transition-colors"
              title="Request 1-time free edit allowance via Support Ticket"
            >
              Request Free Edit
            </button>
          ) : (
            <span className="text-zinc-500 text-[10px]">Standard Edit</span>
          )}
        </div>
      </div>

      {/* Unified Management Action Row (Bottom of Card) */}
      <div className="p-2.5 bg-muted/20 border-t border-border/80 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* 1. Mark Sold Action */}
        {!isSold ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMarkSold(listing.id)}
            disabled={markingSoldId === listing.id}
            className="flex-1 h-8 px-2 text-xs font-semibold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
            title="Mark this listing as Sold"
            data-testid={`mark-sold-${listing.id}`}
          >
            {markingSoldId === listing.id ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-emerald-400" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
            )}
            <span>Mark Sold</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            className="flex-1 h-8 px-2 text-xs font-semibold bg-muted/40 text-muted-foreground border-border/50 cursor-not-allowed"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <span>Sold</span>
          </Button>
        )}

        {/* 2. Edit Action */}
        {!isSold && canEdit ? (
          <Link to={`/edit/${listing.id}`} className="flex-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full h-8 px-2 text-xs font-semibold border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 transition-colors"
              title={user?.role === 'admin' ? 'Admin Edit' : 'Edit Listing (1 Free Edit Available)'}
              data-testid={`edit-listing-${listing.id}`}
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              <span>Edit</span>
            </Button>
          </Link>
        ) : !isSold ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onRequestFreeEdit && onRequestFreeEdit(listing)}
            className="flex-1 h-8 px-2 text-xs font-semibold border-border/50 text-muted-foreground hover:text-foreground"
            title="Request admin allowance for free edit"
            data-testid={`edit-listing-${listing.id}`}
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            <span>Edit</span>
          </Button>
        ) : (
          <Link to={listingUrl} className="flex-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>View</span>
            </Button>
          </Link>
        )}

        {/* 3. Delete Action */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onDelete(listing)}
          className="flex-1 h-8 px-2 text-xs font-semibold border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          title="Delete listing"
          data-testid={`delete-listing-${listing.id}`}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  );
}

// Main Dashboard Component
  const [listingToDelete, setListingToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Pagination states (20 items per page)
  const [listingPage, setListingPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);

  // Extension request modal state
  const [extensionListing, setExtensionListing] = useState(null);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionLoading, setExtensionLoading] = useState(false);

  // Free edit request modal state
  const [freeEditListing, setFreeEditListing] = useState(null);
  const [isFreeEditModalOpen, setIsFreeEditModalOpen] = useState(false);
  const [freeEditReason, setFreeEditReason] = useState('');
  const [freeEditLoading, setFreeEditLoading] = useState(false);

  const handleOpenExtensionModal = (listing) => {
    setExtensionListing(listing);
    setExtensionReason('');
    setIsExtensionModalOpen(true);
  };

  const handleConfirmExtensionRequest = async () => {
    if (!extensionListing) return;
    setExtensionLoading(true);
    try {
      await api.post('/support', {
        category: 'listing_support',
        request_type: 'expiry_extension',
        listing_id: extensionListing.id,
        listing_title: extensionListing.title,
        current_expires_at: extensionListing.expires_at,
        subject: `30-Day Extension Request: ${extensionListing.title}`,
        description: extensionReason.trim() || 'Requesting 30-day listing validity extension'
      });
      toast.success('30-Day Extension Request submitted! Admin will review shortly.');
      setIsExtensionModalOpen(false);
      setExtensionListing(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit extension request');
    } finally {
      setExtensionLoading(false);
    }
  };

  const handleOpenFreeEditModal = (listing) => {
    setFreeEditListing(listing);
    setFreeEditReason('');
    setIsFreeEditModalOpen(true);
  };

  const handleConfirmFreeEditRequest = async () => {
    if (!freeEditListing) return;
    setFreeEditLoading(true);
    try {
      await api.post('/support', {
        category: 'listing_support',
        request_type: 'free_edit',
        listing_id: freeEditListing.id,
        listing_title: freeEditListing.title,
        subject: `One-Time Free Edit Request: ${freeEditListing.title}`,
        description: freeEditReason.trim() || 'Requesting admin allowance for 1 free edit'
      });
      toast.success('Free Edit Request submitted! Admin will review shortly.');
      setIsFreeEditModalOpen(false);
      setFreeEditListing(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit free edit request');
    } finally {
      setFreeEditLoading(false);
    }
  };

  const handleOpenDeleteModal = (listing) => {
    setListingToDelete(listing);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;
    try {
      await api.delete(`/listings/${listingToDelete.id}`);
      setMyListings(prev => prev.filter(l => l.id !== listingToDelete.id));
      toast.success('Listing deleted successfully');
      setIsDeleteModalOpen(false);
      setListingToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete listing');
    }
  };

  const handleDeleteListing = (listingId) => {
    const target = myListings.find(l => l.id === listingId);
    if (target) {
      handleOpenDeleteModal(target);
    } else {
      handleOpenDeleteModal({ id: listingId, title: 'this listing' });
    }
  };

  const handleMarkAsSold = async (listingId) => {
    if (markingSoldId) return;
    setMarkingSoldId(listingId);
    try {
      const res = await api.post(`/listings/${listingId}/mark-sold`);
      const updatedListing = res.data?.listing || res.data;
      setMyListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, ...(updatedListing || {}), status: 'sold', featured: false } : l
      ));
      toast.success('Listing marked as sold!');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to update listing';
      toast.error(errorMsg);
    } finally {
      setMarkingSoldId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-140px)] pb-24" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black gradient-text">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your gaming gear listings, wishlist, payments, and account</p>
        </div>
        <Link to="/post">
          <Button className="bg-violet-600 hover:bg-violet-700 font-bold" data-testid="dashboard-post-btn">
            <Plus className="w-4 h-4 mr-2" />
            Post New Ad
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full max-w-full">
          <TabsList className="bg-card border border-border p-1.5 flex flex-wrap lg:inline-flex w-full lg:w-auto gap-1.5 sm:gap-2 rounded-xl shadow-sm h-auto justify-start items-center" data-testid="dashboard-action-tabs">
            <TabsTrigger value="listings" className="gap-2 shrink-0 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-500" data-testid="tab-listings">
              <Package className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <span>My Listings ({myListings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2 shrink-0 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-500" data-testid="tab-wishlist">
              <Heart className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <span>Wishlist ({wishlist.length})</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 shrink-0 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-500" data-testid="tab-payments">
              <CreditCard className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 shrink-0 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-500" data-testid="tab-reports">
              <Flag className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <span>Activity & Reports ({myReports.length + myTickets.length + (kycStatusData?.status && kycStatusData.status !== 'not_applied' ? 1 : 0)})</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 shrink-0 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-500" data-testid="tab-profile">
              <Settings className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <span>Profile Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Listings Tab */}
        <TabsContent value="listings">
          {/* Verified Seller Monthly Free Posts Banner */}
          {allowanceData?.is_verified && (
            <div className="mb-6 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-card dark:from-violet-950/40 dark:via-purple-900/20 dark:to-card border border-violet-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-testid="verified-allowance-banner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">Verified Seller Allowance</h4>
                    <Badge className="bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold">
                      3 Free / Month
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monthly usage: <strong className="text-foreground font-semibold">{allowanceData.used} / {allowanceData.limit} used</strong> ({allowanceData.remaining} remaining this month)
                  </p>
                </div>
              </div>
              <Link to="/post">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 font-bold shrink-0 text-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Post Ad ({allowanceData.remaining > 0 ? `${allowanceData.remaining} free left` : 'Standard fee'})
                </Button>
              </Link>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : myListings.length > 0 ? (
            <div className="space-y-6">
              {/* 90-Day Validity & Expiry Platform Policy Notice */}
              <div className="p-3.5 bg-violet-500/10 dark:bg-violet-950/30 border border-violet-500/30 dark:border-violet-500/25 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-violet-950 dark:text-white">Listing Validity & Policy: </span>
                  All ads remain active for a standard 90-day validity period. You can request a single 30-day extension or a free edit allowance via support ticket. In accordance with platform policy, strictly no refunds are issued after the 90-day validity period expires.
                </div>
              </div>

              {/* Sub-tabs for Active vs Sold Listings */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={listingSubTab === 'active' ? 'default' : 'outline'}
                    onClick={() => { setListingSubTab('active'); setListingPage(1); }}
                    className={listingSubTab === 'active' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                    data-testid="subtab-active-listings"
                  >
                    Active Listings ({myListings.filter(l => l.status !== 'sold' && l.status !== 'completed' && l.status !== 'deleted').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={listingSubTab === 'sold' ? 'default' : 'outline'}
                    onClick={() => { setListingSubTab('sold'); setListingPage(1); }}
                    className={listingSubTab === 'sold' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                    data-testid="subtab-sold-listings"
                  >
                    Sold / Sales History ({myListings.filter(l => l.status === 'sold' || l.status === 'completed').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={listingSubTab === 'all' ? 'default' : 'outline'}
                    onClick={() => { setListingSubTab('all'); setListingPage(1); }}
                    className={listingSubTab === 'all' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                    data-testid="subtab-all-listings"
                  >
                    All ({myListings.length})
                  </Button>
                </div>
              </div>

              {/* Listings Grid */}
              {(() => {
                const filtered = myListings.filter(l => {
                  if (listingSubTab === 'active') return l.status !== 'sold' && l.status !== 'completed' && l.status !== 'deleted';
                  if (listingSubTab === 'sold') return l.status === 'sold' || l.status === 'completed';
                  return true;
                });
                const totalPages = Math.ceil(filtered.length / 20) || 1;
                const paginated = filtered.slice((listingPage - 1) * 20, listingPage * 20);

                return filtered.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {paginated.map((listing) => (
                        <DashboardListingCard
                          key={listing.id}
                          listing={listing}
                          user={user}
                          markingSoldId={markingSoldId}
                          onMarkSold={handleMarkAsSold}
                          onDelete={handleOpenDeleteModal}
                          onRequestExtension={handleOpenExtensionModal}
                          onRequestFreeEdit={handleOpenFreeEditModal}
                        />
                      ))}
                    </div>
                    <PaginationControls
                      currentPage={listingPage}
                      totalPages={totalPages}
                      totalRecords={filtered.length}
                      pageSize={20}
                      onPageChange={setListingPage}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium">
                      {listingSubTab === 'sold' ? 'No sold listings yet.' : 'No active listings found in this tab.'}
                    </p>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">Start selling your gaming gear to gamers across Kerala</p>
              <Link to="/post">
                <Button className="bg-violet-600 hover:bg-violet-700 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Ad
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : wishlist.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlist.slice((wishlistPage - 1) * 20, wishlistPage * 20).map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
              <PaginationControls
                currentPage={wishlistPage}
                totalPages={Math.ceil(wishlist.length / 20)}
                totalRecords={wishlist.length}
                pageSize={20}
                onPageChange={setWishlistPage}
              />
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-4">Save items you're interested in by clicking the heart icon on listings</p>
              <Link to="/marketplace">
                <Button className="bg-violet-600 hover:bg-violet-700 font-bold">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* Payments & Invoices Tab */}
        <TabsContent value="payments">
          {/* No Refund Policy Notice */}
          <div className="p-3.5 bg-violet-500/10 dark:bg-violet-950/30 border border-violet-500/30 dark:border-violet-500/25 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5 mb-6">
            <AlertCircle className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-violet-950 dark:text-white">Payment & Refund Policy: </span>
              All listing service fees cover the initial 90-day advertising and platform hosting service. GST tax invoices are generated automatically. In line with our platform terms, fees are non-refundable after the 90-day validity period has lapsed.
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold">Invoice / Txn ID</th>
                        <th className="text-left py-3 px-4 font-semibold">Description</th>
                        <th className="text-left py-3 px-4 font-semibold">Amount (INR)</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-right py-3 px-4 font-semibold">Receipt / Tax Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.slice((paymentsPage - 1) * 20, paymentsPage * 20).map((payment) => (
                        <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-mono font-bold text-xs text-violet-400">
                              {payment.invoice_number || `GGS-INV-${payment.id?.slice(0, 8).toUpperCase()}`}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {payment.transaction_id || payment.id?.slice(0, 12)}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-xs text-foreground">{payment.listing_title || payment.ad_title || 'Listing Service Fee'}</p>
                            <p className="text-[11px] text-muted-foreground">{payment.payment_method ? payment.payment_method.toUpperCase() : 'Online UPI'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-emerald-500">₹{Number(payment.amount).toFixed(2)}</span>
                            <span className="block text-[10px] text-muted-foreground">(Base ₹{payment.base_amount || '8.47'} + 18% GST)</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={
                              payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }>
                              {payment.status?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                            {formatDate(payment.created_at)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {payment.status === 'completed' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold"
                                onClick={() => downloadInvoice(payment.id)}
                                data-testid={`download-invoice-${payment.id}`}
                              >
                                <Receipt className="w-3.5 h-3.5 mr-1 text-violet-500" />
                                Download Invoice
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">N/A (Pending)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <PaginationControls
                currentPage={paymentsPage}
                totalPages={Math.ceil(payments.length / 20)}
                totalRecords={payments.length}
                pageSize={20}
                onPageChange={setPaymentsPage}
              />
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">No payment history</h3>
              <p className="text-muted-foreground text-sm">Payments and tax invoices will appear here after you post listings</p>
            </div>
          )}
        </TabsContent>

        {/* My Requests & Reports (Activity & Requests Hub) */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Flag className="w-5 h-5 text-violet-500" />
                <span>Activity & Requests Hub</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Track status, administrative decisions, and official remarks for all your submitted inquiries, tickets, verification, and ad reports.
              </p>
            </div>

            <Link to="/contact">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 font-bold text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Submit Support Ticket
              </Button>
            </Link>
          </div>

          {/* Sub-navigation Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={requestsSubTab === 'all' ? 'default' : 'outline'}
              onClick={() => setRequestsSubTab('all')}
              className={requestsSubTab === 'all' ? 'bg-violet-600 hover:bg-violet-700 font-bold text-xs' : 'text-xs'}
              data-testid="subtab-all-requests"
            >
              All Requests ({myTickets.length + myReports.length + (kycStatusData?.status && kycStatusData.status !== 'not_applied' ? 1 : 0)})
            </Button>
            <Button
              size="sm"
              variant={requestsSubTab === 'tickets' ? 'default' : 'outline'}
              onClick={() => setRequestsSubTab('tickets')}
              className={requestsSubTab === 'tickets' ? 'bg-violet-600 hover:bg-violet-700 font-bold text-xs' : 'text-xs'}
              data-testid="subtab-tickets-requests"
            >
              Support Tickets ({myTickets.length})
            </Button>
            <Button
              size="sm"
              variant={requestsSubTab === 'reports' ? 'default' : 'outline'}
              onClick={() => setRequestsSubTab('reports')}
              className={requestsSubTab === 'reports' ? 'bg-violet-600 hover:bg-violet-700 font-bold text-xs' : 'text-xs'}
              data-testid="subtab-reports-requests"
            >
              Ad Reports ({myReports.length})
            </Button>
            <Button
              size="sm"
              variant={requestsSubTab === 'verification' ? 'default' : 'outline'}
              onClick={() => setRequestsSubTab('verification')}
              className={requestsSubTab === 'verification' ? 'bg-violet-600 hover:bg-violet-700 font-bold text-xs' : 'text-xs'}
              data-testid="subtab-kyc-requests"
            >
              Seller Verification
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* 1. SELLER VERIFICATION STATUS CARD (Shown when subtab is 'all' or 'verification') */}
              {(requestsSubTab === 'all' || requestsSubTab === 'verification') && (
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm" data-testid="seller-verification-status-card">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        kycStatusData?.status === 'verified' || user?.is_seller_verified
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : kycStatusData?.status === 'pending' || user?.verification_status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : kycStatusData?.status === 'rejected' || user?.verification_status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-violet-600/10 text-violet-500 border border-violet-500/20'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">Seller Trust Verification</h3>
                        <p className="text-xs text-muted-foreground">Government ID verification for trusted seller badges & monthly free posts</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {kycStatusData?.status === 'verified' || user?.is_seller_verified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          VERIFIED SELLER
                        </Badge>
                      ) : kycStatusData?.status === 'pending' || user?.verification_status === 'pending' ? (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs font-semibold px-2.5 py-0.5">
                          <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" />
                          PENDING REVIEW
                        </Badge>
                      ) : kycStatusData?.status === 'rejected' || user?.verification_status === 'rejected' ? (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs font-semibold px-2.5 py-0.5">
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          REJECTED
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          NOT APPLIED
                        </Badge>
                      )}

                      {kycStatusData?.decision && (
                        <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-semibold">
                          Decision: {kycStatusData.decision}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Submission and Review Timestamps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-muted/30 border border-border/50 rounded-lg">
                      <span className="text-muted-foreground block text-[11px]">Submitted Date:</span>
                      <span className="font-semibold text-foreground">
                        {kycStatusData?.submitted_at ? formatDate(kycStatusData.submitted_at) : 'Not submitted yet'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-muted/30 border border-border/50 rounded-lg">
                      <span className="text-muted-foreground block text-[11px]">Last Updated / Reviewed:</span>
                      <span className="font-semibold text-foreground">
                        {kycStatusData?.reviewed_at ? formatDate(kycStatusData.reviewed_at) : (kycStatusData?.submitted_at ? 'Awaiting review' : 'N/A')}
                      </span>
                    </div>

                    <div className="p-2.5 bg-muted/30 border border-border/50 rounded-lg">
                      <span className="text-muted-foreground block text-[11px]">Document Type:</span>
                      <span className="font-semibold capitalize text-foreground">
                        {kycStatusData?.kyc?.document_type ? kycStatusData.kyc.document_type.replace('_', ' ') : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-muted/30 border border-border/50 rounded-lg">
                      <span className="text-muted-foreground block text-[11px]">Masked ID Reference:</span>
                      <span className="font-mono font-bold text-foreground">
                        {kycStatusData?.kyc?.document_number ? `****${kycStatusData.kyc.document_number}` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* User-Facing Admin Remark Callout */}
                  {kycStatusData?.admin_remark ? (
                    <div className="p-3.5 bg-violet-500/10 border border-violet-500/25 rounded-xl space-y-1.5" data-testid="verification-admin-remark-box">
                      <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-violet-400" />
                          <span>Admin Review Remark / Reason</span>
                        </div>
                        {kycStatusData.reviewed_at && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Updated: {formatDate(kycStatusData.reviewed_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-foreground font-medium pl-5 leading-relaxed" data-testid="verification-admin-remark">
                        "{kycStatusData.admin_remark}"
                      </p>
                    </div>
                  ) : kycStatusData?.status === 'pending' ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400/90 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Your documents are in the moderation queue. Reviews typically complete within 24 to 48 hours.</span>
                    </div>
                  ) : null}

                  {/* Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground">
                      Verified sellers get priority in search, a verified badge on all ads, and 3 free monthly post allowances.
                    </p>

                    {kycStatusData?.status === 'rejected' ? (
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 font-bold text-xs"
                        onClick={() => setShowVerifyModal(true)}
                        data-testid="reapply-kyc-btn"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Re-apply for Verification
                      </Button>
                    ) : kycStatusData?.status === 'not_applied' || (!kycStatusData?.status && !user?.is_seller_verified) ? (
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 font-bold text-xs"
                        onClick={() => setShowVerifyModal(true)}
                        data-testid="apply-kyc-btn"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Apply for Verification
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* 2. SUPPORT TICKETS SECTION */}
              {(requestsSubTab === 'all' || requestsSubTab === 'tickets') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-violet-500" />
                      <span>Support & Problem Tickets ({myTickets.length})</span>
                    </h3>
                  </div>

                  {myTickets.length > 0 ? (
                    <div className="space-y-4" data-testid="user-tickets-list">
                      {myTickets.slice((ticketsPage - 1) * 20, ticketsPage * 20).map((ticket) => (
                        <div
                          key={ticket.id}
                          className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3 transition-all hover:border-violet-500/30"
                          data-testid={`ticket-card-${ticket.id}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-sm text-violet-400">
                                  {ticket.ticket_number}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {ticket.category}
                                </Badge>
                                {ticket.priority && ticket.priority === 'urgent' && (
                                  <Badge className="bg-red-500 text-white text-[10px] font-bold">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Submitted: {formatDate(ticket.created_at)}
                                {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                                  <span className="ml-2 font-mono">• Last Updated: {formatDate(ticket.updated_at)}</span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className={
                                  ticket.status === 'resolved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                                    : ticket.status === 'in_progress'
                                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold'
                                    : ticket.status === 'closed'
                                    ? 'bg-zinc-500/10 text-muted-foreground border-zinc-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold'
                                }
                                data-testid={`ticket-status-${ticket.id}`}
                              >
                                {ticket.status === 'open' ? 'UNDER REVIEW' : ticket.status?.replace('_', ' ').toUpperCase()}
                              </Badge>

                              {ticket.decision && (
                                <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-semibold">
                                  Decision: {ticket.decision}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-base text-foreground mb-1">{ticket.subject}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {ticket.description}
                            </p>
                          </div>

                          {(ticket.listing_id || ticket.transaction_id) && (
                            <div className="flex flex-wrap items-center gap-3 p-2 bg-muted/30 border border-border/50 rounded-lg text-xs">
                              {ticket.listing_id && (
                                <div>
                                  <span className="text-muted-foreground">Listing Reference: </span>
                                  <a href={`/listing/${ticket.listing_id}`} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline font-mono font-medium">
                                    {ticket.listing_id}
                                  </a>
                                </div>
                              )}
                              {ticket.transaction_id && (
                                <div>
                                  <span className="text-muted-foreground">Transaction ID: </span>
                                  <span className="font-mono text-cyan-400 font-medium">{ticket.transaction_id}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Admin Official Remark Box */}
                          {ticket.admin_response ? (
                            <div
                              className="p-3.5 bg-violet-500/10 border border-violet-500/25 rounded-xl space-y-1.5 mt-2"
                              data-testid={`ticket-admin-response-${ticket.id}`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                                  <span>Admin Official Response</span>
                                </div>
                                {ticket.updated_at && (
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    Updated: {formatDate(ticket.updated_at)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-foreground font-medium pl-5 leading-relaxed">
                                "{ticket.admin_response}"
                              </p>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>Our support team is reviewing your ticket and will post updates directly here.</span>
                            </div>
                          )}
                        </div>
                      ))}
                      <PaginationControls
                        currentPage={ticketsPage}
                        totalPages={Math.ceil(myTickets.length / 20)}
                        totalRecords={myTickets.length}
                        pageSize={20}
                        onPageChange={setTicketsPage}
                      />
                    </div>
                  ) : requestsSubTab === 'tickets' ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border space-y-3">
                      <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
                      <h4 className="font-bold text-base text-foreground">No support tickets submitted</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        If you have any account issues, fake deal concerns, or payment questions, submit a ticket to get help.
                      </p>
                      <Link to="/contact">
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 font-bold text-xs mt-1">
                          Submit Support Ticket
                        </Button>
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 3. REPORTED ADS SECTION */}
              {(requestsSubTab === 'all' || requestsSubTab === 'reports') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Flag className="w-4 h-4 text-violet-500" />
                      <span>Reported Ads & Listings ({myReports.length})</span>
                    </h3>
                  </div>

                  {myReports.length > 0 ? (
                    <div className="space-y-4" data-testid="user-reports-list">
                      {myReports.slice((reportsPage - 1) * 20, reportsPage * 20).map((report) => (
                        <div
                          key={report.id}
                          className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3 transition-all hover:border-violet-500/30"
                          data-testid={`report-card-${report.id}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-violet-400">
                                  Report #{report.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  • {report.target_type?.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Submitted on: {formatDate(report.created_at)}
                                {report.updated_at && report.updated_at !== report.created_at && (
                                  <span className="ml-2 font-mono">• Last Updated: {formatDate(report.updated_at)}</span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className={
                                  report.status === 'resolved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                                    : report.status === 'under_review'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold'
                                    : report.status === 'dismissed' || report.status === 'rejected'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20 font-bold'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold'
                                }
                                data-testid={`report-status-${report.id}`}
                              >
                                {report.status === 'pending' ? 'SUBMITTED' : report.status?.replace('_', ' ').toUpperCase()}
                              </Badge>

                              {report.decision && (
                                <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-semibold">
                                  Decision: {report.decision}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Target Listing Information */}
                          {report.target_type === 'listing' && (
                            <div className="flex items-center justify-between p-2.5 bg-muted/30 border border-border rounded-lg text-xs">
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="text-muted-foreground">Reported Ad: </span>
                                <strong className="text-foreground">{report.listing_title || 'Marketplace Listing'}</strong>
                              </div>
                              {report.target_id && (
                                <a
                                  href={`/listing/${report.listing_slug || report.target_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-violet-400 hover:text-violet-300 font-semibold shrink-0 inline-flex items-center gap-1"
                                >
                                  View Ad <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Problem & Reason */}
                          <div className="space-y-1 text-xs sm:text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-semibold text-foreground">Reason: </span>
                              <span className="text-rose-400 font-medium">{report.reason}</span>
                            </p>
                            {report.details && (
                              <p className="text-muted-foreground">
                                <span className="font-semibold text-foreground">Description: </span>
                                <span>{report.details}</span>
                              </p>
                            )}
                          </div>

                          {/* Admin Response Box (Visible when admin has replied) */}
                          {report.admin_response ? (
                            <div
                              className="p-3.5 bg-violet-500/10 border border-violet-500/25 rounded-xl space-y-1.5 mt-2"
                              data-testid={`admin-response-${report.id}`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                                  <span>Admin Moderation Remark / Decision Reason</span>
                                </div>
                                {report.updated_at && (
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    Updated: {formatDate(report.updated_at)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-foreground font-medium pl-5 leading-relaxed">
                                "{report.admin_response}"
                              </p>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-muted/30 border border-border/40 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>Our moderation team is reviewing this report. Any action or remark will appear here.</span>
                            </div>
                          )}
                        </div>
                      ))}
                      <PaginationControls
                        currentPage={reportsPage}
                        totalPages={Math.ceil(myReports.length / 20)}
                        totalRecords={myReports.length}
                        pageSize={20}
                        onPageChange={setReportsPage}
                      />
                    </div>
                  ) : requestsSubTab === 'reports' ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border space-y-2">
                      <Flag className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
                      <h4 className="font-bold text-base text-foreground">No reports filed</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        If you encounter any suspicious listings, inappropriate content, or fraudulent behavior, you can report it directly from the listing page.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

            </div>
          )}
        </TabsContent>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (Profile Overview, Verification & Linked Accounts) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 h-fit">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <Avatar
                      src={user?.avatar}
                      name={user?.name}
                      size="3xl"
                      className="w-24 h-24 sm:w-28 sm:h-28 shadow-lg shadow-violet-500/10 border-2 border-violet-500/50"
                      interactive={true}
                      onClick={() => setIsAvatarModalOpen(true)}
                      dataTestId="dashboard-profile-avatar"
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 shadow-md transition-transform hover:scale-105"
                      onClick={() => setIsAvatarModalOpen(true)}
                      title="Update profile picture"
                      data-testid="profile-avatar-upload-btn"
                      aria-label="Update profile picture"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="text-xs font-semibold text-violet-500 hover:text-violet-400 hover:bg-violet-500/10 mb-2 h-7 px-2.5 rounded-lg"
                    data-testid="change-profile-picture-btn"
                  >
                    Change Picture
                  </Button>

                  <h3 className="font-bold text-lg text-foreground">{user?.name}</h3>
                  {user?.username && (
                    <p className="text-sm font-mono text-violet-500 mt-0.5">@{user.username}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                    {kycStatusData?.status === 'verified' || user?.is_seller_verified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" data-testid="user-verified-badge">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified Seller
                      </Badge>
                    ) : kycStatusData?.status === 'pending' || user?.verification_status === 'pending' ? (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20" data-testid="user-pending-badge">
                        <Clock className="w-3 h-3 mr-1" />
                        Verification Pending
                      </Badge>
                    ) : kycStatusData?.status === 'rejected' || user?.verification_status === 'rejected' ? (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20" data-testid="user-rejected-badge">
                        <XCircle className="w-3 h-3 mr-1" />
                        Verification Rejected
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-500/10 text-muted-foreground border-zinc-500/20">
                        Regular Member
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Seller Verification Banner Card */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 h-fit" data-testid="seller-verification-card">
                {kycStatusData?.status === 'verified' || user?.is_seller_verified ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>✓ Verified Seller</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your identity has been verified by our moderation team. Your listings receive priority placement and verified buyer trust badges.
                    </p>

                    {/* Monthly Free Posts Perk Widget */}
                    <div className="mt-3 p-3.5 bg-gradient-to-br from-violet-500/10 to-purple-500/5 dark:from-violet-950/30 dark:to-purple-900/10 border border-violet-500/30 dark:border-violet-500/25 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-violet-950 dark:text-violet-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                          Free Listings This Month
                        </span>
                        <span className="font-bold text-violet-700 dark:text-violet-400 font-mono">
                          {allowanceData ? `${allowanceData.used} / ${allowanceData.limit} used` : '0 / 3 used'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (((allowanceData?.used || 0) / 3) * 100))}%`
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span>
                          {allowanceData?.remaining > 0 ? (
                            <strong className="text-emerald-400 font-semibold">
                              {allowanceData.remaining} free post{allowanceData.remaining > 1 ? 's' : ''} remaining
                            </strong>
                          ) : (
                            <span className="text-amber-400 font-medium">
                              No free listings remaining this month
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Auto-resets monthly</span>
                      </div>
                    </div>
                  </div>
                ) : kycStatusData?.status === 'pending' || user?.verification_status === 'pending' ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Verification Pending</span>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs font-semibold">
                        Under Review
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your verification application is currently being reviewed by our moderation team. This usually takes 24-48 hours.
                    </p>
                    {kycStatusData?.submitted_at && (
                      <p className="text-[11px] text-muted-foreground">
                        Submitted: <span className="text-foreground font-medium">{formatDate(kycStatusData.submitted_at)}</span>
                      </p>
                    )}
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400/90 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Duplicate submissions are prevented while review is pending.</span>
                    </div>
                  </div>
                ) : kycStatusData?.status === 'rejected' || user?.verification_status === 'rejected' ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span>Verification Rejected</span>
                      </div>
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs font-semibold">
                        Rejected
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your verification request was rejected by an administrator.
                    </p>

                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        Reason:
                      </p>
                      <p className="text-xs text-foreground font-medium pl-5" data-testid="rejection-reason-text">
                        {kycStatusData?.rejection_reason || 'The submitted government ID could not be verified.'}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-violet-600 hover:bg-violet-700 font-bold text-xs"
                      onClick={() => setShowVerifyModal(true)}
                      data-testid="reapply-kyc-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Re-apply for Verification
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-500 flex-shrink-0 mt-0.5">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Become a Verified Seller</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Upload government ID to get the verified badge, 3 free monthly posts, and build trust with buyers.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Verified Badge</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>3 Free Posts / Mo</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Priority Visibility</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-violet-600 hover:bg-violet-700 font-bold text-xs"
                      onClick={() => setShowVerifyModal(true)}
                      data-testid="apply-kyc-btn"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Apply for Verification
                    </Button>
                  </div>
                )}
              </div>

              {/* Linked Accounts Card */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 h-fit space-y-4">
                <h4 className="font-bold text-sm text-foreground">Linked Accounts</h4>
                <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold text-sm shrink-0">
                      G
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Google</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.google_linked || user?.auth_type === 'google' 
                          ? (user.google_email || 'Connected') 
                          : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {user?.google_linked || user?.auth_type === 'google' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 text-xs shrink-0 px-2.5 sm:px-3"
                      onClick={() => setShowDisconnectGoogleModal(true)}
                      data-testid="disconnect-google-btn"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-violet-500 hover:bg-violet-500/10 shrink-0 px-2.5 sm:px-3"
                      onClick={() => setShowConnectGoogleModal(true)}
                      data-testid="connect-google-btn"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              {/* Account Metadata Summary */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 h-fit space-y-3">
                <h4 className="font-bold text-sm text-foreground">Account Summary</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span>Role</span>
                    <span className="font-medium text-foreground capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span>Member Since</span>
                    <span className="font-medium text-foreground">{formatDate(user?.created_at)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span>Email Status</span>
                    <span className={user?.is_email_verified ? "font-medium text-emerald-500" : "font-medium text-amber-500"}>
                      {user?.is_email_verified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Phone Status</span>
                    <span className={user?.is_phone_verified ? "font-medium text-emerald-500" : "font-medium text-zinc-500"}>
                      {user?.is_phone_verified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (Profile Information Form & Password Security) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Profile Details Form */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <div className="border-b border-border pb-4 mb-6">
                  <h2 className="font-bold text-lg text-foreground">Profile Information</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage your public identity, contact preferences, and regional location
                  </p>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  {/* Full Name & Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="name">Full Name *</Label>
                        <span className="text-[11px] text-muted-foreground">Max 20 chars (letters & single spaces)</span>
                      </div>
                      <Input
                        id="name"
                        value={name}
                        maxLength={20}
                        onChange={(e) => setName(sanitizeFullNameInput(e.target.value))}
                        placeholder="Your full name"
                        data-testid="profile-name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="username">Username</Label>
                        <span className="text-[11px] text-muted-foreground">1–9 chars (letters, numbers, _)</span>
                      </div>
                      <Input
                        id="username"
                        value={username}
                        maxLength={9}
                        onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
                        placeholder="gamer_tag"
                        data-testid="profile-username"
                      />
                    </div>
                  </div>

                  {/* Email & Phone with OTP verification triggers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email">Email Address</Label>
                        {user?.is_email_verified && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <Check className="w-2.5 h-2.5 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || 'No email registered'}
                          disabled
                          className="bg-muted/50 text-muted-foreground flex-1 min-w-0 font-mono text-xs truncate"
                          data-testid="profile-email-display"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setNewEmail('');
                            setEmailOtpSent(false);
                            setEmailOtp('');
                            setShowEmailModal(true);
                          }}
                          className="flex-shrink-0 h-9 px-3 text-xs"
                          data-testid="change-email-btn"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1.5" />
                          Change
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Number Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone">Mobile Number</Label>
                        {user?.is_phone_verified ? (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <Check className="w-2.5 h-2.5 mr-0.5" />
                            Verified
                          </Badge>
                        ) : user?.phone ? (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                            Unverified
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="phone"
                          value={user?.phone || 'Not configured'}
                          disabled
                          className="bg-muted/50 text-muted-foreground flex-1 min-w-0 font-mono text-xs truncate"
                          data-testid="profile-phone-display"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setNewPhone('');
                            setPhoneOtpSent(false);
                            setPhoneOtp('');
                            setShowPhoneModal(true);
                          }}
                          className="flex-shrink-0 h-9 px-3 text-xs"
                          data-testid="change-phone-btn"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1.5" />
                          {user?.phone ? 'Change' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Regional Location in Kerala */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-violet-500" />
                      <Label className="font-semibold text-sm">Kerala Location Details</Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">District</Label>
                        <Select 
                          value={district} 
                          onValueChange={(val) => { 
                            setDistrict(val); 
                            setTaluk(''); 
                            setArea(''); 
                          }}
                        >
                          <SelectTrigger data-testid="profile-district-select">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sub-District (Taluk)</Label>
                        <Select 
                          key={`taluk-${district}`} 
                          value={taluk ? taluk : undefined} 
                          onValueChange={(val) => { 
                            setTaluk(val); 
                            setArea(''); 
                          }} 
                          disabled={!district}
                        >
                          <SelectTrigger data-testid="profile-taluk-select">
                            <SelectValue placeholder="Select taluk" />
                          </SelectTrigger>
                          <SelectContent>
                            {taluks.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Village / Town</Label>
                        <Select 
                          key={`area-${taluk}`} 
                          value={area ? area : undefined} 
                          onValueChange={setArea} 
                          disabled={!taluk}
                        >
                          <SelectTrigger data-testid="profile-area-select">
                            <SelectValue placeholder="Select village/town" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map((a) => (
                              <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 font-bold"
                      disabled={profileLoading}
                      data-testid="profile-save"
                    >
                      {profileLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        'Save Profile Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Password & Security Card */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <div className="border-b border-border pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-violet-500" />
                    <h2 className="font-bold text-lg text-foreground">Password & Security</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.has_password 
                      ? 'Ensure your account uses a strong, unique password of at least 6 characters'
                      : 'Set a password so you can sign in directly with your email without Google'}
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
                  {user?.has_password && (
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        data-testid="profile-current-password"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password *</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        data-testid="profile-new-password"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        data-testid="profile-confirm-password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    disabled={passwordLoading}
                    className="w-full sm:w-auto font-bold"
                    data-testid="profile-update-password-btn"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      user?.has_password ? 'Update Password' : 'Set Account Password'
                    )}
                  </Button>
                </form>
              </div>

            </div>

          </div>
        </TabsContent>
      </Tabs>

      {/* Email Change OTP Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-500" />
              {emailOtpSent ? 'Verify New Email Address' : 'Change Email Address'}
            </DialogTitle>
            <DialogDescription>
              {emailOtpSent 
                ? `Enter the 6-digit verification code sent to ${newEmail}` 
                : 'A 6-digit verification code will be sent to confirm ownership of the new email address.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {!emailOtpSent ? (
              <div className="space-y-2">
                <Label htmlFor="new-email-input">New Email Address *</Label>
                <Input
                  id="new-email-input"
                  type="email"
                  placeholder="new.email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  data-testid="new-email-input"
                />
                <p className="text-xs text-muted-foreground">
                  Your current email remains active until verification completes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-otp-input">Enter 6-digit Verification Code</Label>
                  <Input
                    id="email-otp-input"
                    placeholder="123456"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="font-mono text-center tracking-widest text-lg font-bold"
                    data-testid="email-otp-input"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailOtpSent(false);
                      setEmailOtp('');
                    }}
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    Change email address
                  </button>
                  
                  {emailCooldown > 0 ? (
                    <span className="text-muted-foreground font-mono">
                      Resend in {emailCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={emailLoading}
                      className="text-violet-500 hover:text-violet-400 font-semibold"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailModal(false);
                setEmailOtpSent(false);
                setEmailOtp('');
                setNewEmail('');
              }}
            >
              Cancel
            </Button>
            {!emailOtpSent ? (
              <Button
                onClick={handleSendEmailOtp}
                disabled={emailLoading || !newEmail}
                className="bg-violet-600 hover:bg-violet-700 font-bold"
                data-testid="send-email-otp-btn"
              >
                {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Code'}
              </Button>
            ) : (
              <Button
                onClick={handleVerifyEmailOtp}
                disabled={emailLoading || emailOtp.length !== 6}
                className="bg-violet-600 hover:bg-violet-700 font-bold"
                data-testid="verify-email-otp-btn"
              >
                {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Update Email'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone OTP Modal */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-violet-500" />
              {phoneOtpSent ? 'Verify Mobile Number' : (user?.phone ? 'Change Mobile Number' : 'Add Mobile Number')}
            </DialogTitle>
            <DialogDescription>
              {phoneOtpSent
                ? `Enter the 6-digit verification code sent to +91 ${newPhone}`
                : 'A 6-digit verification code will be sent to confirm your mobile number.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            {!phoneOtpSent ? (
              <div className="space-y-2">
                <Label htmlFor="new-phone-input">10-Digit Mobile Number *</Label>
                <div className="flex gap-2">
                  <Input value="+91" disabled className="w-16 font-mono text-center" />
                  <Input
                    id="new-phone-input"
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    data-testid="new-phone-input"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone-otp-input">Enter 6-digit Verification Code</Label>
                  <Input
                    id="phone-otp-input"
                    placeholder="123456"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="font-mono text-center tracking-widest text-lg font-bold"
                    data-testid="phone-otp-input"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneOtpSent(false);
                      setPhoneOtp('');
                    }}
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    Change phone number
                  </button>

                  {phoneCooldown > 0 ? (
                    <span className="text-muted-foreground font-mono">
                      Resend in {phoneCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={phoneLoading}
                      className="text-violet-500 hover:text-violet-400 font-semibold"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setShowPhoneModal(false);
              setPhoneOtpSent(false);
              setPhoneOtp('');
              setNewPhone('');
            }}>
              Cancel
            </Button>
            {!phoneOtpSent ? (
              <Button 
                onClick={handleSendPhoneOtp}
                disabled={phoneLoading || newPhone.length !== 10}
                className="bg-violet-600 hover:bg-violet-700 font-bold"
                data-testid="send-phone-otp-btn"
              >
                {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Code'}
              </Button>
            ) : (
              <Button 
                onClick={handleVerifyPhoneOtp}
                disabled={phoneLoading || phoneOtp.length !== 6}
                className="bg-violet-600 hover:bg-violet-700 font-bold"
                data-testid="verify-phone-otp-btn"
              >
                {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Update Phone'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Connect Modal */}
      <Dialog open={showConnectGoogleModal} onOpenChange={setShowConnectGoogleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs">
                G
              </div>
              Connect Google Account
            </DialogTitle>
            <DialogDescription>
              Link your Google account for quick, one-click sign-in to Game Gear Swap.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="google-email-input">Google Account Email *</Label>
              <Input
                id="google-email-input"
                type="email"
                placeholder="your.account@gmail.com"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                data-testid="google-email-input"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConnectGoogleModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnectGoogle}
              disabled={connectGoogleLoading || !googleEmailInput}
              className="bg-violet-600 hover:bg-violet-700 font-bold"
              data-testid="confirm-connect-google-btn"
            >
              {connectGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link Google Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Disconnect Confirmation Modal */}
      <Dialog open={showDisconnectGoogleModal} onOpenChange={setShowDisconnectGoogleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Disconnect Google Account?
            </DialogTitle>
            <DialogDescription>
              You will no longer be able to sign in directly using Google authentication.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-sm text-muted-foreground space-y-2">
            {!user?.has_password ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs">
                ⚠️ You have not set a password yet. Please set a password in the Password & Security section before disconnecting Google to prevent getting locked out.
              </div>
            ) : (
              <p className="text-xs">
                Please make sure you remember your account password or have access to your verified email address to log in.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDisconnectGoogleModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnectGoogle}
              disabled={disconnectLoading || !user?.has_password}
              data-testid="confirm-disconnect-google-btn"
            >
              {disconnectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Disconnect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Verification Modal */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Seller Verification (KYC)</DialogTitle>
            <DialogDescription>
              Upload a government ID to get verified and build trust with buyers
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Verified Badge</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Priority Listing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Buyer Trust</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Document Type *</Label>
              <Select value={kycDocType} onValueChange={setKycDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aadhaar">Aadhaar Card (masked)</SelectItem>
                  <SelectItem value="pan">PAN Card</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                  <SelectItem value="voter_id">Voter ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Last 4 digits of document number *</Label>
              <Input
                placeholder="e.g., 1234"
                value={kycDocNumber}
                onChange={(e) => setKycDocNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                For your privacy, we only store the last 4 digits
              </p>
            </div>

            <div className="space-y-2">
              <Label>Upload Document Image *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                {kycDocImage ? (
                  <div className="relative">
                    <img src={kycDocImage} alt="Document" className="w-full h-40 object-contain rounded" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => {
                        setKycDocImage(null);
                        setKycDocFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer py-4">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload document</span>
                    <span className="text-xs text-muted-foreground mt-1">JPEG, PNG (max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleKycImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Please mask/hide sensitive information like full Aadhaar number. Only last 4 digits should be visible.
              </p>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Privacy & Security Notice</p>
                  <ul className="space-y-1">
                    <li>• Your documents are used <strong>solely for identity verification</strong> to prevent scams.</li>
                    <li>• We will <strong>never use your documents for any other purpose</strong>.</li>
                    <li>• Documents are stored securely and only accessible to our verification team.</li>
                    <li>• In case of legal requirements, documents may be shared with government authorities only.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowVerifyModal(false);
              setKycDocType('');
              setKycDocNumber('');
              setKycDocImage(null);
              setKycDocFile(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleKycSubmit}
              disabled={verifyLoading || !kycDocType || !kycDocNumber || !kycDocFile}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 30-Day Expiry Extension Request Dialog */}
      <Dialog open={isExtensionModalOpen} onOpenChange={setIsExtensionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400" />
              <span>Request 30-Day Expiry Extension</span>
            </DialogTitle>
            <DialogDescription>
              Submit an extension request for <strong className="text-foreground">{extensionListing?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-violet-500/10 dark:bg-violet-950/30 border border-violet-500/30 dark:border-violet-500/20 rounded-xl space-y-1 text-zinc-700 dark:text-zinc-300">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Current Expiry:</span>
                <span className="font-bold text-foreground">{formatDate(extensionListing?.expires_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Extension Allowed:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">+30 Days (1 extension max)</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-border/60">
                Extension requests are reviewed by the moderation team. If approved, the listing's validity is extended by 30 days.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason for Extension Request (Optional)</Label>
              <textarea
                placeholder="e.g. Item still available, looking for serious local buyers..."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={3}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsExtensionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExtensionRequest}
              disabled={extensionLoading}
              className="bg-violet-600 hover:bg-violet-700 font-bold"
            >
              {extensionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Submit Extension Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-Time Free Edit Request Dialog */}
      <Dialog open={isFreeEditModalOpen} onOpenChange={setIsFreeEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-cyan-400" />
              <span>Request One-Time Free Edit</span>
            </DialogTitle>
            <DialogDescription>
              Request an admin-approved free edit allowance for <strong className="text-foreground">{freeEditListing?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-cyan-500/10 dark:bg-cyan-950/30 border border-cyan-500/30 dark:border-cyan-500/20 rounded-xl space-y-1 text-zinc-700 dark:text-zinc-300">
              <p className="leading-relaxed">
                By platform policy, free edits are allowed within 24 hours of posting. If you need to update crucial product details, pricing, or images after 24h, you can request an administrative one-time free edit allowance.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">What details do you need to modify? *</Label>
              <textarea
                placeholder="e.g. Need to adjust price to ₹15,000 and update warranty status..."
                value={freeEditReason}
                onChange={(e) => setFreeEditReason(e.target.value)}
                rows={3}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsFreeEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFreeEditRequest}
              disabled={freeEditLoading || !freeEditReason.trim()}
              className="bg-violet-600 hover:bg-violet-700 font-bold"
            >
              {freeEditLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Submit Edit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Listing Confirmation Dialog (Soft-Delete & Audit Compliant) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              <span>Delete Listing</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong className="text-foreground">"{listingToDelete?.title}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs space-y-2">
            <div className="p-3 bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 dark:border-red-500/20 rounded-xl space-y-1 text-zinc-700 dark:text-zinc-300">
              <p className="font-bold text-red-600 dark:text-red-400">Safe Deletion Policy:</p>
              <p>
                Deleting will remove this listing from marketplace search, public browsing, and active user cards immediately.
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-border/60">
                Payment invoices, receipts, and administrative transaction history are securely retained for tax, warranty, and fraud prevention compliance.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Editor & Cropper Modal */}
      <ProfilePictureModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentUser={user}
        onAvatarUpdated={(updatedUser) => {
          if (refreshUser) refreshUser();
        }}
      />
    </div>
  );
}
