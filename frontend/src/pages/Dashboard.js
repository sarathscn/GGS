import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { getDistricts, getTaluks, getAreas, formatLocation } from '../lib/keralaLocations';
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
  X
} from 'lucide-react';

export default function Dashboard() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'listings');
  const [myListings, setMyListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone?.replace('+91', '') || '');
  // Location hierarchy state
  const [district, setDistrict] = useState(user?.location_district || '');
  const [taluk, setTaluk] = useState(user?.location_taluk || '');
  const [area, setArea] = useState(user?.location_area || '');
  
  // Derived location data
  const districts = getDistricts();
  const taluks = district ? getTaluks(district) : [];
  const areas = district && taluk ? getAreas(district, taluk) : [];
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Google disconnect
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  // Phone OTP modal
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // KYC Verification modal
  const [kycDocType, setKycDocType] = useState('');
  const [kycDocNumber, setKycDocNumber] = useState('');
  const [kycDocImage, setKycDocImage] = useState(null);
  const [kycDocFile, setKycDocFile] = useState(null);

  // Verification modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Avatar upload
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone?.replace('+91', '') || '');
      setDistrict(user.location_district || '');
      setTaluk(user.location_taluk || '');
      setArea(user.location_area || '');
    }
  }, [user]);

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
      
      const doc = new jsPDF();
      
      // Add Letterhead
      doc.setFontSize(22);
      doc.setTextColor(139, 92, 246); // Violet-500
      doc.setFont("helvetica", "bold");
      doc.text("GAME GEAR SWAP", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Kerala's Trusted Gaming Marketplace", 105, 26, { align: "center" });
      doc.text(invoice.company_address || "Kerala, India", 105, 32, { align: "center" });
      doc.text(`Email: ${invoice.company_email} | GSTIN: ${invoice.company_gstin}`, 105, 38, { align: "center" });
      
      // Divider
      doc.setDrawColor(200);
      doc.line(14, 45, 196, 45);
      
      // Invoice Details
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("TAX INVOICE", 14, 55);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice No: ${invoice.invoice_number}`, 14, 65);
      doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, 14, 71);
      doc.text(`Transaction ID: ${invoice.transaction_id}`, 14, 77);
      
      // Billed To
      const billedToY = 65;
      doc.setFont("helvetica", "bold");
      doc.text("BILLED TO:", 120, billedToY);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.user_name || 'N/A', 120, billedToY + 6);
      if (invoice.user_email) doc.text(invoice.user_email, 120, billedToY + 12);
      if (invoice.user_phone) doc.text(invoice.user_phone, 120, billedToY + 18);
      
      // Table
      doc.autoTable({
        startY: 90,
        head: [['Description', 'Amount']],
        body: [
          [`Ad Title: ${invoice.ad_title}\nAd ID: ${invoice.ad_id}`, `Rs. ${invoice.base_amount}`],
          [`GST (${invoice.gst_rate}%)`, `Rs. ${invoice.gst_amount}`],
        ],
        foot: [['Total Amount', `Rs. ${invoice.total_amount}`]],
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] }
      });
      
      const finalY = doc.lastAutoTable.finalY || 130;
      doc.setFont("helvetica", "normal");
      doc.text(`Payment Method: ${invoice.payment_method}`, 14, finalY + 10);
      doc.text(`Status: ${invoice.payment_status}`, 14, finalY + 16);
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`© ${invoice.copyright}`, 105, 280, { align: "center" });

      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
      
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const fullLocation = formatLocation(district, taluk, area);
      await updateProfile({ 
        name,
        username,
        email,
        location: fullLocation,
        location_district: district,
        location_taluk: taluk,
        location_area: area || null
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/profile/change-password', {
        current_password: user?.auth_type === 'google' ? undefined : currentPassword,
        new_password: newPassword
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google account? You will need a password to log in.')) return;
    setDisconnectLoading(true);
    try {
      await api.post('/profile/disconnect-google');
      if (refreshUser) refreshUser();
      toast.success('Google account disconnected');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to disconnect Google account');
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const avatarUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`;
      await api.put('/profile', { avatar: avatarUrl });
      
      if (refreshUser) refreshUser();
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (newPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setPhoneLoading(true);
    try {
      await api.post('/auth/otp/send', { phone: `+91${newPhone}` });
      setOtpSent(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setPhoneLoading(true);
    try {
      await api.post('/profile/update-phone', { phone: `+91${newPhone}`, otp });
      setPhone(newPhone);
      setShowPhoneModal(false);
      setOtpSent(false);
      setOtp('');
      setNewPhone('');
      if (refreshUser) refreshUser();
      toast.success('Phone number updated');
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setPhoneLoading(false);
    }
  };

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
      // Upload document image
      const formData = new FormData();
      formData.append('file', kycDocFile);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const docImageUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`;
      
      // Submit KYC
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
      toast.success('KYC documents submitted! Our team will review them shortly.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit KYC');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await api.delete(`/listings/${listingId}`);
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      toast.success('Listing deleted');
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const handleMarkAsSold = async (listingId) => {
    try {
      await api.post(`/listings/${listingId}/mark-sold`);
      setMyListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, status: 'sold' } : l
      ));
      toast.success('Listing marked as sold!');
    } catch (error) {
      toast.error('Failed to update listing');
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
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">Dashboard</h1>
            <p className="text-muted-foreground">Manage your listings and account</p>
          </div>
          <Link to="/sell">
            <Button className="bg-violet-600 hover:bg-violet-700" data-testid="new-listing-btn">
              <Plus className="w-4 h-4 mr-2" />
              Post New Listing
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
            <TabsTrigger value="listings" className="gap-2" data-testid="tab-listings">
              <Package className="w-4 h-4 hidden sm:block" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2" data-testid="tab-wishlist">
              <Heart className="w-4 h-4 hidden sm:block" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2" data-testid="tab-payments">
              <CreditCard className="w-4 h-4 hidden sm:block" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
              <Settings className="w-4 h-4 hidden sm:block" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* My Listings */}
          <TabsContent value="listings">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                    <div className="aspect-[4/3] bg-muted"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-5 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : myListings.length > 0 ? (
              <div className="space-y-4">
                {myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4"
                    data-testid={`my-listing-${listing.id}`}
                  >
                    <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      <img
                        src={listing.images?.[0] || 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=200'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      {listing.status === 'sold' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge className="bg-cyan-500 text-white">SOLD</Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold truncate">{listing.title}</h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge variant="outline" className={statusColors[listing.status]}>
                            {listing.status === 'pending_payment' ? 'Payment Pending' : listing.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="font-mono text-lg font-bold text-violet-500 mb-2">
                        {formatPrice(listing.price)}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {listing.category_name} • {listing.condition} • {listing.location}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/listing/${listing.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link to={`/edit-listing/${listing.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        {listing.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-500 hover:text-emerald-600"
                            onClick={() => handleMarkAsSold(listing.id)}
                            data-testid={`mark-sold-${listing.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Sold
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4">Start selling your gaming gear!</p>
                <Link to="/sell">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your First Listing
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist">
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map((listing) => (
                  <ProductCard
                    key={listing.id}
                    listing={listing}
                    onWishlistChange={() => fetchData()}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-bold text-lg mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground mb-4">Save items you're interested in</p>
                <Link to="/marketplace">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    Browse Listings
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            {payments.length > 0 ? (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Payment ID</th>
                        <th className="text-left p-4 font-medium">Listing</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-t border-border">
                          <td className="p-4">{formatDate(payment.created_at)}</td>
                          <td className="p-4 font-mono text-sm">{payment.id.slice(0, 8)}...</td>
                          <td className="p-4 text-sm">{payment.listing_title || '-'}</td>
                          <td className="p-4 font-mono font-bold text-violet-500">
                            {formatPrice(payment.amount)}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={statusColors[payment.status]}>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoice(payment.id)}
                              data-testid={`download-invoice-${payment.id}`}
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Invoice
                            </Button>
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
                <p className="text-muted-foreground">Payments will appear here after you post listings</p>
              </div>
            )}
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Picture & Verification */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-6">Profile Picture</h2>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-violet-600/10 flex items-center justify-center overflow-hidden border-2 border-violet-500/50">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-violet-500" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarLoading}
                    >
                      {avatarLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email || user?.phone}</p>
                    {user?.is_seller_verified ? (
                      <Badge className="mt-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified Seller
                      </Badge>
                    ) : user?.verification_status === 'pending' ? (
                      <Badge className="mt-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Verification Pending
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {/* Apply for Verification */}
                {!user?.is_seller_verified && user?.verification_status !== 'pending' && (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-sm mb-1">Become a Verified Seller</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Get a verified badge on your profile and listings. This helps build trust with buyers.
                        </p>
                        <Button 
                          size="sm" 
                          className="bg-violet-600 hover:bg-violet-700"
                          onClick={() => setShowVerifyModal(true)}
                        >
                          Apply for Verification
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Settings */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-6">Profile Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      data-testid="profile-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="profile-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        value={phone ? `+91 ${phone}` : 'Not set'}
                        disabled
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowPhoneModal(true)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {phone ? 'Change' : 'Add'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Location Area */}
                  <div className="space-y-4 pt-2">
                    <Label className="text-base font-semibold">Location</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>District</Label>
                        <Select value={district} onValueChange={(val) => { setDistrict(val); setTaluk(''); setArea(''); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Sub-District (Taluk)</Label>
                        <Select key={`taluk-${district}`} value={taluk ? taluk : undefined} onValueChange={(val) => { setTaluk(val); setArea(''); }} disabled={!district}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select taluk" />
                          </SelectTrigger>
                          <SelectContent>
                            {taluks.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Village / Town</Label>
                        <Select key={`area-${taluk}`} value={area ? area : undefined} onValueChange={setArea} disabled={!taluk}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select area" />
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
                  
                  <Button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={profileLoading}
                    data-testid="profile-save"
                  >
                    {profileLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="font-medium mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {user?.auth_type !== 'google' && (
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{user?.auth_type === 'google' ? 'Set Password' : 'New Password'}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        user?.auth_type === 'google' ? 'Set Password' : 'Update Password'
                      )}
                    </Button>
                  </form>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="font-medium mb-4">Linked Accounts</h3>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                        G
                      </div>
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.auth_type === 'google' ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {user?.auth_type === 'google' && (
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDisconnectGoogle}
                        disabled={disconnectLoading}
                      >
                        {disconnectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="font-medium mb-2">Account Info</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Role: <span className="text-foreground capitalize">{user?.role}</span></p>
                    <p>Member since: <span className="text-foreground">{formatDate(user?.created_at)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Phone OTP Modal */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{phone ? 'Change Phone Number' : 'Add Phone Number'}</DialogTitle>
            <DialogDescription>
              We'll send you a verification code to confirm your phone number
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!otpSent ? (
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="flex gap-2">
                  <Input value="+91" disabled className="w-16" />
                  <Input
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <Input
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  OTP sent to +91 {newPhone}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPhoneModal(false);
              setOtpSent(false);
              setOtp('');
              setNewPhone('');
            }}>
              Cancel
            </Button>
            {!otpSent ? (
              <Button 
                onClick={handleSendOtp}
                disabled={phoneLoading}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
              </Button>
            ) : (
              <Button 
                onClick={handleVerifyOtp}
                disabled={phoneLoading}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Modal with KYC */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Seller Verification (KYC)</DialogTitle>
            <DialogDescription>
              Upload a government ID to get verified and build trust with buyers
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Benefits */}
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

            {/* Document Type Selection */}
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

            {/* Document Number (Last 4 digits) */}
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

            {/* Document Upload */}
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

            {/* Privacy Notice */}
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
    </div>
  );
}
