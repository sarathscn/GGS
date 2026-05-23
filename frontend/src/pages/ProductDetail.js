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
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && listing?.id) {
      checkWishlist();
    }
  }, [isAuthenticated, listing?.id]);

  useEffect(() => {
    if (listing) {
      fetchRelatedListings();
      fetchSellerListings();
      fetchReviews();
    }
  }, [listing]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      setListing(response.data);
    } catch (error) {
      toast.error('Listing not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/listing/${listing.id}`);
      setReviews(response.data);
      // Check if user has already reviewed
      if (user) {
        const userReview = response.data.find(r => r.reviewer_id === user.id);
        setHasReviewed(!!userReview);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchRelatedListings = async () => {
    try {
      const response = await api.get(`/listings?category=${listing.category_id}&limit=4`);
      setRelatedListings(response.data.filter(l => l.id !== listing.id).slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch related listings:', error);
    }
  };

  const fetchSellerListings = async () => {
    try {
      const response = await api.get(`/sellers/${listing.seller_id}/listings`);
      setSellerListings(response.data.filter(l => l.id !== listing.id && l.status === 'sold').slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch seller listings:', error);
    }
  };

  const checkWishlist = async () => {
    try {
      const response = await api.get(`/wishlist/check/${listing.id}`);
      setInWishlist(response.data.in_wishlist);
    } catch (error) {
      console.error('Failed to check wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
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
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
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

  const conditionColors = {
    'New': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Like New': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Excellent': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    'Good': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Fair': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  const handleShare = async () => {
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
    navigator.clipboard.writeText(listing.id);
    toast.success('Ad ID copied!');
  };

  const getPhoneForDisplay = () => {
    if (listing.hide_phone && !isAuthenticated) {
      return 'Login to view';
    }
    return listing.contact_phone;
  };

  const openWhatsApp = () => {
    const phone = listing.contact_phone.replace('+', '');
    const message = encodeURIComponent(`Hi, I'm interested in your listing "${listing.title}" on Game Gear Swap.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const startChat = () => {
    if (!isAuthenticated) {
      toast.error('Please login to chat');
      navigate('/login');
      return;
    }
    navigate(`/messages?listing=${listing.id}&seller=${listing.seller_id}`);
  };

  // Generate Google Map URL
  const getMapUrl = () => {
    const location = listing.location_area || listing.location_taluk || listing.location_district || listing.location;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location + ', Kerala, India')}`;
  };

  const getMapEmbedUrl = () => {
    const location = listing.location_area || listing.location_taluk || listing.location_district || listing.location;
    const bbox = '74.8,8.2,77.5,12.8'; // Kerala bounding box
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=10.5,76.2`;
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-6 bg-muted rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-10 bg-muted rounded w-1/3"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Listing Not Found</h2>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images?.length > 0 
    ? listing.images 
    : ['https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800'];

  const showPhone = listing.contact_method === 'phone' || listing.contact_method === 'both';
  const showChat = listing.contact_method === 'chat' || listing.contact_method === 'both';

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Ad ID:</span>
            <code className="bg-muted px-2 py-1 rounded font-mono">{listing.id.slice(0, 8)}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAdId}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {listing.featured && (
                <Badge className="absolute top-4 left-4 bg-violet-600 text-white">
                  Featured
                </Badge>
              )}

              {listing.status === 'sold' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge className="bg-red-500 text-white text-lg px-4 py-2">SOLD</Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImage === index ? 'border-violet-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className={`flex-1 ${
                  inWishlist 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-violet-600 hover:bg-violet-700'
                }`}
                onClick={toggleWishlist}
                data-testid="wishlist-toggle-btn"
              >
                <Heart className={`w-5 h-5 mr-2 ${inWishlist ? 'fill-current' : ''}`} />
                {inWishlist ? 'Saved' : 'Save'}
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="flex-1 text-red-500 hover:text-red-600"
                onClick={() => setShowReportModal(true)}
              >
                <Flag className="w-5 h-5 mr-2" />
                Report
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category & Condition */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link to={`/category/${listing.category_id}`}>
                <Badge variant="outline" className="hover:bg-muted">
                  <Tag className="w-3 h-3 mr-1" />
                  {listing.category_name}
                </Badge>
              </Link>
              <Badge variant="outline" className={conditionColors[listing.condition] || ''}>
                {listing.condition}
              </Badge>
              {listing.seller_verified && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Seller
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black" data-testid="listing-title">
              {listing.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <p className="font-mono text-3xl sm:text-4xl font-bold text-violet-500" data-testid="listing-price">
                {listing.price === 0 ? 'FREE' : formatPrice(listing.price)}
              </p>
              {listing.price_type === 'negotiable' && (
                <span className="text-muted-foreground">(Negotiable)</span>
              )}
              {listing.price_type === 'exchange' && (
                <span className="text-muted-foreground">(Exchange)</span>
              )}
            </div>

            {/* Specifications */}
            {listing.specifications?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold">Specifications</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {listing.brand && (
                      <>
                        <span className="text-muted-foreground">Brand</span>
                        <span className="font-medium">{listing.brand}</span>
                      </>
                    )}
                    {listing.model && (
                      <>
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-medium">{listing.model}</span>
                      </>
                    )}
                    {listing.specifications.map((spec, i) => (
                      <React.Fragment key={i}>
                        <span className="text-muted-foreground">{spec.key}</span>
                        <span className="font-medium">{spec.value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-bold">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Location with Map */}
            <div className="space-y-2">
              <h3 className="font-bold">Location</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-violet-500 flex-shrink-0" />
                    <a href={getMapUrl()} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline text-violet-600 dark:text-violet-400">
                      {listing.location}
                    </a>
                  </div>
                  {listing.address_details && (
                    <p className="text-sm text-muted-foreground ml-7">{listing.address_details}</p>
                  )}
                </div>
                {/* OpenStreetMap Embed */}
                <div className="h-48 bg-muted relative">
                  <iframe
                    src={getMapEmbedUrl()}
                    className="w-full h-full border-0"
                    title="Location Map"
                  ></iframe>
                  <a
                    href={getMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-background/90 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-background flex items-center gap-1"
                  >
                    View larger map
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <Link to={`/seller/${listing.seller_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-violet-600/10 flex items-center justify-center overflow-hidden">
                    {listing.seller_avatar ? (
                      <img src={listing.seller_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-violet-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{listing.seller_name}</p>
                      {listing.seller_verified && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">View Profile</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  {listing.views_count} views
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <Calendar className="w-4 h-4" />
                <span>Listed on {formatDate(listing.created_at)}</span>
              </div>

              {/* Contact Options */}
              <div className="space-y-2">
                {showPhone && (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={openWhatsApp}
                      disabled={listing.hide_phone && !isAuthenticated}
                    >
                      <WhatsAppIcon />
                      <span className="ml-2">WhatsApp</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        if (listing.hide_phone && !isAuthenticated) {
                          navigate('/login');
                        } else {
                          window.location.href = `tel:${listing.contact_phone}`;
                        }
                      }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {getPhoneForDisplay()}
                    </Button>
                  </div>
                )}
                {showChat && (
                  <Button className="w-full" variant="outline" onClick={startChat}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Seller
                  </Button>
                )}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-600 dark:text-amber-400 mb-2">Your safety matters to us!</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Only meet in public / crowded places.</li>
                    <li>• Never go alone to meet a buyer / seller, always take someone with you.</li>
                    <li>• Check and inspect the product properly before purchasing it.</li>
                    <li>• Never pay anything in advance or transfer money before inspecting the product.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Edit Button (for owner) */}
            {user && listing.seller_id === user.id && (
              <div className="flex gap-2">
                <Link to={`/edit-listing/${listing.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Edit Listing
                  </Button>
                </Link>
                {listing.status === 'active' && (
                  <Button 
                    variant="outline" 
                    className="text-emerald-500 hover:text-emerald-600"
                    onClick={async () => {
                      try {
                        await api.post(`/listings/${listing.id}/mark-sold`);
                        toast.success('Listing marked as sold');
                        fetchListing();
                      } catch (error) {
                        toast.error('Failed to update listing');
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Sold
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Listings */}
        {relatedListings.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl sm:text-2xl font-black mb-6">Related Ads</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedListings.map((item) => (
                <ProductCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}

        {/* Seller's Completed Ads */}
        {sellerListings.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl sm:text-2xl font-black mb-6">Seller's Completed Sales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sellerListings.map((item) => (
                <ProductCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}

        {/* Seller Reviews Section */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black">Seller Reviews</h2>
              <p className="text-sm text-muted-foreground">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''} • 
                {listing.seller_rating > 0 ? (
                  <span className="ml-1">
                    {listing.seller_rating.toFixed(1)} <Star className="w-3 h-3 inline fill-amber-400 text-amber-400" />
                  </span>
                ) : ' No ratings yet'}
              </p>
            </div>
            {isAuthenticated && user?.id !== listing.seller_id && !hasReviewed && (
              <Button 
                onClick={() => setShowReviewModal(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {review.reviewer_avatar ? (
                        <img src={review.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-violet-500">{review.reviewer_name?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{review.reviewer_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                      {review.listing_title && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Reviewed for: {review.listing_title}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      
                      {/* Seller Response */}
                      {review.seller_response && (
                        <div className="mt-3 pl-4 border-l-2 border-violet-500/50">
                          <p className="text-xs text-violet-500 font-medium mb-1">Seller Response:</p>
                          <p className="text-sm text-muted-foreground">{review.seller_response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reviews yet</p>
              {isAuthenticated && user?.id !== listing.seller_id && (
                <Button 
                  className="mt-4 bg-violet-600 hover:bg-violet-700"
                  onClick={() => setShowReviewModal(true)}
                >
                  Be the first to review
                </Button>
              )}
            </div>
          )}
        </section>
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
                  <SelectItem value="fake">Fake or misleading</SelectItem>
                  <SelectItem value="scam">Suspected scam</SelectItem>
                  <SelectItem value="prohibited">Prohibited item</SelectItem>
                  <SelectItem value="offensive">Offensive content</SelectItem>
                  <SelectItem value="duplicate">Duplicate listing</SelectItem>
                  <SelectItem value="wrong_category">Wrong category</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea
                placeholder="Provide more details about the issue..."
                value={reportDetails}
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
              <Label>Your Review *</Label>
              <Textarea
                placeholder="Tell others about your experience with this seller..."
                value={reviewComment}
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
