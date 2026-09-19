import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Avatar from '../components/Avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Star, MapPin, CheckCircle, Calendar, Package, ArrowLeft } from 'lucide-react';

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, [id]);

  const fetchSellerData = async () => {
    try {
      const response = await api.get(`/sellers/${id}`);
      setSeller(response.data.seller);
      setListings(response.data.listings);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Failed to fetch seller:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Seller Not Found</h2>
          <Link to="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>

        {/* Seller Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar
              src={seller.avatar}
              name={seller.name}
              size="2xl"
              className="w-20 h-20 border-2 border-violet-500/30 shadow-md text-3xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-black">{seller.name}</h1>
                {seller.is_seller_verified && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              {seller.bio && (
                <p className="text-muted-foreground mb-4">{seller.bio}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {seller.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{seller.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatDate(seller.created_at)}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>{listings.length} active listings</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(seller.rating_avg)
                          ? 'text-amber-500 fill-current'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold">{seller.rating_avg?.toFixed(1) || '0.0'}</span>
                <span className="text-muted-foreground">({seller.rating_count || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Listings by {seller.name}</h2>
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="h-full min-w-0">
                  <ProductCard listing={listing} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active listings</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-bold mb-6">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={review.reviewer_avatar}
                      name={review.reviewer_name}
                      size="lg"
                      className="w-10 h-10 border border-violet-500/20"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{review.reviewer_name}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-amber-500 fill-current'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
