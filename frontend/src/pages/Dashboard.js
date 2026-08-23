import { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Camera,
  Phone,
  Shield,
  Upload,
  X,
  Mail,
  Lock,
  MapPin,
  Sparkles,
  RefreshCw,
  Check,
  AlertTriangle,
  Receipt
} from 'lucide-react';

export default function Dashboard() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();

  const resolveTab = (tab) => {
    if (!tab) return 'listings';
    if (tab === 'settings' || tab === 'profile') return 'profile';
    return tab;
  };

  const [activeTab, setActiveTab] = useState(() => resolveTab(searchParams.get('tab')));
  const [myListings, setMyListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [payments, setPayments] = useState([]);
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
      const [listingsRes, wishlistRes, paymentsRes] = await Promise.all([
        api.get('/my-listings'),
        api.get('/wishlist'),
        api.get('/payments/my'),
      ]);
      setMyListings(listingsRes.data);
      setWishlist(wishlistRes.data);
      setPayments(paymentsRes.data);
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

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await api.delete(`/listings/${listingId}`);
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      toast.success('Listing deleted successfully');
    } catch (error) {
      toast.error('Failed to delete listing');
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

  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    pending_payment: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    sold: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard-page">
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
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <TabsList className="bg-card border border-border p-1 inline-flex w-auto min-w-full sm:min-w-0 flex-nowrap gap-1">
            <TabsTrigger value="listings" className="gap-2 shrink-0 px-3.5 py-2 text-xs sm:text-sm font-medium" data-testid="tab-listings">
              <Package className="w-4 h-4 shrink-0" />
              <span>My Listings ({myListings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2 shrink-0 px-3.5 py-2 text-xs sm:text-sm font-medium" data-testid="tab-wishlist">
              <Heart className="w-4 h-4 shrink-0" />
              <span>Wishlist ({wishlist.length})</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 shrink-0 px-3.5 py-2 text-xs sm:text-sm font-medium" data-testid="tab-payments">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 shrink-0 px-3.5 py-2 text-xs sm:text-sm font-medium" data-testid="tab-profile">
              <Settings className="w-4 h-4 shrink-0" />
              <span>Profile Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Listings Tab */}
        <TabsContent value="listings">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : myListings.length > 0 ? (
            <div className="space-y-6">
              {/* Sub-tabs for Active vs Sold Listings */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={listingSubTab === 'active' ? 'default' : 'outline'}
                    onClick={() => setListingSubTab('active')}
                    className={listingSubTab === 'active' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                    data-testid="subtab-active-listings"
                  >
                    Active Listings ({myListings.filter(l => l.status !== 'sold' && l.status !== 'completed' && l.status !== 'deleted').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={listingSubTab === 'sold' ? 'default' : 'outline'}
                    onClick={() => setListingSubTab('sold')}
                    className={listingSubTab === 'sold' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                    data-testid="subtab-sold-listings"
                  >
                    Sold / Sales History ({myListings.filter(l => l.status === 'sold' || l.status === 'completed').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={listingSubTab === 'all' ? 'default' : 'outline'}
                    onClick={() => setListingSubTab('all')}
                    className={listingSubTab === 'all' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                    data-testid="subtab-all-listings"
                  >
                    All ({myListings.length})
                  </Button>
                </div>
              </div>

              {/* Listings Grid */}
              {myListings.filter(l => {
                if (listingSubTab === 'active') return l.status !== 'sold' && l.status !== 'completed' && l.status !== 'deleted';
                if (listingSubTab === 'sold') return l.status === 'sold' || l.status === 'completed';
                return true;
              }).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myListings
                    .filter(l => {
                      if (listingSubTab === 'active') return l.status !== 'sold' && l.status !== 'completed' && l.status !== 'deleted';
                      if (listingSubTab === 'sold') return l.status === 'sold' || l.status === 'completed';
                      return true;
                    })
                    .map((listing) => (
                      <div key={listing.id} className="relative group">
                        <ProductCard product={listing} />
                        <div className="mt-2 flex items-center justify-between gap-2 p-2 bg-card border border-border rounded-lg">
                          <Badge className={statusColors[listing.status] || 'bg-zinc-500/10 text-zinc-500'}>
                            {listing.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {listing.status !== 'sold' && listing.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsSold(listing.id)}
                                disabled={markingSoldId === listing.id}
                                className="h-8 px-2 text-xs hover:bg-emerald-500/10 hover:text-emerald-500"
                                title="Mark as Sold"
                                data-testid={`mark-sold-${listing.id}`}
                              >
                                {markingSoldId === listing.id ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-emerald-500" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                )}
                                {markingSoldId === listing.id ? 'Saving...' : 'Mark Sold'}
                              </Button>
                            )}
                            {listing.status !== 'sold' && listing.status !== 'completed' && (
                              <Link to={`/edit/${listing.id}`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`edit-listing-${listing.id}`}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteListing(listing.id)}
                              data-testid={`delete-listing-${listing.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium">
                    {listingSubTab === 'sold' ? 'No sold listings yet.' : 'No active listings found in this tab.'}
                  </p>
                </div>
              )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
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
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : payments.length > 0 ? (
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
                    {payments.map((payment) => (
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
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">No payment history</h3>
              <p className="text-muted-foreground text-sm">Payments and tax invoices will appear here after you post listings</p>
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
                    {user?.is_seller_verified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified Seller
                      </Badge>
                    ) : user?.verification_status === 'pending' ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        KYC Pending Review
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
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 h-fit">
                {user?.is_seller_verified ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Verified Seller Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your identity has been verified by our moderation team. Your listings receive priority visibility and buyer trust badges.
                    </p>
                  </div>
                ) : user?.verification_status === 'pending' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>KYC Verification In Progress</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your submitted government identification is being reviewed by our verification team. This usually takes 24-48 hours.
                    </p>
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
                          Upload government ID to get the verified badge and build trust with buyers.
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-violet-600 hover:bg-violet-700 font-bold"
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
