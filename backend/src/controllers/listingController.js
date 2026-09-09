const { v4: uuidv4 } = require('uuid');
const Listing = require('../models/Listing');
const Category = require('../models/Category');
const User = require('../models/User');
const Review = require('../models/Review');
const Conversation = require('../models/Conversation');
const generateSlug = require('../utils/generateSlug');
const {
  isDigitalCategory,
  getItemTypeForCategory,
  getMaxSpecificationsForCategory
} = require('../utils/categoryUtils');
const { moderateText, detectOffensiveContent } = require('../moderation/moderationService');
const { logAuditEvent } = require('../utils/auditLogger');

const enrichListing = async (listing, categoryMap = null, userMap = null) => {
  const result = {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    description: listing.description,
    category_id: listing.category_id,
    category_name: 'Unknown',
    subcategory_id: listing.subcategory_id || null,
    subcategory_name: null,
    price: Number(listing.price),
    price_type: listing.price_type || 'fixed',
    condition: listing.condition,
    item_type: listing.item_type || 'physical',
    location: listing.location,
    location_district: listing.location_district || null,
    location_taluk: listing.location_taluk || null,
    location_area: listing.location_area || null,
    address_details: listing.address_details || null,
    latitude: listing.latitude !== undefined && listing.latitude !== null ? Number(listing.latitude) : null,
    longitude: listing.longitude !== undefined && listing.longitude !== null ? Number(listing.longitude) : null,
    contact_phone: listing.contact_phone,
    contact_method: listing.contact_method || 'both',
    hide_phone: Boolean(listing.hide_phone),
    images: listing.images || [],
    specifications: listing.specifications || [],
    brand: listing.brand || null,
    model: listing.model || null,
    seller_id: listing.seller_id,
    seller_name: null,
    seller_avatar: null,
    seller_verified: false,
    seller_rating: 0,
    status: listing.status,
    payment_status: listing.payment_status,
    featured: Boolean(listing.featured),
    views_count: Number(listing.views_count || 0),
    is_deleted: Boolean(listing.is_deleted),
    deleted_at: listing.deleted_at || null,
    deleted_by: listing.deleted_by || null,
    deletion_reason: listing.deletion_reason || null,
    previous_status: listing.previous_status || null,
    created_by_admin: Boolean(listing.created_by_admin),
    is_free_listing: Boolean(listing.is_free_listing),
    free_edit_used: Boolean(listing.free_edit_used),
    free_edit_used_at: listing.free_edit_used_at || null,
    sold_at: listing.sold_at || null,
    sold_to_user_id: listing.sold_to_user_id || null,
    updated_at: listing.updated_at || null,
    created_at: listing.created_at
  };

  // Calculate 24-hour one-time free edit window status
  const createdAtMs = new Date(listing.created_at || Date.now()).getTime();
  const nowMs = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const expiresAtMs = createdAtMs + TWENTY_FOUR_HOURS_MS;
  const isWithin24h = nowMs < expiresAtMs;
  const freeEditUsed = Boolean(listing.free_edit_used);

  result.free_edit_available = isWithin24h && !freeEditUsed;
  result.free_edit_expires_at = new Date(expiresAtMs).toISOString();

  if (freeEditUsed) {
    result.free_edit_status = 'used';
  } else if (!isWithin24h) {
    result.free_edit_status = 'expired';
  } else {
    result.free_edit_status = 'available';
  }

  result.free_edit_hours_left = isWithin24h ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / (60 * 60 * 1000))) : 0;
  result.free_edit_minutes_left = isWithin24h ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / (60 * 1000))) : 0;

  let cat = categoryMap ? categoryMap.get(listing.category_id) : null;
  if (!cat && !categoryMap) {
    cat = await Category.findOne({ id: listing.category_id }).lean();
  }
  if (cat) {
    result.category_name = cat.name;
    if (listing.subcategory_id && cat.subcategories) {
      const subcat = cat.subcategories.find((s) => s.id === listing.subcategory_id);
      result.subcategory_name = subcat ? subcat.name : null;
    }
  }

  let seller = userMap ? userMap.get(listing.seller_id) : null;
  if (!seller && !userMap) {
    seller = await User.findOne({ id: listing.seller_id }).lean();
  }
  if (seller) {
    result.seller_name = seller.name;
    result.seller_avatar = seller.avatar || null;
    result.seller_verified = Boolean(seller.is_seller_verified);
    result.seller_rating = Number(seller.rating_avg || 0);
  }

  return result;
};

// GET /api/listings
const getListings = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      search,
      min_price,
      max_price,
      condition,
      item_type,
      location,
      location_district,
      location_taluk,
      location_area,
      price_type,
      seller_verified,
      featured,
      sort = 'latest',
      limit = 50,
      skip = 0
    } = req.query;

    const query = { 
      status: 'active', 
      payment_status: 'completed', 
      is_deleted: { $ne: true },
      deleted_at: null
    };

    if (category) {
      const cat = await Category.findOne({ slug: category }).lean();
      if (cat) {
        query.category_id = cat.id;
      } else {
        // Also support category ID
        query.category_id = category;
      }
    }

    if (subcategory) {
      query.subcategory_id = subcategory;
    }

    if (search && search.trim()) {
      const detection = detectOffensiveContent(search.trim());
      if (detection.hasMatches && (detection.severity === 'CRITICAL' || detection.severity === 'HIGH')) {
        return res.status(400).json({ detail: 'Your search query contains prohibited terms violating community safety guidelines.' });
      }

      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (min_price !== undefined && min_price !== '') {
      query.price = { ...(query.price || {}), $gte: Number(min_price) };
    }
    if (max_price !== undefined && max_price !== '') {
      query.price = { ...(query.price || {}), $lte: Number(max_price) };
    }

    if (condition) query.condition = condition;
    if (item_type) query.item_type = item_type;
    if (location) query.location = location;
    if (location_district) query.location_district = location_district;
    if (location_taluk) query.location_taluk = location_taluk;
    if (location_area) query.location_area = location_area;
    if (price_type) query.price_type = price_type;
    if (featured === 'true' || featured === true) query.featured = true;

    let sortOption = { created_at: -1 };
    if (sort === 'price_low') {
      sortOption = { price: 1 };
    } else if (sort === 'price_high') {
      sortOption = { price: -1 };
    } else if (sort === 'views') {
      sortOption = { views_count: -1 };
    }

    const rawListings = await Listing.find(query)
      .sort(sortOption)
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const categoryIds = [...new Set(rawListings.map((l) => l.category_id))];
    const sellerIds = [...new Set(rawListings.map((l) => l.seller_id))];

    const categories = await Category.find({ id: { $in: categoryIds } }).lean();
    const sellers = await User.find({ id: { $in: sellerIds } }).lean();

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const userMap = new Map(sellers.map((u) => [u.id, u]));

    let listings = await Promise.all(
      rawListings.map((l) => enrichListing(l, categoryMap, userMap))
    );

    if (seller_verified === 'true' || seller_verified === true) {
      listings = listings.filter((l) => l.seller_verified);
    }

    return res.status(200).json(listings);
  } catch (error) {
    console.error('Get listings error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/listings/featured
const getFeaturedListings = async (req, res) => {
  try {
    const rawListings = await Listing.find({
      status: 'active',
      payment_status: 'completed',
      is_deleted: { $ne: true },
      deleted_at: null,
      featured: true
    })
      .sort({ created_at: -1 })
      .limit(8)
      .lean();

    const listings = await Promise.all(rawListings.map((l) => enrichListing(l)));
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Get featured listings error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/listings/latest
const getLatestListings = async (req, res) => {
  try {
    const rawListings = await Listing.find({
      status: 'active',
      payment_status: 'completed',
      is_deleted: { $ne: true },
      deleted_at: null
    })
      .sort({ created_at: -1 })
      .limit(12)
      .lean();

    const listings = await Promise.all(rawListings.map((l) => enrichListing(l)));
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Get latest listings error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/listings/:listing_id
const getListing = async (req, res) => {
  try {
    const { listing_id } = req.params;
    if (!listing_id) {
      return res.status(400).json({ detail: 'Listing identifier required' });
    }

    const decoded = decodeURIComponent(listing_id).trim();
    let listing = await Listing.findOne({ id: decoded }).lean();
    
    if (!listing) {
      listing = await Listing.findOne({ slug: decoded }).lean();
    }
    if (!listing) {
      listing = await Listing.findOne({ slug: decoded.toLowerCase() }).lean();
    }
    if (!listing) {
      const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      listing = await Listing.findOne({ slug: { $regex: new RegExp(`^${escaped}$`, 'i') } }).lean();
    }
    if (!listing) {
      const baseSlug = decoded.replace(/-[a-f0-9]{8}$/i, '');
      if (baseSlug && baseSlug !== decoded) {
        const escapedBase = baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        listing = await Listing.findOne({ slug: { $regex: new RegExp(`^${escapedBase}`, 'i') } }).lean();
      }
    }
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }

    if (listing.is_deleted || listing.status === 'deleted') {
      const currentUser = req.user;
      const isAuthorized = currentUser && (currentUser.id === listing.seller_id || currentUser.role === 'admin');
      if (!isAuthorized) {
        return res.status(404).json({ detail: 'Listing not found or has been removed' });
      }
    }

    const enriched = await enrichListing(listing);
    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// In-memory view deduplication cache: key -> timestamp
const viewCache = new Map();
const VIEW_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown per viewer/listing

// Periodically clean up expired view cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewCache.entries()) {
    if (now - timestamp > VIEW_COOLDOWN_MS) {
      viewCache.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

// POST /api/listings/:listing_id/view - Atomically record a legitimate product view
const recordListingView = async (req, res) => {
  try {
    const { listing_id } = req.params;
    if (!listing_id) {
      return res.status(400).json({ detail: 'Listing identifier required' });
    }

    const decoded = decodeURIComponent(listing_id).trim();
    let listing = await Listing.findOne({ id: decoded }).select('id slug seller_id views_count').lean();
    
    if (!listing) {
      listing = await Listing.findOne({ slug: decoded }).select('id slug seller_id views_count').lean();
    }
    if (!listing) {
      listing = await Listing.findOne({ slug: decoded.toLowerCase() }).select('id slug seller_id views_count').lean();
    }
    if (!listing) {
      const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      listing = await Listing.findOne({ slug: { $regex: new RegExp(`^${escaped}$`, 'i') } }).select('id slug seller_id views_count').lean();
    }

    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }

    // 1. If viewing user is the seller, do not count as a customer/buyer view
    if (req.user && req.user.id === listing.seller_id) {
      return res.status(200).json({
        success: true,
        listing_id: listing.id,
        views_count: Number(listing.views_count || 0),
        incremented: false,
        reason: 'seller_view'
      });
    }

    // 2. Identify viewer: authenticated user ID or guest IP / forward header
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : 'guest';
    const viewerId = req.user ? `user:${req.user.id}` : `guest:${clientIp}`;
    const cacheKey = `${viewerId}:${listing.id}`;

    const now = Date.now();
    const lastView = viewCache.get(cacheKey);

    // 3. Deduplication: Check if viewed recently within cooldown window
    if (lastView && (now - lastView < VIEW_COOLDOWN_MS)) {
      return res.status(200).json({
        success: true,
        listing_id: listing.id,
        views_count: Number(listing.views_count || 0),
        incremented: false,
        reason: 'cooldown'
      });
    }

    // Update cache with current timestamp
    viewCache.set(cacheKey, now);

    // 4. Atomic database increment via $inc
    const updated = await Listing.findOneAndUpdate(
      { id: listing.id },
      { $inc: { views_count: 1 } },
      { new: true, projection: { id: 1, views_count: 1 } }
    );

    const finalCount = updated ? Number(updated.views_count) : Number(listing.views_count || 0) + 1;

    return res.status(200).json({
      success: true,
      listing_id: listing.id,
      views_count: finalCount,
      incremented: true
    });
  } catch (error) {
    console.error('Record listing view error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

const { FIELD_LIMITS, validateFieldLength } = require('../utils/fieldLimits');

const validateListingPayload = async (data, isUpdate = false) => {
  // 1. Text Field Length & Moderation Validation
  if (data.title !== undefined || !isUpdate) {
    const titleCheck = validateFieldLength(data.title, FIELD_LIMITS.TITLE, !isUpdate, 'Title');
    if (!titleCheck.valid) return titleCheck;
    if (data.title) {
      const titleMod = await moderateText(data.title, { type: 'post_title' });
      if (titleMod.isProhibited) {
        return { valid: false, error: 'Listing title contains prohibited or offensive language.' };
      }
    }
  }

  if (data.description !== undefined || !isUpdate) {
    const descCheck = validateFieldLength(data.description, FIELD_LIMITS.DESCRIPTION, !isUpdate, 'Description');
    if (!descCheck.valid) return descCheck;
    if (data.description) {
      const descMod = await moderateText(data.description, { type: 'post_description' });
      if (descMod.isProhibited) {
        return { valid: false, error: 'Listing description contains prohibited or offensive language.' };
      }
    }
  }

  if (data.brand !== undefined && data.brand !== null && data.brand !== '') {
    const brandCheck = validateFieldLength(data.brand, FIELD_LIMITS.BRAND, false, 'Brand');
    if (!brandCheck.valid) return brandCheck;
  }

  if (data.model !== undefined && data.model !== null && data.model !== '') {
    const modelCheck = validateFieldLength(data.model, FIELD_LIMITS.MODEL, false, 'Model');
    if (!modelCheck.valid) return modelCheck;
  }

  if (data.location !== undefined && data.location !== null && data.location !== '') {
    const locCheck = validateFieldLength(data.location, FIELD_LIMITS.LOCATION_ADDRESS, false, 'Location');
    if (!locCheck.valid) return locCheck;
  }

  if (data.address_details !== undefined && data.address_details !== null && data.address_details !== '') {
    const addrCheck = validateFieldLength(data.address_details, FIELD_LIMITS.LOCATION_ADDRESS, false, 'Address details');
    if (!addrCheck.valid) return addrCheck;
  }

  if (data.location_district !== undefined && data.location_district !== null && data.location_district !== '') {
    const distCheck = validateFieldLength(data.location_district, FIELD_LIMITS.LOCATION_NAME, false, 'District');
    if (!distCheck.valid) return distCheck;
  }

  if (data.location_taluk !== undefined && data.location_taluk !== null && data.location_taluk !== '') {
    const talukCheck = validateFieldLength(data.location_taluk, FIELD_LIMITS.LOCATION_NAME, false, 'Taluk');
    if (!talukCheck.valid) return talukCheck;
  }

  if (data.location_area !== undefined && data.location_area !== null && data.location_area !== '') {
    const areaCheck = validateFieldLength(data.location_area, FIELD_LIMITS.LOCATION_NAME, false, 'Area');
    if (!areaCheck.valid) return areaCheck;
  }

  if (data.specifications && Array.isArray(data.specifications)) {
    for (const spec of data.specifications) {
      if (spec && spec.key) {
        const keyCheck = validateFieldLength(spec.key, FIELD_LIMITS.SPEC_KEY, false, 'Specification key');
        if (!keyCheck.valid) return keyCheck;
      }
      if (spec && spec.value) {
        const valCheck = validateFieldLength(spec.value, FIELD_LIMITS.SPEC_VALUE, false, 'Specification value');
        if (!valCheck.valid) return valCheck;
      }
    }
  }

  // 2. Price validation: must be >= 0 and <= 1,000,000 (10 Lakhs)
  if (data.price !== undefined && data.price !== null && data.price !== '') {
    const numPrice = Number(data.price);
    if (isNaN(numPrice) || numPrice < 0) {
      return { valid: false, error: 'Price must be a valid positive number' };
    }
    if (numPrice > 1000000) {
      return { valid: false, error: 'Maximum price allowed is ₹10,00,000' };
    }
  } else if (!isUpdate && data.price_type !== 'free') {
    return { valid: false, error: 'Price is required' };
  }

  // 2. Category & Item Type validation
  if (data.category_id) {
    const category = await Category.findOne({
      $or: [{ id: data.category_id }, { slug: data.category_id }]
    });
    if (!category) {
      return { valid: false, error: 'Invalid category selected' };
    }

    const expectedItemType = getItemTypeForCategory(category);
    if (data.item_type && data.item_type !== expectedItemType) {
      if (expectedItemType === 'digital') {
        return { valid: false, error: `Category '${category.name}' requires item type to be 'digital'` };
      } else {
        return { valid: false, error: `Category '${category.name}' requires item type to be 'physical'` };
      }
    }

    // 3. Subcategory validation (if provided)
    if (data.subcategory_id) {
      const subExists = category.subcategories?.some(
        (sub) => sub.id === data.subcategory_id || sub.slug === data.subcategory_id
      );
      if (!subExists) {
        return { valid: false, error: 'Invalid subcategory for the selected category' };
      }
    }

    // 4. Specification count limit validation
    if (data.specifications && Array.isArray(data.specifications)) {
      const maxSpecs = getMaxSpecificationsForCategory(category);
      const validSpecs = data.specifications.filter((s) => s && (s.key || s.value));
      if (validSpecs.length > maxSpecs) {
        return {
          valid: false,
          error: `Category '${category.name}' allows a maximum of ${maxSpecs} specifications`
        };
      }
    }
  } else if (!isUpdate) {
    return { valid: false, error: 'Category is required' };
  }

  // 5. Coordinate validation (if provided)
  if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be a valid number between -90 and 90' };
    }
  }
  if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
    const lng = Number(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return { valid: false, error: 'Longitude must be a valid number between -180 and 180' };
    }
  }

  return { valid: true };
};

// POST /api/listings
const createListing = async (req, res) => {
  try {
    const user = req.user;
    const data = req.body;

    const validation = await validateListingPayload(data, false);
    if (!validation.valid) {
      return res.status(400).json({ detail: validation.error });
    }

    // Resolve category for automatic item type
    let itemType = 'physical';
    if (data.category_id) {
      const cat = await Category.findOne({
        $or: [{ id: data.category_id }, { slug: data.category_id }]
      });
      if (cat) {
        itemType = getItemTypeForCategory(cat);
      }
    }

    const newListing = new Listing({
      id: uuidv4(),
      slug: generateSlug(data.title),
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id || null,
      price: data.price_type === 'free' ? 0 : Number(data.price),
      price_type: data.price_type || 'fixed',
      condition: data.condition,
      item_type: itemType,
      location: data.location,
      location_district: data.location_district || null,
      location_taluk: data.location_taluk || null,
      location_area: data.location_area || null,
      address_details: data.address_details || null,
      latitude: data.latitude !== undefined && data.latitude !== null && data.latitude !== '' ? Number(data.latitude) : null,
      longitude: data.longitude !== undefined && data.longitude !== null && data.longitude !== '' ? Number(data.longitude) : null,
      contact_phone: data.contact_phone,
      contact_method: data.contact_method || 'both',
      hide_phone: Boolean(data.hide_phone),
      images: data.images || [],
      specifications: data.specifications || [],
      brand: data.brand || null,
      model: data.model || null,
      seller_id: user.id,
      status: user.role === 'admin' ? 'active' : 'pending_payment',
      payment_status: user.role === 'admin' ? 'completed' : 'pending',
      created_by_admin: user.role === 'admin',
      is_free_listing: user.role === 'admin',
      free_edit_used: false,
      free_edit_used_at: null,
      featured: false,
      views_count: 0,
      created_at: new Date().toISOString()
    });

    await newListing.save();

    if (user.role === 'admin') {
      await logAuditEvent({
        admin_id: user.id,
        entity_type: 'listing',
        entity_id: newListing.id,
        action: 'POST_CREATED',
        previous_state: null,
        new_state: { status: 'active', created_by_admin: true, is_free_listing: true },
        reason: 'Admin created post directly (free)',
        req
      });
    }

    const enriched = await enrichListing(newListing.toJSON());
    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// PUT /api/listings/:listing_id
const updateListing = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const user = req.user;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }
    if (listing.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized to edit this listing' });
    }

    const nowMs = Date.now();
    const createdAtMs = new Date(listing.created_at || Date.now()).getTime();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // Normal users are strictly subject to the 1-free-edit / 24-hour expiration rule
    if (user.role !== 'admin') {
      // Check 1: Has 24 hours elapsed since creation?
      if (nowMs >= createdAtMs + TWENTY_FOUR_HOURS_MS) {
        return res.status(403).json({
          detail: 'The 24-hour free edit window has expired. Listings can only be edited within the first 24 hours of posting.',
          code: 'FREE_EDIT_EXPIRED'
        });
      }

      // Check 2: Has the one free edit already been consumed?
      if (listing.free_edit_used) {
        return res.status(403).json({
          detail: 'The free edit for this listing has already been used. You get exactly one free edit within 24 hours of posting.',
          code: 'FREE_EDIT_ALREADY_USED'
        });
      }
    }

    // Merge effective data for validation
    const effectiveCategoryId = req.body.category_id || listing.category_id;
    let expectedItemType = listing.item_type;
    if (effectiveCategoryId) {
      const cat = await Category.findOne({
        $or: [{ id: effectiveCategoryId }, { slug: effectiveCategoryId }]
      }).lean();
      if (cat) {
        expectedItemType = getItemTypeForCategory(cat.slug || cat.id);
      }
    }

    const effectiveData = {
      ...listing.toObject(),
      ...req.body,
      item_type: expectedItemType
    };

    const validation = await validateListingPayload(effectiveData, true);
    if (!validation.valid) {
      return res.status(400).json({ detail: validation.error });
    }

    const nowIso = new Date().toISOString();
    const updateData = { ...req.body, updated_at: nowIso };
    if (updateData.title && updateData.title !== listing.title) {
      updateData.slug = generateSlug(updateData.title);
    }
    if (updateData.category_id) {
      updateData.item_type = expectedItemType;
    }

    // Strip client-controlled system and security fields
    delete updateData.id;
    delete updateData.seller_id;
    delete updateData.created_at;
    delete updateData.free_edit_used;
    delete updateData.free_edit_used_at;

    if (user.role !== 'admin') {
      delete updateData.created_by_admin;
      delete updateData.is_free_listing;
      delete updateData.payment_status;
      delete updateData.is_deleted;
    }

    let updatedListing;

    if (user.role === 'admin') {
      // Admins have unrestricted editing privileges without consuming user free edits
      updatedListing = await Listing.findOneAndUpdate(
        { id: listing_id },
        { $set: updateData },
        { new: true, returnDocument: 'after' }
      ).lean();
    } else {
      // Atomic concurrency-safe update for normal users:
      // Ensures free_edit_used is not true and creation timestamp is strictly within 24 hours
      const twentyFourHoursAgoIso = new Date(nowMs - TWENTY_FOUR_HOURS_MS).toISOString();

      updatedListing = await Listing.findOneAndUpdate(
        {
          id: listing_id,
          seller_id: user.id,
          free_edit_used: { $ne: true },
          created_at: { $gt: twentyFourHoursAgoIso }
        },
        {
          $set: {
            ...updateData,
            free_edit_used: true,
            free_edit_used_at: nowIso
          }
        },
        { new: true, returnDocument: 'after' }
      ).lean();

      if (!updatedListing) {
        // Double-check why atomic update failed to give precise error
        const recheck = await Listing.findOne({ id: listing_id });
        if (!recheck) {
          return res.status(404).json({ detail: 'Listing not found' });
        }
        if (recheck.seller_id !== user.id) {
          return res.status(403).json({ detail: 'Not authorized to edit this listing' });
        }
        if (recheck.free_edit_used) {
          return res.status(403).json({
            detail: 'The free edit for this listing has already been used. You get exactly one free edit within 24 hours of posting.',
            code: 'FREE_EDIT_ALREADY_USED'
          });
        }
        const recheckCreatedMs = new Date(recheck.created_at || 0).getTime();
        if (Date.now() >= recheckCreatedMs + TWENTY_FOUR_HOURS_MS) {
          return res.status(403).json({
            detail: 'The 24-hour free edit window has expired. Listings can only be edited within the first 24 hours of posting.',
            code: 'FREE_EDIT_EXPIRED'
          });
        }
        return res.status(403).json({ detail: 'Listing edit could not be processed.', code: 'EDIT_REJECTED' });
      }
    }

    const enriched = await enrichListing(updatedListing);
    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// DELETE /api/listings/:listing_id
const deleteListing = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const user = req.user;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }
    if (listing.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const previousStatus = listing.status;
    const nowIso = new Date().toISOString();
    listing.previous_status = previousStatus !== 'deleted' ? previousStatus : (listing.previous_status || 'active');
    listing.status = 'deleted';
    listing.is_deleted = true;
    listing.featured = false; // Automatically unfeature deleted listing
    listing.deleted_at = nowIso;
    listing.deleted_by = user.id;
    listing.deletion_reason = req.body?.reason || (user.role === 'admin' && listing.seller_id !== user.id ? 'admin_removed' : 'user_deleted');
    listing.updated_at = nowIso;
    await listing.save();

    await logAuditEvent({
      user_id: user.role !== 'admin' ? user.id : null,
      admin_id: user.role === 'admin' ? user.id : null,
      entity_type: 'listing',
      entity_id: listing_id,
      action: 'POST_DELETED',
      previous_state: { status: previousStatus, is_deleted: false },
      new_state: { status: 'deleted', is_deleted: true, deleted_at: nowIso, previous_status: listing.previous_status },
      reason: listing.deletion_reason,
      req
    });

    return res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/listings/:listing_id/mark-sold
const markListingSold = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const user = req.user;

    const listing = await Listing.findOne({ id: listing_id });
    if (!listing) {
      return res.status(404).json({ detail: 'Listing could not be found.' });
    }
    if (listing.seller_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ detail: 'You are not authorized to update this listing.' });
    }
    if (listing.is_deleted || listing.status === 'deleted') {
      return res.status(400).json({ detail: 'This listing cannot be marked as sold because it is deleted.' });
    }

    const previousStatus = listing.status;
    const soldAt = new Date().toISOString();
    const buyerId = req.body?.buyer_id || null;

    listing.status = 'sold';
    listing.featured = false; // Automatically remove from featured content
    listing.sold_at = listing.sold_at || soldAt;
    if (buyerId) listing.sold_to_user_id = buyerId;
    listing.updated_at = soldAt;
    await listing.save();

    // Close all open conversations for this listing
    await Conversation.updateMany(
      { listing_id: listing.id, status: 'open' },
      {
        $set: {
          status: 'closed_sold',
          closed_at: soldAt,
          closed_reason: 'listing_sold'
        }
      }
    );

    await logAuditEvent({
      user_id: user.role !== 'admin' ? user.id : null,
      admin_id: user.role === 'admin' ? user.id : null,
      entity_type: 'listing',
      entity_id: listing_id,
      action: 'LISTING_SOLD',
      previous_state: { status: previousStatus, featured: listing.featured },
      new_state: { status: 'sold', featured: false, sold_at: soldAt, buyer_id: buyerId },
      reason: 'Marked as sold by seller',
      req
    });

    const enriched = await enrichListing(listing.toJSON ? listing.toJSON() : listing);
    return res.status(200).json({ success: true, message: 'Listing marked as sold', listing: enriched });
  } catch (error) {
    console.error('Mark listing sold error:', error);
    return res.status(500).json({ detail: 'Unable to update the listing right now. Please try again.' });
  }
};

// GET /api/my-listings
const getMyListings = async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;

    const query = { seller_id: user.id };
    if (status === 'active') {
      query.status = 'active';
      query.is_deleted = { $ne: true };
    } else if (status === 'sold') {
      query.status = 'sold';
    } else if (status === 'archived') {
      query.status = 'archived';
    } else if (status === 'deleted' && user.role === 'admin') {
      query.status = 'deleted';
    } else if (status === 'all') {
      // Returns everything except soft-deleted
      query.is_deleted = { $ne: true };
    } else {
      // Default: active and sold are visible to the seller
      query.is_deleted = { $ne: true };
    }

    const rawListings = await Listing.find(query).sort({ created_at: -1 }).limit(100).lean();
    const listings = await Promise.all(rawListings.map((l) => enrichListing(l)));
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Get my listings error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/sellers/:seller_id
const getSellerProfile = async (req, res) => {
  try {
    const { seller_id } = req.params;
    const seller = await User.findOne({ id: seller_id }).lean();
    if (!seller) {
      return res.status(404).json({ detail: 'Seller not found' });
    }

    const rawListings = await Listing.find({
      seller_id,
      status: 'active',
      payment_status: 'completed'
    })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    const listings = await Promise.all(rawListings.map((l) => enrichListing(l)));

    const rawReviews = await Review.find({ seller_id })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    const reviewerIds = [...new Set(rawReviews.map((r) => r.reviewer_id))];
    const reviewers = await User.find({ id: { $in: reviewerIds } }).lean();
    const reviewerMap = new Map(reviewers.map((r) => [r.id, r]));

    const reviews = rawReviews.map((r) => {
      const rev = reviewerMap.get(r.reviewer_id);
      return {
        id: r.id,
        reviewer_id: r.reviewer_id,
        reviewer_name: rev ? rev.name : 'Unknown',
        reviewer_avatar: rev ? rev.avatar : null,
        seller_id: r.seller_id,
        listing_id: r.listing_id,
        listing_title: r.listing_title || null,
        rating: r.rating,
        comment: r.comment,
        seller_response: r.seller_response || null,
        seller_response_at: r.seller_response_at || null,
        created_at: r.created_at
      };
    });

    delete seller.password;
    delete seller._id;
    delete seller.__v;

    return res.status(200).json({
      seller,
      listings,
      reviews
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/sellers/:seller_id/listings
const getSellerListingsOnly = async (req, res) => {
  try {
    const { seller_id } = req.params;
    const seller = await User.findOne({ id: seller_id }).lean();
    if (!seller) {
      return res.status(404).json({ detail: 'Seller not found' });
    }

    const rawListings = await Listing.find({
      seller_id,
      payment_status: 'completed'
    })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    const listings = await Promise.all(rawListings.map((l) => enrichListing(l)));
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Get seller listings error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getListings,
  getFeaturedListings,
  getLatestListings,
  getListing,
  recordListingView,
  createListing,
  updateListing,
  deleteListing,
  markListingSold,
  getMyListings,
  getSellerProfile,
  getSellerListingsOnly,
  enrichListing
};
