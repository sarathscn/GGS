import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';
import Avatar from '../components/Avatar';
import GoogleMapLocation from '../components/GoogleMapLocation';
import { FIELD_LIMITS } from '../lib/fieldLimits';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Tag,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  MessageCircle,
  Phone,
  AlertTriangle,
  Flag,
  Shield,
  CheckCircle,
  ExternalLink,
  Copy,
  Eye,
  Star,
  Send,
  Loader2
} from 'lucide-react';

// WhatsApp Icon
const WhatsAppIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [relatedListings, setRelatedListings] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = async (listingId) => {
    if (!listingId) return;
    try {
      const response = await api.get(`/reviews/listing/${listingId}`);
      const reviewList = response.data || [];
      setReviews(reviewList);
      if (user) {
        const userReview = reviewList.find((r) => r.reviewer_id === user.id);
        setHasReviewed(!!userReview);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchRelatedListings = async (categoryId, currentListingId) => {
    if (!categoryId) return;
    try {
      const response = await api.get(`/listings?category=${categoryId}&limit=4`);
      if (Array.isArray(response.data)) {
        setRelatedListings(response.data.filter((l) => l.id !== currentListingId).slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch related listings:', error);
    }
  };

  const fetchSellerListings = async (sellerId, currentListingId) => {
    if (!sellerId) return;
    try {
      const response = await api.get(`/sellers/${sellerId}/listings`);
      if (Array.isArray(response.data)) {
        setSellerListings(response.data.filter((l) => l.id !== currentListingId && l.status === 'sold').slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch seller listings:', error);
    }
  };

  const checkWishlist = async (listingId) => {
    if (!listingId) return;
    try {
      const response = await api.get(`/wishlist/check/${listingId}`);
      setInWishlist(Boolean(response.data?.in_wishlist));
    } catch (error) {
      console.error('Failed to check wishlist:', error);
    }
  };

  // Track recorded views in this session to prevent duplicate view calls on re-renders/StrictMode
  const recordedViewsRef = React.useRef(new Set());

  useEffect(() => {
    let isMounted = true;
    const loadListing = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await api.get(`/listings/${encodeURIComponent(id)}`);
        if (isMounted) {
          if (response.data && response.data.id) {
            setListing(response.data);

            // Record legitimate view once per listing per component session
            const listingId = response.data.id;
            if (!recordedViewsRef.current.has(listingId)) {
              recordedViewsRef.current.add(listingId);
              api.post(`/listings/${encodeURIComponent(listingId)}/view`)
                .then((viewRes) => {
                  if (isMounted && viewRes.data && typeof viewRes.data.views_count === 'number') {
                    setListing((prev) => (prev && prev.id === listingId ? { ...prev, views_count: viewRes.data.views_count } : prev));
                  }
                })
                .catch((err) => {
                  console.warn('Could not record product view:', err);
                });
            }

            if (isAuthenticated) {
              checkWishlist(response.data.id);
            }
            fetchReviews(response.data.id);
            fetchRelatedListings(response.data.category_id, response.data.id);
            fetchSellerListings(response.data.seller_id, response.data.id);
          } else {
            setListing(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch listing:', error);
        if (isMounted) {
          setListing(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadListing();

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  const toggleWishlist = async () => {
    if (!listing) return;
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${listing.id}`);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist', { listing_id: listing.id });
        toast.success('Added to wishlist');
      }
      setInWishlist(!inWishlist);
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleReport = async () => {
    if (!listing) return;
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    
    setReportLoading(true);
    try {
      await api.post('/reports', {
        target_type: 'listing',
        target_id: listing.id,
        reason: reportReason,
        details: reportDetails
      });
      toast.success('Report submitted. We will review it shortly.');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!listing) return;
    if (!reviewComment.trim()) {
      toast.error('Please write a review');
      return;
    }
    
    setReviewLoading(true);
    try {
      await api.post('/reviews', {
        listing_id: listing.id,
        seller_id: listing.seller_id,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      fetchReviews(listing.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

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
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const conditionColors = {
    'New': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    'Like New': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    'Excellent': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    'Good': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    'Fair': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  };

  const handleShare = async () => {
    if (!listing) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const copyAdId = () => {
    if (!listing) return;
    navigator.clipboard.writeText(listing.id);
    toast.success('Ad ID copied!');
  };

  const getPhoneForDisplay = () => {
    if (!listing) return '';
    if (listing.hide_phone && !isAuthenticated) {
      return 'Login to view';
    }
    return listing.contact_phone || 'Not provided';
  };

  const openWhatsApp = () => {
    if (!listing || !listing.contact_phone) return;
    const phone = listing.contact_phone.replace('+', '');
    const message = encodeURIComponent(`Hi, I'm interested in your listing "${listing.title}" on Game Gear Swap.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const startChat = () => {
    if (!listing) return;
    if (!isAuthenticated) {
      toast.error('Please login to chat');
      navigate('/login');
      return;
    }
    navigate(`/messages?listing=${listing.id}&seller=${listing.seller_id}`);
  };

  // 1. Loading State Guard: Render responsive skeleton while data is in flight
  if (loading) {
    return (
      <div className="min-h-screen py-6 sm:py-10" data-testid="listing-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-5 bg-muted rounded w-40"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="aspect-[4/3] sm:aspect-[16/10] max-h-[460px] bg-muted rounded-2xl"></div>
                <div className="h-28 bg-muted rounded-xl"></div>
                <div className="h-44 bg-muted rounded-xl"></div>
                <div className="h-52 bg-muted rounded-xl"></div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <div className="h-40 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-24 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Not Found State Guard: Render clean not-found UI if listing does not exist
  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16" data-testid="listing-not-found">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Listing Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This gaming gear listing may have been removed, sold, or is no longer available.
          </p>
          <Link to="/marketplace">
            <Button className="bg-violet-600 hover:bg-violet-700 font-bold text-white shadow-md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Derived listing data (guaranteed valid & non-null at this point)
  const images = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800'];

  const showPhone = listing.contact_method === 'phone' || listing.contact_method === 'both';
  const showChat = listing.contact_method === 'chat' || listing.contact_method === 'both';

  // Render helper subcomponents to ensure zero grid-row stretching across columns
  const renderGallery = () => (
    <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 space-y-3">
      <div className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[460px] w-full rounded-xl overflow-hidden bg-muted border border-border/50">
        <img
          src={images[currentImage]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </>
        )}

        {listing.featured && (
          <Badge className="absolute top-2.5 left-2.5 bg-violet-600 text-white shadow-md text-xs">
            Featured
          </Badge>
        )}

        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Badge className="bg-red-500 text-white text-base sm:text-lg px-4 py-1.5 font-bold shadow-lg">SOLD</Badge>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                currentImage === index ? 'border-violet-500 scale-95 shadow-sm' : 'border-border/50 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderTitlePrice = () => (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <Link to={`/category/${listing.category_id}`}>
          <Badge variant="outline" className="hover:bg-muted text-xs">
            <Tag className="w-3 h-3 mr-1" />
            {listing.category_name}
          </Badge>
        </Link>
        <Badge variant="outline" className={`text-xs ${conditionColors[listing.condition] || ''}`}>
          {listing.condition}
        </Badge>
        {listing.seller_verified && (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified Seller
          </Badge>
        )}
      </div>

      <h1 className="text-lg sm:text-xl md:text-2xl font-black text-foreground leading-snug break-words" data-testid="listing-title">
        {listing.title}
      </h1>

      <div className="flex items-center gap-3 pt-2 pb-1 border-t border-border/50 flex-wrap">
        <p
          className={`font-mono text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${
            listing.price_type === 'free' || (listing.price_type === 'negotiable' && (!listing.price || Number(listing.price) === 0))
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-violet-700 dark:text-violet-400'
          }`}
          data-testid="listing-price"
        >
          {formatPrice(listing.price)}
        </p>
        {listing.price_type === 'negotiable' && Number(listing.price) > 0 && (
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs sm:text-sm px-2.5 py-1 font-bold rounded-md shrink-0 shadow-sm"
            data-testid="listing-negotiable-badge"
          >
            Negotiable
          </Badge>
        )}
        {listing.price_type === 'exchange' && Number(listing.price) > 0 && (
          <Badge
            variant="outline"
            className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs sm:text-sm px-2.5 py-1 font-bold rounded-md shrink-0 shadow-sm"
          >
            Exchange
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Listed on {formatDate(listing.created_at)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          <span>{typeof listing.views_count === 'number' ? listing.views_count : Number(listing.views_count || 0)} views</span>
        </div>
      </div>
    </div>
  );

  const renderContactBuy = () => (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2.5 shadow-sm">
      <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Contact & Buy</h3>
      
      <div className="space-y-2">
        {showChat && (
          <Button className="w-full h-10 font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm shadow-md flex items-center justify-center gap-2" onClick={startChat}>
            <MessageCircle className="w-4 h-4 mr-1" />
            Chat with Seller
          </Button>
        )}
        {showPhone && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5" 
              onClick={openWhatsApp}
              disabled={listing.hide_phone && !isAuthenticated}
            >
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-9 font-medium text-foreground hover:bg-muted/80 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5"
              onClick={() => {
                if (listing.hide_phone && !isAuthenticated) {
                  navigate('/login');
                } else {
                  window.location.href = `tel:${listing.contact_phone}`;
                }
              }}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{getPhoneForDisplay()}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Owner Actions */}
      {user && (listing.seller_id === user.id || user.role === 'admin') && (
        <div className="border-t border-border/60 pt-2.5 mt-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {user.role === 'admin' && listing.seller_id !== user.id ? 'Admin Management' : 'Owner Actions'}
            </p>
            {user.role !== 'admin' && (
              <span className={`text-[11px] font-medium ${
                listing.free_edit_available ? 'text-emerald-500' : listing.free_edit_status === 'used' ? 'text-muted-foreground' : 'text-amber-500/80'
              }`}>
                {listing.free_edit_available ? `1 Free Edit (${listing.free_edit_hours_left || 24}h left)` : listing.free_edit_status === 'used' ? 'Free edit used' : 'Free edit expired'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {user.role === 'admin' || listing.free_edit_available ? (
              <Link to={`/edit-listing/${listing.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 font-semibold">
                  {user.role === 'admin' && listing.seller_id !== user.id ? 'Admin Edit Listing' : 'Edit Listing'}
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                disabled 
                className="flex-1 text-xs h-8 opacity-50 cursor-not-allowed"
                title={listing.free_edit_status === 'used' ? 'Free edit already used (1 allowed within 24 hours)' : 'Free edit expired (24h window closed)'}
              >
                {listing.free_edit_status === 'used' ? 'Edit (Free edit used)' : 'Edit (Free edit expired)'}
              </Button>
            )}
            {listing.status === 'active' && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 text-xs h-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20"
                disabled={markingSold}
                onClick={async () => {
                  if (markingSold) return;
                  setMarkingSold(true);
                  try {
                    await api.post(`/listings/${listing.id}/mark-sold`);
                    toast.success('Listing marked as sold!');
                    fetchListing();
                  } catch (error) {
                    const errorMsg = error.response?.data?.detail || 'Failed to update listing';
                    toast.error(errorMsg);
                  } finally {
                    setMarkingSold(false);
                  }
                }}
              >
                {markingSold ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-emerald-500" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                )}
                {markingSold ? 'Saving...' : 'Mark as Sold'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSafetyTips = () => (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 sm:p-4">
      <div className="flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400 mb-1">Safe Trading Guidelines</p>
          <ul className="text-[11px] sm:text-xs text-muted-foreground space-y-1">
            <li>• Meet only in busy, well-lit public locations.</li>
            <li>• Inspect hardware and verify specifications before payment.</li>
            <li>• Never transfer funds in advance before receiving the item.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderDescription = () => (
    <div className="space-y-2 py-1">
      <div className="border-b border-border/60 pb-2">
        <h2 className="font-bold text-base sm:text-lg text-foreground">Description</h2>
      </div>
      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed break-words text-xs sm:text-sm md:text-base pt-1">
        {listing.description}
      </p>
    </div>
  );

  const renderSpecifications = () => (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
        <Tag className="w-4 h-4 text-violet-500" />
        <h2 className="font-bold text-sm sm:text-base text-foreground">Specifications & Details</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 text-xs sm:text-sm">
        <div className="bg-muted/40 px-3 py-2 rounded-lg border border-border/30 flex justify-between items-center">
          <span className="text-muted-foreground">Category</span>
          <span className="font-semibold text-foreground">{listing.category_name}</span>
        </div>
        {listing.subcategory_name && (
          <div className="bg-muted/40 px-3 py-2 rounded-lg border border-border/30 flex justify-between items-center">
            <span className="text-muted-foreground">Subcategory</span>
            <span className="font-semibold text-foreground">{listing.subcategory_name}</span>
          </div>
        )}
        <div className="bg-muted/40 px-3 py-2 rounded-lg border border-border/30 flex justify-between items-center">
          <span className="text-muted-foreground">Condition</span>
          <span className="font-semibold text-foreground">{listing.condition}</span>
        </div>
        <div className="bg-muted/40 px-3 py-2 rounded-lg border border-border/30 flex justify-between items-center">
          <span className="text-muted-foreground">Item Type</span>
          <span className="font-semibold text-foreground capitalize">
            {listing.item_type === 'digital' ? 'Digital Item / Account' : 'Physical Item'}
          </span>
        </div>
        {listing.brand && (
          <div className="bg-muted/40 px-3 py-2 rounded-lg border border-border/30 flex justify-between items-center gap-2">
            <span className="text-muted-foreground shrink-0">Brand</span>
            <span className="font-semibold text-foreground truncate max-w-[65%]" title={listing.brand}>{listing.brand}</span>
          </div>
        )}
        {listing.model && (
          <div className="bg-muted/40 px-3 py-2 rounded-lg border border-border/30 flex justify-between items-center gap-2">
            <span className="text-muted-foreground shrink-0">Model</span>
            <span className="font-semibold text-foreground truncate max-w-[65%]" title={listing.model}>{listing.model}</span>
          </div>
        )}
        {listing.specifications?.map((spec, i) => (
          <div key={i} className="bg-muted/40 px-3 py-2 rounded-lg border border-border/30 flex justify-between items-center gap-2">
            <span className="text-muted-foreground shrink-0 truncate max-w-[45%]" title={spec.key}>{spec.key}</span>
            <span className="font-semibold text-foreground truncate max-w-[55%]" title={spec.value}>{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLocationMap = () => (
    <div className="space-y-2.5 py-1">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-violet-500 shrink-0" />
          <h2 className="font-bold text-sm sm:text-base text-foreground">Location Details</h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">• {listing.location}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground sm:hidden">{listing.location}</p>

      {listing.address_details && (
        <p className="text-xs sm:text-sm text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/30">
          {listing.address_details}
        </p>
      )}

      {/* Google Maps Location View */}
      <GoogleMapLocation
        latitude={listing.latitude}
        longitude={listing.longitude}
        locationName={listing.location}
        addressDetails={listing.address_details}
        interactive={false}
        height="h-52 sm:h-64"
      />
    </div>
  );

  const renderSellerCard = () => (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Link to={`/seller/${listing.seller_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1">
          <Avatar
            src={listing.seller_avatar}
            name={listing.seller_name}
            size="lg"
            className="w-10 h-10 border border-violet-500/20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-foreground truncate">{listing.seller_name}</p>
              {listing.seller_verified && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-violet-500 font-medium hover:underline">View Seller Profile →</p>
          </div>
        </Link>
      </div>

      {listing.seller_rating > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.round(listing.seller_rating)
                    ? 'text-amber-400 fill-current'
                    : 'text-muted-foreground/40'
                }`}
              />
            ))}
          </div>
          <span className="font-bold text-foreground">{listing.seller_rating.toFixed(1)}</span>
          <span>rating</span>
        </div>
      )}

      {/* Save / Share / Report Quick Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 text-xs h-8 ${
            inWishlist 
              ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
              : 'hover:bg-muted'
          }`}
          onClick={toggleWishlist}
          data-testid="wishlist-toggle-btn"
        >
          <Heart className={`w-3.5 h-3.5 mr-1 ${inWishlist ? 'fill-current' : ''}`} />
          {inWishlist ? 'Saved' : 'Save'}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs h-8 hover:bg-muted" onClick={handleShare}>
          <Share2 className="w-3.5 h-3.5 mr-1" />
          Share
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
          onClick={() => setShowReportModal(true)}
        >
          <Flag className="w-3.5 h-3.5 mr-1" />
          Report
        </Button>
      </div>
    </div>
  );

  const renderReviews = () => (
    <section className="w-full mt-4 sm:mt-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">Seller Reviews</h2>
          <p className="text-sm text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} • 
            {listing.seller_rating > 0 ? (
              <span className="ml-1 font-semibold text-foreground">
                {listing.seller_rating.toFixed(1)} <Star className="w-3.5 h-3.5 inline fill-amber-400 text-amber-400" />
              </span>
            ) : ' No ratings yet'}
          </p>
        </div>
        {isAuthenticated && user?.id !== listing.seller_id && !hasReviewed && (
          <Button 
            onClick={() => setShowReviewModal(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm"
          >
            <Star className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar
                  src={review.reviewer_avatar}
                  name={review.reviewer_name}
                  size="lg"
                  className="w-10 h-10 border border-violet-500/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground">{review.reviewer_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  {review.listing_title && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Reviewed for: {review.listing_title}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  
                  {/* Seller Response */}
                  {review.seller_response && (
                    <div className="mt-3 pl-4 border-l-2 border-violet-500/50 bg-muted/20 py-2 rounded-r-lg">
                      <p className="text-xs text-violet-500 font-semibold mb-1">Seller Response:</p>
                      <p className="text-sm text-muted-foreground">{review.seller_response}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-card rounded-xl border border-border">
          <Star className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No reviews yet</p>
          {isAuthenticated && user?.id !== listing.seller_id && (
            <Button 
              className="mt-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs"
              onClick={() => setShowReviewModal(true)}
            >
              Be the first to review
            </Button>
          )}
        </div>
      )}
    </section>
  );

  const renderRelatedListings = () => {
    if (relatedListings.length === 0) return null;
    return (
      <section className="w-full mt-6 sm:mt-10">
        <h2 className="text-xl sm:text-2xl font-black text-foreground mb-6">Related Ads</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedListings.map((item) => (
            <ProductCard key={item.id} listing={item} />
          ))}
        </div>
      </section>
    );
  };

  const renderSellerListings = () => {
    if (sellerListings.length === 0) return null;
    return (
      <section className="w-full mt-6 sm:mt-10">
        <h2 className="text-xl sm:text-2xl font-black text-foreground mb-6">Seller's Completed Sales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sellerListings.map((item) => (
            <ProductCard key={item.id} listing={item} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Ad ID:</span>
            <code className="bg-muted px-2 py-1 rounded font-mono font-medium text-foreground">{listing.id.slice(0, 8)}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAdId} title="Copy Ad ID">
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout (>= 1024px): 2 Independent Vertical Columns (Zero Row Height Coupling) */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-start">
          {/* Left Column (col-span-7): Image -> Description -> Specs -> Google Maps */}
          <div className="col-span-7 flex flex-col space-y-6">
            {renderGallery()}
            {renderDescription()}
            {renderSpecifications()}
            {renderLocationMap()}
          </div>

          {/* Right Column (col-span-5): Title/Price -> Contact/Buy -> Safety -> Seller Info */}
          <div className="col-span-5 flex flex-col space-y-4">
            {renderTitlePrice()}
            {renderContactBuy()}
            {renderSafetyTips()}
            {renderSellerCard()}
          </div>

          {/* Bottom Full-Width Sections */}
          <div className="col-span-12 space-y-8 mt-6">
            {renderReviews()}
            {renderRelatedListings()}
            {renderSellerListings()}
          </div>
        </div>

        {/* Mobile / Tablet Layout (< 1024px): Single Vertical Stack in exact required sequence */}
        <div className="flex lg:hidden flex-col space-y-4">
          {renderGallery()}
          {renderTitlePrice()}
          {renderContactBuy()}
          {renderSafetyTips()}
          {renderDescription()}
          {renderSpecifications()}
          {renderLocationMap()}
          {renderSellerCard()}
          {renderReviews()}
          {renderRelatedListings()}
          {renderSellerListings()}
        </div>

      </div>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this Ad</DialogTitle>
            <DialogDescription>
              Help us keep Game Gear Swap safe. Your report is anonymous.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for reporting *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fake_deal">Fake deal / Misleading price</SelectItem>
                  <SelectItem value="fake_sale">Fake sale / Non-existent product</SelectItem>
                  <SelectItem value="stolen_photos">Stolen photos / Copied ad</SelectItem>
                  <SelectItem value="counterfeit">Counterfeit or pirated goods</SelectItem>
                  <SelectItem value="scam">Suspected scam / Advance fee fraud</SelectItem>
                  <SelectItem value="prohibited">Prohibited or illegal item</SelectItem>
                  <SelectItem value="duplicate">Duplicate listing</SelectItem>
                  <SelectItem value="wrong_category">Wrong category / spam</SelectItem>
                  <SelectItem value="other">Other issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Additional details (optional)</Label>
                <span className={`text-xs ${reportDetails.length >= FIELD_LIMITS.REPORT_DETAILS ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                  {reportDetails.length} / {FIELD_LIMITS.REPORT_DETAILS}
                </span>
              </div>
              <Textarea
                placeholder="Provide more details about the issue..."
                value={reportDetails}
                maxLength={FIELD_LIMITS.REPORT_DETAILS}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReport}
              disabled={reportLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {reportLoading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with this seller
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-300'}`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {reviewRating === 1 && 'Poor'}
                  {reviewRating === 2 && 'Fair'}
                  {reviewRating === 3 && 'Good'}
                  {reviewRating === 4 && 'Very Good'}
                  {reviewRating === 5 && 'Excellent'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Your Review *</Label>
                <span className={`text-xs ${reviewComment.length >= FIELD_LIMITS.REVIEW_COMMENT ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                  {reviewComment.length} / {FIELD_LIMITS.REVIEW_COMMENT}
                </span>
              </div>
              <Textarea
                placeholder="Tell others about your experience with this seller..."
                value={reviewComment}
                maxLength={FIELD_LIMITS.REVIEW_COMMENT}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={reviewLoading || !reviewComment.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {reviewLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
