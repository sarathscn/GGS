import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { Upload, X, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getDistricts, getTaluks, getAreas, formatLocation, getKeralaCoordinates } from '../lib/keralaLocations';
import { isDigitalCategory, getItemTypeForCategory, getMaxSpecificationsForCategory } from '../lib/categoryUtils';
import { FIELD_LIMITS, validateFieldLength } from '../lib/fieldLimits';
import GoogleMapLocation from '../components/GoogleMapLocation';

const MAX_PRICE = 1000000;

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [itemType, setItemType] = useState('physical');
  const [priceType, setPriceType] = useState('fixed');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  
  // Location - Kerala Hierarchy & Coordinates
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [area, setArea] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  
  // Derived location data
  const districts = getDistricts();
  const taluks = district ? getTaluks(district) : [];
  const areas = district && taluk ? getAreas(district, taluk) : [];

  const [imageUrls, setImageUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const [listingData, setListingData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [listingRes, categoriesRes] = await Promise.all([
        api.get(`/listings/${id}`),
        api.get('/categories'),
      ]);

      const listing = listingRes.data;
      setListingData(listing);
      
      // Check authorization
      if (listing.seller_id !== user?.id && user?.role !== 'admin') {
        toast.error('Not authorized to edit this listing');
        navigate('/dashboard');
        return;
      }

      const allCategories = categoriesRes.data;
      setCategories(allCategories);

      const loadedCat = allCategories.find((c) => c.id === listing.category_id || c.slug === listing.category_id);
      const initialMaxSpecs = getMaxSpecificationsForCategory(loadedCat || listing.category_id);

      setTitle(listing.title);
      setDescription(listing.description);
      setCategoryId(listing.category_id);
      setSubcategoryId(listing.subcategory_id || '');
      setItemType(getItemTypeForCategory(loadedCat || listing.item_type));
      setPriceType(listing.price_type || 'fixed');
      setPrice(listing.price !== undefined && listing.price !== null ? listing.price.toString() : '');
      setCondition(listing.condition);
      setDistrict(listing.location_district || '');
      setTaluk(listing.location_taluk || '');
      setArea(listing.location_area || '');
      setAddressDetails(listing.address_details || '');
      if (listing.latitude !== undefined && listing.latitude !== null) {
        setLatitude(listing.latitude);
      }
      if (listing.longitude !== undefined && listing.longitude !== null) {
        setLongitude(listing.longitude);
      }
      setImageUrls(listing.images || []);
      
      if (listing.specifications && Array.isArray(listing.specifications) && listing.specifications.length > 0) {
        setSpecifications(listing.specifications.slice(0, initialMaxSpecs));
      } else {
        setSpecifications([{ key: '', value: '' }]);
      }
    } catch (error) {
      toast.error('Failed to load listing');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId || c.slug === categoryId);
  const maxSpecifications = getMaxSpecificationsForCategory(selectedCategory);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageUrls.length + newImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    setNewImages(prev => [...prev, ...files]);
  };

  const removeExistingImage = (index) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user?.role !== 'admin' && !listingData?.free_edit_available) {
      if (listingData?.free_edit_status === 'used') {
        toast.error('Free edit has already been used for this listing');
      } else {
        toast.error('The 24-hour free edit window has expired');
      }
      return;
    }

    const titleCheck = validateFieldLength(title, FIELD_LIMITS.TITLE, true, 'Title');
    if (!titleCheck.valid) {
      toast.error(titleCheck.error);
      return;
    }

    const descCheck = validateFieldLength(description, FIELD_LIMITS.DESCRIPTION, true, 'Description');
    if (!descCheck.valid) {
      toast.error(descCheck.error);
      return;
    }

    if (addressDetails && addressDetails.trim().length > FIELD_LIMITS.LOCATION_ADDRESS) {
      toast.error(`Address details cannot exceed ${FIELD_LIMITS.LOCATION_ADDRESS} characters`);
      return;
    }

    if (!categoryId || !condition || !district || !taluk) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (priceType !== 'free' && priceType !== 'negotiable' && !price) {
      toast.error('Please enter a valid price');
      return;
    }

    let numPrice = 0;
    if (priceType === 'free') {
      numPrice = 0;
    } else if (price) {
      numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        toast.error('Please enter a valid price');
        return;
      }
      if (numPrice > MAX_PRICE) {
        toast.error('Maximum price allowed is ₹10,00,000');
        return;
      }
    }

    const currentMaxSpecs = getMaxSpecificationsForCategory(selectedCategory);
    const validSpecs = specifications
      .filter(s => s && s.key && s.value)
      .slice(0, currentMaxSpecs);

    if (validSpecs.length > currentMaxSpecs) {
      toast.error(`Maximum ${currentMaxSpecs} specifications allowed for ${selectedCategory?.name || 'this category'}`);
      return;
    }

    const resolvedItemType = getItemTypeForCategory(selectedCategory);

    setSaving(true);
    try {
      // Upload new images if any
      let uploadedImageUrls = [...imageUrls];
      for (const image of newImages) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('type', 'post');
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrls.push(`${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`);
      }

      // Format full location
      const fullLocation = formatLocation(district, taluk, area);

      // Update listing
      await api.put(`/listings/${id}`, {
        title,
        description,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        item_type: resolvedItemType,
        specifications: validSpecs,
        price: numPrice,
        price_type: priceType,
        condition,
        location: fullLocation,
        location_district: district,
        location_taluk: taluk,
        location_area: area || null,
        address_details: addressDetails || null,
        latitude: latitude !== null && latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== null && longitude !== undefined ? Number(longitude) : null,
        images: uploadedImageUrls,
      });

      toast.success('Listing updated successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black">Edit Listing</h1>
          <p className="text-muted-foreground mt-1">Update your listing details</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {/* Free Edit Policy Notification Banner */}          {/* Validity & Expiry Info Card */}
          {listingData && (
            <div className="mb-4 p-3 bg-muted/40 border border-border rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Post Validity:</span>
                <span className="text-muted-foreground">{listingData.validity_days || 90} Days Total</span>
              </div>
              <div className="flex items-center gap-3">
                {listingData.published_at && (
                  <span className="text-muted-foreground">
                    Posted: {new Date(listingData.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {listingData.expires_at && (
                  <span className={listingData.is_expired ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    Expires: {new Date(listingData.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {listingData.days_remaining !== undefined && ` (${listingData.days_remaining}d left)`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Edit Allowance Banners */}
          {user?.role === 'admin' ? (
            <div className="mb-6 p-3.5 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-center gap-2 text-xs text-violet-800 dark:text-violet-300 font-medium">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded">Admin</span>
              <span>Administrative mode: Unrestricted editing capabilities enabled.</span>
            </div>
          ) : listingData?.free_edit_granted && listingData?.free_edit_allowed ? (
            <div className="mb-6 p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl space-y-1 text-xs text-cyan-800 dark:text-cyan-300">
              <div className="flex items-center justify-between font-bold">
                <span>✨ Admin-Granted One-Time Free Edit Allowance Active</span>
                <span className="text-[10px] uppercase font-mono bg-cyan-500/20 px-2 py-0.5 rounded">Approved</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                An administrator approved a one-time free edit for this listing. Saving changes now will apply your updates.
              </p>
            </div>
          ) : listingData?.free_edit_available ? (
            <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center justify-between font-bold">
                <span>✓ 1 Free Edit Available</span>
                <span>{listingData.free_edit_hours_left || 24}h Remaining</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                You receive exactly one free edit during the first 24 hours of posting. Saving changes now will consume this free edit.
              </p>
            </div>
          ) : listingData?.free_edit_status === 'used' ? (
            <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">⚠ One-Time Free Edit Already Used</span>
              <p className="text-muted-foreground text-[11px]">
                Your one-time free edit for this listing has already been consumed. If you require critical changes, you can request an edit allowance via <Link to="/dashboard" className="text-violet-600 dark:text-violet-400 underline font-semibold">Dashboard → Tickets & Reports</Link>.
              </p>
            </div>
          ) : (
            <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">⚠ Free Edit Window Expired</span>
              <p className="text-muted-foreground text-[11px]">
                The standard 24-hour free edit window for this listing has ended. You can request a one-time free edit allowance from support in <Link to="/dashboard" className="text-violet-600 dark:text-violet-400 underline font-semibold">Dashboard → Tickets & Reports</Link>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title *</Label>
                <span className={`text-xs ${title.length >= FIELD_LIMITS.TITLE ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                  {title.length} / {FIELD_LIMITS.TITLE}
                </span>
              </div>
              <Input
                id="title"
                placeholder="e.g., RTX 4080 Super - Like New"
                value={title}
                maxLength={FIELD_LIMITS.TITLE}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="edit-title-input"
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[1.5rem]">
                  <Label className="font-semibold text-sm">Category *</Label>
                </div>
                <Select value={categoryId} onValueChange={handleCategoryChange} required>
                  <SelectTrigger className="h-10 w-full" data-testid="edit-category">
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

              {selectedCategory?.subcategories?.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between min-h-[1.5rem]">
                    <Label className="font-semibold text-sm">Subcategory</Label>
                  </div>
                  <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                    <SelectTrigger className="h-10 w-full" data-testid="edit-subcategory">
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
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>

            {/* Price Type */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Price Type *</Label>
              <RadioGroup value={priceType} onValueChange={setPriceType} className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="edit-fixed" />
                  <Label htmlFor="edit-fixed" className="cursor-pointer text-sm">Fixed Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="negotiable" id="edit-negotiable" />
                  <Label htmlFor="edit-negotiable" className="cursor-pointer text-sm">Negotiable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exchange" id="edit-exchange" />
                  <Label htmlFor="edit-exchange" className="cursor-pointer text-sm">Exchange</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="free" id="edit-free" />
                  <Label htmlFor="edit-free" className="cursor-pointer text-sm">Free</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Price & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[1.5rem]">
                  <Label htmlFor="price" className="font-semibold text-sm">
                    {priceType === 'free' ? 'Price' : 'Price (₹) *'}
                  </Label>
                  {priceType !== 'free' && <span className="text-xs text-muted-foreground">Max ₹10,00,000</span>}
                </div>
                {priceType === 'free' ? (
                  <div className="h-10 px-3 py-2 rounded-md border border-border bg-muted/40 text-emerald-400 font-semibold text-sm flex items-center">
                    FREE
                  </div>
                ) : (
                  <Input
                    id="price"
                    type="number"
                    placeholder={priceType === 'negotiable' ? 'Enter starting price (optional)' : 'Enter price'}
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || Number(val) >= 0) {
                        setPrice(val);
                      }
                    }}
                    required={priceType === 'fixed'}
                    min="0"
                    max={MAX_PRICE}
                    className="h-10 w-full"
                    data-testid="edit-price-input"
                  />
                )}
                {priceType !== 'free' && price && Number(price) > 0 && Number(price) <= MAX_PRICE && (
                  <p className="text-xs font-mono text-violet-400">
                    ₹{Number(price).toLocaleString('en-IN')} {priceType === 'negotiable' ? '(Negotiable)' : ''}
                  </p>
                )}
                {priceType !== 'free' && price && Number(price) > MAX_PRICE && (
                  <p className="text-xs font-medium text-red-500">
                    Maximum price allowed is ₹10,00,000
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between min-h-[1.5rem]">
                  <Label className="font-semibold text-sm">Condition *</Label>
                </div>
                <Select value={condition} onValueChange={setCondition} required>
                  <SelectTrigger className="h-10 w-full" data-testid="edit-condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Like New">Like New</SelectItem>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location Hierarchy - 3-Column Grid with Equalized Label Heights */}
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
                  >
                    <SelectTrigger className="h-10 w-full" data-testid="edit-district">
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
                  >
                    <SelectTrigger className="h-10 w-full" data-testid="edit-taluk">
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
                    <SelectTrigger className="h-10 w-full" data-testid="edit-area">
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

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description *</Label>
                <span className={`text-xs ${description.length >= FIELD_LIMITS.DESCRIPTION ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                  {description.length} / {FIELD_LIMITS.DESCRIPTION}
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Describe your item in detail..."
                value={description}
                maxLength={FIELD_LIMITS.DESCRIPTION}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                data-testid="edit-description-input"
              />
            </div>

            {/* Specifications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Specifications (Optional)</Label>
                <span className="text-xs font-medium text-muted-foreground" data-testid="edit-specifications-counter">
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
                  data-testid="edit-add-specification-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Specification
                </Button>
              )}
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Images (Max 5)</Label>
              <div className="flex flex-wrap gap-3">
                {/* Existing Images */}
                {imageUrls.map((url, index) => (
                  <div key={`existing-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70"
                      onClick={() => removeExistingImage(index)}
                    >
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                ))}
                
                {/* New Images */}
                {newImagePreviews.map((url, index) => (
                  <div key={`new-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-violet-500">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70"
                      onClick={() => removeNewImage(index)}
                    >
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                ))}
                
                {/* Upload Button */}
                {imageUrls.length + newImages.length < 5 && (
                  <label className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 hover:bg-violet-500/5 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={saving || (user?.role !== 'admin' && !listingData?.free_edit_available)}
                data-testid="edit-submit"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : user?.role !== 'admin' && !listingData?.free_edit_available ? (
                  listingData?.free_edit_status === 'used' ? 'Free Edit Already Used' : 'Free Edit Window Expired'
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
