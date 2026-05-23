import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDistricts, getTaluks, getAreas, formatLocation } from '../lib/keralaLocations';

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
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('');
  
  // Location - Kerala Hierarchy
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [area, setArea] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  
  // Derived location data
  const districts = getDistricts();
  const taluks = district ? getTaluks(district) : [];
  const areas = district && taluk ? getAreas(district, taluk) : [];

  const [imageUrls, setImageUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

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
      
      // Check authorization
      if (listing.seller_id !== user?.id && user?.role !== 'admin') {
        toast.error('Not authorized to edit this listing');
        navigate('/dashboard');
        return;
      }

      setTitle(listing.title);
      setDescription(listing.description);
      setCategoryId(listing.category_id);
      setSubcategoryId(listing.subcategory_id || '');
      setPrice(listing.price.toString());
      setCondition(listing.condition);
      setDistrict(listing.location_district || '');
      setTaluk(listing.location_taluk || '');
      setArea(listing.location_area || '');
      setAddressDetails(listing.address_details || '');
      setImageUrls(listing.images || []);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to load listing');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !categoryId || !price || !condition || !district || !taluk) {
      toast.error('Please fill in all required fields including district and sub-district');
      return;
    }

    setSaving(true);
    try {
      // Upload new images if any
      let uploadedImageUrls = [...imageUrls];
      for (const image of newImages) {
        const formData = new FormData();
        formData.append('file', image);
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
        price: parseFloat(price),
        condition,
        location: fullLocation,
        location_district: district,
        location_taluk: taluk,
        location_area: area || null,
        address_details: addressDetails || null,
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., RTX 4080 Super - Like New"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="edit-title-input"
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(''); }} required>
                  <SelectTrigger data-testid="edit-category">
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

              {categories.find(c => c.id === categoryId)?.subcategories?.length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.find(c => c.id === categoryId).subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Price & Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="1"
                  data-testid="edit-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Condition *</Label>
                <Select value={condition} onValueChange={setCondition} required>
                  <SelectTrigger data-testid="edit-condition">
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

            {/* Location */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select value={district} onValueChange={(val) => { setDistrict(val); setTaluk(''); setArea(''); }}>
                    <SelectTrigger data-testid="edit-district">
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
                  <Select key={`taluk-${district}`} value={taluk ? taluk : undefined} onValueChange={(val) => { setTaluk(val); setArea(''); }} disabled={!district}>
                    <SelectTrigger data-testid="edit-taluk">
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
                    <SelectTrigger data-testid="edit-area">
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your item in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                data-testid="edit-description-input"
              />
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
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={saving}
                data-testid="edit-submit"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
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
