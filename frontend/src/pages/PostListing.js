import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { getDistricts, getTaluks, getAreas, formatLocation } from '../lib/keralaLocations';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Upload, 
  X, 
  Loader2, 
  CreditCard,
  IndianRupee,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const LISTING_FEE = 10;

export default function PostListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [createdListing, setCreatedListing] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [itemType, setItemType] = useState('physical');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState('');
  const [priceType, setPriceType] = useState('fixed');
  const [price, setPrice] = useState('');
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  
  // Images
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  
  // Location - Kerala Hierarchy
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [area, setArea] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  
  // Contact
  const [contactPhone, setContactPhone] = useState(user?.phone?.replace('+91', '') || '');
  const [contactMethod, setContactMethod] = useState('both');
  const [hidePhoneNumber, setHidePhoneNumber] = useState(false);

  // Derived location data
  const districts = getDistricts();
  const taluks = district ? getTaluks(district) : [];
  const areas = district && taluk ? getAreas(district, taluk) : [];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecification = (index, field, value) => {
    setSpecifications(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return false;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return false;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      return false;
    }
    if (!condition) {
      toast.error('Please select the condition');
      return false;
    }
    if (priceType !== 'free' && !price) {
      toast.error('Please enter a price');
      return false;
    }
    if (images.length < 1) {
      toast.error('Please upload at least 1 image');
      return false;
    }
    if (!district) {
      toast.error('Please select a district');
      return false;
    }
    if (!taluk) {
      toast.error('Please select a sub-district (taluk)');
      return false;
    }
    if (!contactPhone || contactPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Upload images
      let uploadedImageUrls = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrls.push(`${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`);
      }

      // Filter empty specs
      const validSpecs = specifications.filter(s => s.key && s.value);

      // Format full location
      const fullLocation = formatLocation(district, taluk, area);

      // Create listing
      const listingRes = await api.post('/listings', {
        title,
        description,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        price: priceType === 'free' ? 0 : parseFloat(price),
        price_type: priceType,
        condition,
        item_type: itemType,
        location: fullLocation,
        location_district: district,
        location_taluk: taluk,
        location_area: area || null,
        address_details: addressDetails || null,
        contact_phone: `+91${contactPhone}`,
        contact_method: contactMethod,
        hide_phone: hidePhoneNumber,
        images: uploadedImageUrls,
        specifications: validSpecs,
        brand: brand || null,
        model: model || null,
      });

      setCreatedListing(listingRes.data);
      setShowPaymentModal(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (method) => {
    setPaymentLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Complete payment
      await api.post(`/payments/complete`, {
        listing_id: createdListing.id,
        payment_method: method
      });
      
      toast.success('Payment successful! Your ad is now live.');
      setShowPaymentModal(false);
      navigate(`/listing/${createdListing.id}`);
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black">Post Your Ad</h1>
          <p className="text-muted-foreground mt-1">
            List your gaming gear and reach thousands of buyers in Kerala
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Details */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6">Basic Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Ad Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., RTX 4080 Super - Like New with Box"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="listing-title-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail - include specs, usage history, reason for selling, any defects..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  data-testid="listing-description-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(''); }}>
                    <SelectTrigger data-testid="listing-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory?.subcategories?.length > 0 && (
                  <div className="space-y-2">
                    <Label>Subcategory</Label>
                    <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategory.subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Type *</Label>
                <RadioGroup value={itemType} onValueChange={setItemType} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="physical" id="physical" />
                    <Label htmlFor="physical" className="cursor-pointer">Physical Item</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="digital" id="digital" />
                    <Label htmlFor="digital" className="cursor-pointer">Digital Item / Account</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6">Product Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., NVIDIA, Sony, Logitech"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., GeForce RTX 4080, PS5 Slim"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Condition *</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger data-testid="listing-condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New (Sealed)</SelectItem>
                    <SelectItem value="Like New">Like New (Open Box)</SelectItem>
                    <SelectItem value="Excellent">Excellent (Minor scratches)</SelectItem>
                    <SelectItem value="Good">Good (Visible wear)</SelectItem>
                    <SelectItem value="Fair">Fair (Heavy use)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Type *</Label>
                <RadioGroup value={priceType} onValueChange={setPriceType} className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="cursor-pointer">Fixed Price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="negotiable" id="negotiable" />
                    <Label htmlFor="negotiable" className="cursor-pointer">Negotiable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exchange" id="exchange" />
                    <Label htmlFor="exchange" className="cursor-pointer">Exchange</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free" className="cursor-pointer">Free</Label>
                  </div>
                </RadioGroup>
              </div>

              {priceType !== 'free' && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Enter price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="1"
                    data-testid="listing-price-input"
                  />
                </div>
              )}

              {/* Specifications */}
              <div className="space-y-2">
                <Label>Specifications (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Add details like CPU, RAM, Storage, etc.</p>
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key (e.g., CPU)"
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (e.g., AMD Ryzen 7)"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    {specifications.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removeSpecification(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Specification
                </Button>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">Images *</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload 1-5 clear images. First image will be the cover photo.
            </p>
            <div className="flex flex-wrap gap-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative w-28 h-28 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded">
                      Cover
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-4 h-4 text-white" />
                  </Button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-28 h-28 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 hover:bg-violet-500/5 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    data-testid="listing-image-input"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6">Location</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger data-testid="listing-district">
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
                  <Label>Sub-District (Taluk) *</Label>
                  <Select key={`taluk-${district}`} value={taluk ? taluk : undefined} onValueChange={setTaluk} disabled={!district}>
                    <SelectTrigger data-testid="listing-taluk">
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
                  <Label>Village / Town / Municipality</Label>
                  <Select key={`area-${taluk}`} value={area ? area : undefined} onValueChange={setArea} disabled={!taluk}>
                    <SelectTrigger data-testid="listing-area">
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

              <div className="space-y-2">
                <Label htmlFor="address">Address Details (Optional)</Label>
                <Input
                  id="address"
                  placeholder="Landmark, building name, etc."
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number *</Label>
                <div className="flex gap-2">
                  <Input value="+91" disabled className="w-16" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    data-testid="listing-phone-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>How buyers can contact you *</Label>
                <RadioGroup value={contactMethod} onValueChange={setContactMethod} className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone-only" />
                    <Label htmlFor="phone-only" className="cursor-pointer">Phone / WhatsApp Only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="chat" id="chat-only" />
                    <Label htmlFor="chat-only" className="cursor-pointer">GGS Chat Only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="cursor-pointer">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hidePhone" 
                  checked={hidePhoneNumber}
                  onCheckedChange={setHidePhoneNumber}
                />
                <label htmlFor="hidePhone" className="text-sm cursor-pointer">
                  Hide my phone number from public view (only show to logged-in users)
                </label>
              </div>
            </div>
          </div>

          {/* Listing Fee Notice */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Listing Fee: ₹{LISTING_FEE}</p>
                <p className="text-sm text-muted-foreground">
                  One-time fee to publish your ad. Your ad will be live for 60 days.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-lg"
            disabled={loading}
            data-testid="listing-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Ad...
              </>
            ) : (
              <>
                Continue to Payment (₹{LISTING_FEE})
                <CreditCard className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Pay ₹{LISTING_FEE} to publish your ad
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Listing Fee</span>
                <span className="font-mono font-bold">₹{LISTING_FEE}.00</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-bold">Total</span>
                <span className="font-mono font-bold text-lg text-violet-500">₹{LISTING_FEE}.00</span>
              </div>
            </div>

            <p className="text-sm font-medium mb-3">Select Payment Method:</p>
            <div className="space-y-2">
              {['upi', 'card', 'netbanking'].map((method) => (
                <Button
                  key={method}
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handlePayment(method)}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {method === 'upi' ? 'UPI (GPay, PhonePe, Paytm)' : method === 'card' ? 'Credit / Debit Card' : 'Net Banking'}
                </Button>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <strong>Test Mode:</strong> This is a mock payment for development. Click any option to simulate payment.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
