import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { getDistricts, getTaluks, getAreas, formatLocation, getKeralaCoordinates } from '../lib/keralaLocations';
import { isDigitalCategory, getItemTypeForCategory, getMaxSpecificationsForCategory } from '../lib/categoryUtils';
import { FIELD_LIMITS, validateFieldLength } from '../lib/fieldLimits';
import { 
  BASE_LISTING_SERVICE_CHARGE, 
  DEFAULT_GST_PERCENTAGE, 
  REFUND_POLICY_VERSION, 
  calculateListingPayment 
} from '../lib/pricingUtils';
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
import GoogleMapLocation from '../components/GoogleMapLocation';
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

const MAX_PRICE = 1000000;

export default function PostListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [createdListing, setCreatedListing] = useState(null);
  const [gstPercentage, setGstPercentage] = useState(DEFAULT_GST_PERCENTAGE);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const pricing = calculateListingPayment({ 
    baseFee: BASE_LISTING_SERVICE_CHARGE, 
    gstPercentage 
  });

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
  
  // Location - Kerala Hierarchy & Coordinates
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [area, setArea] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  
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

  const selectedCategory = categories.find((c) => c.id === categoryId || c.slug === categoryId);
  const maxSpecifications = getMaxSpecificationsForCategory(selectedCategory);

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
    const currentMax = getMaxSpecificationsForCategory(selectedCategory);
    if (specifications.length >= currentMax) {
      toast.warning(`Maximum ${currentMax} specifications allowed for ${selectedCategory?.name || 'this category'}`);
      return;
    }
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

  const handleCategoryChange = (newCatId) => {
    setCategoryId(newCatId);
    setSubcategoryId('');
    const cat = categories.find((c) => c.id === newCatId || c.slug === newCatId);
    const autoItemType = getItemTypeForCategory(cat);
    setItemType(autoItemType);

    const newMaxSpecs = getMaxSpecificationsForCategory(cat);
    if (specifications.length > newMaxSpecs) {
      setSpecifications(prev => prev.slice(0, newMaxSpecs));
      toast.info(`Specifications adjusted to maximum of ${newMaxSpecs} for ${cat?.name || 'selected category'}`);
    }
  };

  const validateForm = () => {
    const titleCheck = validateFieldLength(title, FIELD_LIMITS.TITLE, true, 'Ad title');
    if (!titleCheck.valid) {
      toast.error(titleCheck.error);
      return false;
    }
    const descCheck = validateFieldLength(description, FIELD_LIMITS.DESCRIPTION, true, 'Description');
    if (!descCheck.valid) {
      toast.error(descCheck.error);
      return false;
    }
    if (brand && brand.trim().length > FIELD_LIMITS.BRAND) {
      toast.error(`Brand cannot exceed ${FIELD_LIMITS.BRAND} characters`);
      return false;
    }
    if (model && model.trim().length > FIELD_LIMITS.MODEL) {
      toast.error(`Model cannot exceed ${FIELD_LIMITS.MODEL} characters`);
      return false;
    }
    if (addressDetails && addressDetails.trim().length > FIELD_LIMITS.LOCATION_ADDRESS) {
      toast.error(`Address details cannot exceed ${FIELD_LIMITS.LOCATION_ADDRESS} characters`);
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
    const currentMaxSpecs = getMaxSpecificationsForCategory(selectedCategory);
    const validSpecs = specifications.filter(s => s && (s.key || s.value));
    if (validSpecs.length > currentMaxSpecs) {
      toast.error(`Maximum ${currentMaxSpecs} specifications allowed for ${selectedCategory?.name || 'this category'}`);
      return false;
    }
    if (priceType !== 'free') {
      const numPrice = parseFloat(price);
      if (!price || isNaN(numPrice) || numPrice <= 0) {
        toast.error('Please enter a valid price');
        return false;
      }
      if (numPrice > MAX_PRICE) {
        toast.error('Maximum price allowed is ₹10,00,000');
        return false;
      }
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

      // Filter empty specs and ensure within category limit
      const currentMaxSpecs = getMaxSpecificationsForCategory(selectedCategory);
      const validSpecs = specifications
        .filter(s => s && s.key && s.value)
        .slice(0, currentMaxSpecs);

      // Compute canonical item type directly from category
      const resolvedItemType = getItemTypeForCategory(selectedCategory);

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
        item_type: resolvedItemType,
        location: fullLocation,
        location_district: district,
        location_taluk: taluk,
        location_area: area || null,
        address_details: addressDetails || null,
        latitude: latitude !== null && latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== null && longitude !== undefined ? Number(longitude) : null,
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
    if (!policyAccepted) {
      toast.error('Please acknowledge and accept the No-Refund Policy before proceeding.');
      return;
    }

    setPaymentLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Complete payment with authoritative breakdown and policy acknowledgement
      await api.post(`/payments/complete`, {
        listing_id: createdListing.id,
        payment_method: method,
        gst_percentage: pricing.gstPercentage,
        policy_accepted: true,
        submitted_amount: pricing.totalAmount,
        submitted_fee: pricing.baseFee
      });
      
      toast.success('Payment successful! Your ad is now live.');
      setShowPaymentModal(false);
      navigate(`/listing/${createdListing.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed. Please try again.');
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
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold mb-2">Basic Details</h2>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Ad Title *</Label>
                <span className={`text-xs ${title.length >= FIELD_LIMITS.TITLE ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                  {title.length} / {FIELD_LIMITS.TITLE}
                </span>
              </div>
              <Input
                id="title"
                placeholder="e.g., RTX 4080 Super - Like New with Box"
                value={title}
                maxLength={FIELD_LIMITS.TITLE}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="listing-title-input"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description *</Label>
                <span className={`text-xs ${description.length >= FIELD_LIMITS.DESCRIPTION ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                  {description.length} / {FIELD_LIMITS.DESCRIPTION}
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Describe your item in detail - include specs, usage history, reason for selling, any defects..."
                value={description}
                maxLength={FIELD_LIMITS.DESCRIPTION}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                data-testid="listing-description-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={categoryId} onValueChange={handleCategoryChange} required>
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
                    <SelectTrigger data-testid="listing-subcategory">
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
          </div>

          {/* Product Details */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold mb-2">Product Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., NVIDIA, Sony, Logitech"
                  value={brand}
                  maxLength={FIELD_LIMITS.BRAND}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., GeForce RTX 4080, PS5 Slim"
                  value={model}
                  maxLength={FIELD_LIMITS.MODEL}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Condition *</Label>
              <Select value={condition} onValueChange={setCondition} required>
                <SelectTrigger data-testid="listing-condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brand New">Brand New (Sealed)</SelectItem>
                  <SelectItem value="Like New">Like New (Mint)</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good (Minor wear)</SelectItem>
                  <SelectItem value="Fair">Fair (Functional)</SelectItem>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <span className="text-xs text-muted-foreground">Max ₹10,00,000</span>
                </div>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || Number(val) >= 0) {
                      if (Number(val) <= MAX_PRICE) {
                        setPrice(val);
                      } else {
                        toast.error('Maximum price allowed is ₹10,00,000');
                      }
                    }
                  }}
                  min="1"
                  max={MAX_PRICE}
                  required
                  data-testid="listing-price-input"
                />
                {price && Number(price) > MAX_PRICE && (
                  <p className="text-xs text-destructive">
                    Maximum price allowed is ₹10,00,000
                  </p>
                )}
              </div>
            )}

            {/* Specifications */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label>Specifications (Optional)</Label>
                <span className="text-xs font-medium text-muted-foreground" data-testid="specifications-counter">
                  Specifications: {specifications.length} / {maxSpecifications}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Add details like CPU, RAM, Storage, etc. (Max {maxSpecifications} for {selectedCategory?.name || 'this category'})
              </p>
              {specifications.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Key (e.g., CPU)"
                    value={spec.key}
                    maxLength={FIELD_LIMITS.SPEC_KEY}
                    onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g., AMD Ryzen 7)"
                    value={spec.value}
                    maxLength={FIELD_LIMITS.SPEC_VALUE}
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
              {specifications.length < maxSpecifications && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpecification}
                  disabled={specifications.length >= maxSpecifications}
                  data-testid="add-specification-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Specification
                </Button>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
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
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold mb-2">Location Details</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Select your Kerala administrative division and pinpoint exact coordinates
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="space-y-2">
                  <div className="min-h-[2.5rem] flex items-end">
                    <Label className="font-semibold text-sm leading-tight">District *</Label>
                  </div>
                  <Select 
                    value={district} 
                    onValueChange={(val) => {
                      setDistrict(val);
                      setTaluk('');
                      setArea('');
                      const coords = getKeralaCoordinates(val, '', '');
                      if (coords) {
                        setLatitude(coords.lat);
                        setLongitude(coords.lng);
                      }
                    }}
                    required
                  >
                    <SelectTrigger className="h-10 w-full" data-testid="listing-district">
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
                  <div className="min-h-[2.5rem] flex items-end">
                    <Label className="font-semibold text-sm leading-tight">Sub-District (Taluk) *</Label>
                  </div>
                  <Select 
                    key={`taluk-${district}`} 
                    value={taluk ? taluk : undefined} 
                    onValueChange={(val) => {
                      setTaluk(val);
                      setArea('');
                      const coords = getKeralaCoordinates(district, val, '');
                      if (coords) {
                        setLatitude(coords.lat);
                        setLongitude(coords.lng);
                      }
                    }} 
                    disabled={!district}
                    required
                  >
                    <SelectTrigger className="h-10 w-full" data-testid="listing-taluk">
                      <SelectValue placeholder={district ? "Select taluk" : "Select district first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {taluks.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="min-h-[2.5rem] flex items-end">
                    <Label className="font-semibold text-sm leading-tight">Village / Town / Municipality</Label>
                  </div>
                  <Select 
                    key={`area-${taluk}`} 
                    value={area ? area : undefined} 
                    onValueChange={(val) => {
                      setArea(val);
                      const coords = getKeralaCoordinates(district, taluk, val);
                      if (coords) {
                        setLatitude(coords.lat);
                        setLongitude(coords.lng);
                      }
                    }} 
                    disabled={!taluk}
                  >
                    <SelectTrigger className="h-10 w-full" data-testid="listing-area">
                      <SelectValue placeholder={taluk ? "Select area" : "Select taluk first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Details - Clean Full Width Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[1.5rem]">
                  <Label htmlFor="address" className="font-semibold text-sm">Address Details (Optional)</Label>
                  <span className="text-xs text-muted-foreground">Landmark, building name, etc.</span>
                </div>
                <Input
                  id="address"
                  placeholder="Landmark, building name, etc."
                  value={addressDetails}
                  maxLength={FIELD_LIMITS.LOCATION_ADDRESS}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  className="h-10 w-full"
                />
              </div>

              {/* Google Maps Location Picker */}
              <div className="space-y-2 pt-4 border-t border-border/60">
                <Label className="font-semibold text-sm">Pinpoint Location on Google Maps</Label>
                <GoogleMapLocation
                  interactive={true}
                  latitude={latitude}
                  longitude={longitude}
                  districtName={district}
                  talukName={taluk}
                  areaName={area}
                  locationName={formatLocation(district, taluk, area)}
                  addressDetails={addressDetails}
                  onChange={(data) => {
                    if (!data) return;
                    if (data.latitude !== undefined && data.latitude !== null && Number.isFinite(Number(data.latitude))) {
                      setLatitude(Number(data.latitude));
                    }
                    if (data.longitude !== undefined && data.longitude !== null && Number.isFinite(Number(data.longitude))) {
                      setLongitude(Number(data.longitude));
                    }
                    if (data.address) {
                      setAddressDetails(data.address);
                    }

                    // If verified inside Kerala
                    if (data.isKerala && data.district && districts.includes(data.district)) {
                      setDistrict(data.district);
                      const availableTaluks = getTaluks(data.district);
                      if (data.taluk && availableTaluks.includes(data.taluk)) {
                        setTaluk(data.taluk);
                        const availableAreas = getAreas(data.district, data.taluk);
                        if (data.area && availableAreas.includes(data.area)) {
                          setArea(data.area);
                        } else {
                          setArea('');
                        }
                      } else if (availableTaluks.length > 0) {
                        const matchedTaluk = availableTaluks.find(t => 
                          (data.address && data.address.toLowerCase().includes(t.toLowerCase())) ||
                          (data.taluk && data.taluk.toLowerCase().includes(t.toLowerCase()))
                        );
                        if (matchedTaluk) {
                          setTaluk(matchedTaluk);
                          const availableAreas = getAreas(data.district, matchedTaluk);
                          const matchedArea = availableAreas.find(a => 
                            (data.address && data.address.toLowerCase().includes(a.toLowerCase())) ||
                            (data.area && data.area.toLowerCase().includes(a.toLowerCase()))
                          );
                          setArea(matchedArea || '');
                        } else {
                          setTaluk('');
                          setArea('');
                        }
                      } else {
                        setTaluk('');
                        setArea('');
                      }
                    } else {
                      // Outside Kerala -> clear stale district, taluk, and area
                      setDistrict('');
                      setTaluk('');
                      setArea('');
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold mb-2">Contact Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Mobile Number *</Label>
                <div className="flex gap-2">
                  <Input
                    value="+91"
                    disabled
                    className="w-16 text-center font-mono"
                  />
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    data-testid="listing-phone-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>How buyers can contact you *</Label>
                <Select value={contactMethod} onValueChange={setContactMethod}>
                  <SelectTrigger data-testid="listing-contact-method">
                    <SelectValue placeholder="Select contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Chat & Phone</SelectItem>
                    <SelectItem value="chat">In-App Chat Only</SelectItem>
                    <SelectItem value="phone">Phone Call Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="hide-phone"
                checked={hidePhoneNumber}
                onCheckedChange={setHidePhoneNumber}
              />
              <label
                htmlFor="hide-phone"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Hide my phone number from public ad (buyers contact via in-app chat)
              </label>
            </div>
          </div>

          {/* Listing Service Charge Notice Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-violet-600/20">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-base text-foreground">
                    Listing Service Charge: {pricing.formattedBaseFee}
                  </p>
                  <span className="text-xs bg-violet-500/10 text-violet-500 font-semibold px-2.5 py-1 rounded-md border border-violet-500/20">
                    Payable with GST ({pricing.gstPercentage}%): {pricing.formattedTotal}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  This nominal listing service charge ({pricing.formattedTotalWithGst}) helps us maintain the marketplace, reduce spam and unwanted posts, and provide an ad-free experience.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-lg font-semibold shadow-lg shadow-violet-600/20"
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
                Continue to Payment ({pricing.formattedTotal})
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
              Listing service charge breakdown & confirmation
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* Payment Breakdown Card */}
            <div className="bg-muted/60 border border-border rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Listing Service Charge</span>
                <span className="font-mono font-semibold">{pricing.formattedBaseFee}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">GST ({pricing.gstPercentage}%)</span>
                <span className="font-mono font-semibold">{pricing.formattedGstAmount}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-border">
                <span className="font-bold text-base">Amount Payable</span>
                <span className="font-mono font-bold text-xl text-violet-500" data-testid="payment-total-amount">
                  {pricing.formattedTotal}
                </span>
              </div>
            </div>

            {/* Anti-spam & Ad-free explanation */}
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
              The listing service charge consists of a base service charge of {pricing.formattedBaseFee} plus {pricing.gstPercentage}% GST ({pricing.formattedGstAmount}), totaling {pricing.formattedTotal}. This helps maintain the marketplace, reduce spam, and keep GGS ad-free.
            </div>

            {/* No Refund Policy Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>No Refund Policy</span>
              </div>
              <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                The {pricing.formattedTotal} listing service charge ({pricing.formattedBaseFee} + {pricing.gstPercentage}% GST) is strictly non-refundable once payment is completed. No refund will be provided if your listing is deleted by you, expires, is removed by an administrator/moderator, or violates marketplace rules.
              </p>
            </div>

            {/* Policy Acknowledgement Checkbox */}
            <div className="flex items-start space-x-2 pt-1">
              <Checkbox
                id="no-refund-acknowledgement"
                checked={policyAccepted}
                onCheckedChange={setPolicyAccepted}
                data-testid="no-refund-checkbox"
              />
              <label
                htmlFor="no-refund-acknowledgement"
                className="text-xs text-muted-foreground leading-tight cursor-pointer select-none"
              >
                I understand that the {pricing.formattedTotal} listing service charge ({pricing.formattedBaseFee} + {pricing.gstPercentage}% GST) is non-refundable, including if my listing is deleted by me or removed by an administrator.
              </label>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Payment Method:</p>
              <div className="space-y-2">
                {['upi', 'card', 'netbanking'].map((method) => (
                  <Button
                    key={method}
                    variant="outline"
                    className="w-full justify-start h-11"
                    onClick={() => handlePayment(method)}
                    disabled={paymentLoading || !policyAccepted}
                    data-testid={`pay-btn-${method}`}
                  >
                    {paymentLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2 text-violet-500" />
                    )}
                    {method === 'upi' ? 'UPI (GPay, PhonePe, Paytm)' : method === 'card' ? 'Credit / Debit Card' : 'Net Banking'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Support Link */}
            <p className="text-center text-xs text-muted-foreground pt-1">
              Need help with your listing or payment?{' '}
              <Link to="/page/contact" className="text-violet-500 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
