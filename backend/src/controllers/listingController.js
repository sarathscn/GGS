const { v4: uuidv4 } = require('uuid');
const Listing = require('../models/Listing');
const Category = require('../models/Category');
const User = require('../models/User');
const Review = require('../models/Review');
const generateSlug = require('../utils/generateSlug');

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
    created_at: listing.created_at
  };

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

    const query = { status: 'active', payment_status: 'completed' };

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

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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
      payment_status: 'completed'
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
    let listing = await Listing.findOne({ id: listing_id }).lean();
    if (!listing) {
      listing = await Listing.findOne({ slug: listing_id }).lean();
    }
    if (!listing) {
      return res.status(404).json({ detail: 'Listing not found' });
    }

    await Listing.updateOne({ id: listing.id }, { $inc: { views_count: 1 } });
    listing.views_count = (listing.views_count || 0) + 1;

    const enriched = await enrichListing(listing);
    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Get listing error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// POST /api/listings
const createListing = async (req, res) => {
  try {
    const user = req.user;
    const data = req.body;

    const newListing = new Listing({
      id: uuidv4(),
      slug: generateSlug(data.title),
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id || null,
      price: Number(data.price),
      price_type: data.price_type || 'fixed',
      condition: data.condition,
      item_type: data.item_type || 'physical',
      location: data.location,
      location_district: data.location_district || null,
      location_taluk: data.location_taluk || null,
      location_area: data.location_area || null,
      address_details: data.address_details || null,
      contact_phone: data.contact_phone,
      contact_method: data.contact_method || 'both',
      hide_phone: Boolean(data.hide_phone),
      images: data.images || [],
      specifications: data.specifications || [],
      brand: data.brand || null,
      model: data.model || null,
      seller_id: user.id,
      status: 'pending_payment',
      payment_status: 'pending',
      featured: false,
      views_count: 0,
      created_at: new Date().toISOString()
    });

    await newListing.save();
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
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const allowed = [
      'title', 'description', 'category_id', 'subcategory_id', 'price',
      'price_type', 'condition', 'item_type', 'location', 'location_district',
      'location_taluk', 'location_area', 'address_details', 'contact_phone',
      'contact_method', 'hide_phone', 'images', 'specifications', 'brand',
      'model', 'status'
    ];

    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await Listing.updateOne({ id: listing_id }, { $set: updateData });
    }

    const updated = await Listing.findOne({ id: listing_id }).lean();
    const enriched = await enrichListing(updated);
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

    await Listing.deleteOne({ id: listing_id });
    return res.status(200).json({ message: 'Listing deleted' });
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
      return res.status(404).json({ detail: 'Listing not found' });
    }
    if (listing.seller_id !== user.id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await Listing.updateOne({ id: listing_id }, { $set: { status: 'sold' } });
    return res.status(200).json({ message: 'Listing marked as sold' });
  } catch (error) {
    console.error('Mark listing sold error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

// GET /api/my-listings
const getMyListings = async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;

    const query = { seller_id: user.id };
    if (status) {
      query.status = status;
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
  createListing,
  updateListing,
  deleteListing,
  markListingSold,
  getMyListings,
  getSellerProfile,
  getSellerListingsOnly,
  enrichListing
};
