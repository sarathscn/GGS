const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Category = require('../models/Category');
const Listing = require('../models/Listing');
const StaticPage = require('../models/StaticPage');
const BlogPost = require('../models/BlogPost');
const generateSlug = require('../utils/generateSlug');

const seedDatabase = async (req, res) => {
  try {
    const isForce = req.query.force === 'true' || req.body?.force === true;
    const existingAdmin = await User.findOne({ email: 'admin@ggs.com' });
    if (existingAdmin && !isForce) {
      return res.status(200).json({ message: 'Database already seeded' });
    }
    if (isForce) {
      await User.deleteMany({});
      await Category.deleteMany({});
      await Listing.deleteMany({});
      await StaticPage.deleteMany({});
      await BlogPost.deleteMany({});
    }

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminDoc = new User({
      id: uuidv4(),
      email: 'admin@ggs.com',
      phone: '+919876543210',
      password: hashedAdminPassword,
      name: 'Admin',
      username: 'admin',
      auth_type: 'email',
      role: 'admin',
      is_verified: true,
      is_seller_verified: true,
      is_suspended: false,
      avatar: null,
      location: 'Kochi',
      bio: 'GGS Administrator',
      rating_avg: 5.0,
      rating_count: 0,
      created_at: new Date().toISOString()
    });
    await adminDoc.save();

    const hashedUserPassword = await bcrypt.hash('user123', 10);
    const testUserDoc = new User({
      id: uuidv4(),
      email: 'user@ggs.com',
      phone: '+919876543211',
      password: hashedUserPassword,
      name: 'Test Seller',
      username: 'testseller',
      auth_type: 'email',
      role: 'user',
      is_verified: true,
      is_seller_verified: true,
      is_suspended: false,
      avatar: null,
      location: 'Thiruvananthapuram',
      bio: 'Gaming enthusiast selling quality gear',
      rating_avg: 4.5,
      rating_count: 12,
      created_at: new Date().toISOString()
    });
    await testUserDoc.save();

    const categoriesData = [
      {
        id: uuidv4(),
        name: 'PC Components',
        slug: 'pc-components',
        icon: 'Cpu',
        description: 'CPUs, GPUs, Motherboards, RAM, Storage, PSUs, Cooling, Cases',
        subcategories: [
          { id: uuidv4(), name: 'CPUs / Processors', slug: 'cpus' },
          { id: uuidv4(), name: 'Graphics Cards', slug: 'gpus' },
          { id: uuidv4(), name: 'Motherboards', slug: 'motherboards' },
          { id: uuidv4(), name: 'RAM / Memory', slug: 'ram' },
          { id: uuidv4(), name: 'Storage (SSD/HDD)', slug: 'storage' },
          { id: uuidv4(), name: 'Power Supplies', slug: 'psu' },
          { id: uuidv4(), name: 'Cooling', slug: 'cooling' },
          { id: uuidv4(), name: 'Cases', slug: 'cases' }
        ]
      },
      {
        id: uuidv4(),
        name: 'Gaming Peripherals',
        slug: 'peripherals',
        icon: 'Keyboard',
        description: 'Keyboards, Mice, Headsets, Controllers, Monitors',
        subcategories: [
          { id: uuidv4(), name: 'Keyboards', slug: 'keyboards' },
          { id: uuidv4(), name: 'Mouse', slug: 'mouse' },
          { id: uuidv4(), name: 'Headsets', slug: 'headsets' },
          { id: uuidv4(), name: 'Controllers', slug: 'controllers' },
          { id: uuidv4(), name: 'Monitors', slug: 'monitors' },
          { id: uuidv4(), name: 'Capture Cards', slug: 'capture-cards' },
          { id: uuidv4(), name: 'Webcams', slug: 'webcams' }
        ]
      },
      {
        id: uuidv4(),
        name: 'Gaming Consoles',
        slug: 'consoles',
        icon: 'Gamepad2',
        description: 'PlayStation, Xbox, Nintendo, Handhelds',
        subcategories: [
          { id: uuidv4(), name: 'PlayStation', slug: 'playstation' },
          { id: uuidv4(), name: 'Xbox', slug: 'xbox' },
          { id: uuidv4(), name: 'Nintendo', slug: 'nintendo' },
          { id: uuidv4(), name: 'Handhelds', slug: 'handhelds' },
          { id: uuidv4(), name: 'Retro Consoles', slug: 'retro' }
        ]
      },
      {
        id: uuidv4(),
        name: 'Full Systems',
        slug: 'systems',
        icon: 'Monitor',
        description: 'Pre-built PCs, Custom Builds, Gaming Laptops',
        subcategories: [
          { id: uuidv4(), name: 'Pre-built PCs', slug: 'prebuilt' },
          { id: uuidv4(), name: 'Custom Builds', slug: 'custom' },
          { id: uuidv4(), name: 'Gaming Laptops', slug: 'laptops' },
          { id: uuidv4(), name: 'Mini PCs', slug: 'mini-pc' }
        ]
      },
      {
        id: uuidv4(),
        name: 'Digital Goods',
        slug: 'digital',
        icon: 'Download',
        description: 'Game Accounts, In-game Items, Game Keys',
        subcategories: [
          { id: uuidv4(), name: 'Game Accounts', slug: 'accounts' },
          { id: uuidv4(), name: 'In-game Items', slug: 'ingame' },
          { id: uuidv4(), name: 'Game Keys', slug: 'keys' },
          { id: uuidv4(), name: 'Gift Cards', slug: 'giftcards' }
        ]
      },
      {
        id: uuidv4(),
        name: 'Accessories',
        slug: 'accessories',
        icon: 'Package',
        description: 'Cables, Stands, RGB Lighting, Gaming Chairs',
        subcategories: [
          { id: uuidv4(), name: 'Cables & Adapters', slug: 'cables' },
          { id: uuidv4(), name: 'Stands & Mounts', slug: 'stands' },
          { id: uuidv4(), name: 'RGB Lighting', slug: 'rgb' },
          { id: uuidv4(), name: 'Gaming Chairs', slug: 'chairs' },
          { id: uuidv4(), name: 'Desks', slug: 'desks' }
        ]
      }
    ];
    await Category.insertMany(categoriesData);

    const sample_images = {
      gpu: 'https://images.unsplash.com/photo-1757356747708-f11f10dbda7e?w=800',
      console: 'https://images.unsplash.com/photo-1622979138084-c03ae28968ed?w=800',
      keyboard: 'https://images.unsplash.com/photo-1763136469649-a2d3c15c7723?w=800',
      headset: 'https://images.unsplash.com/photo-1660391532247-4a8ad1060817?w=800',
      pc: 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800',
      monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'
    };

    const listingsData = [
      {
        id: uuidv4(),
        slug: 'rtx-4080-super-like-new-69b16bac',
        title: 'RTX 4080 Super - Like New',
        description:
          'NVIDIA RTX 4080 Super, used for 3 months. Perfect condition with original box. Great for 4K gaming. Warranty valid till 2025.',
        category_id: categoriesData[0].id,
        subcategory_id: categoriesData[0].subcategories[1].id,
        price: 85000,
        price_type: 'negotiable',
        condition: 'Like New',
        item_type: 'physical',
        location: 'Kochi',
        contact_phone: '+919876543211',
        contact_method: 'both',
        images: [sample_images.gpu],
        specifications: [
          { key: 'Brand', value: 'NVIDIA' },
          { key: 'VRAM', value: '16GB GDDR6X' },
          { key: 'Warranty', value: 'Till Dec 2025' }
        ],
        brand: 'NVIDIA',
        seller_id: testUserDoc.id,
        status: 'active',
        payment_status: 'completed',
        featured: true,
        views_count: 245,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'playstation-5-disc-edition-bundle-630fdcd5',
        title: 'PlayStation 5 Disc Edition Bundle',
        description:
          'PS5 Disc Edition with 2 controllers and 5 games including Spider-Man 2, God of War Ragnarok. Excellent condition, barely used.',
        category_id: categoriesData[2].id,
        subcategory_id: categoriesData[2].subcategories[0].id,
        price: 42000,
        price_type: 'fixed',
        condition: 'Excellent',
        item_type: 'physical',
        location: 'Thiruvananthapuram',
        contact_phone: '+919876543211',
        contact_method: 'chat',
        images: [sample_images.console],
        specifications: [
          { key: 'Storage', value: '825GB SSD' },
          { key: 'Includes', value: '2 Controllers, 5 Games' },
          { key: 'Warranty', value: '6 months left' }
        ],
        brand: 'Sony',
        seller_id: testUserDoc.id,
        status: 'active',
        payment_status: 'completed',
        featured: true,
        views_count: 189,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'logitech-g-pro-x-superlight-caf1345c',
        title: 'Logitech G Pro X Superlight',
        description:
          'Top-tier wireless gaming mouse, 63g ultralight. Perfect for competitive FPS gaming. Used for 6 months.',
        category_id: categoriesData[1].id,
        subcategory_id: categoriesData[1].subcategories[1].id,
        price: 8500,
        price_type: 'negotiable',
        condition: 'Good',
        item_type: 'physical',
        location: 'Kozhikode',
        contact_phone: '+919876543211',
        contact_method: 'phone',
        images: [sample_images.keyboard],
        specifications: [
          { key: 'Sensor', value: 'HERO 25K' },
          { key: 'Weight', value: '63g' },
          { key: 'Battery', value: '70 hours' }
        ],
        brand: 'Logitech',
        seller_id: testUserDoc.id,
        status: 'active',
        payment_status: 'completed',
        featured: false,
        views_count: 98,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'custom-gaming-pc-rtx-4070-ti-afd4d63e',
        title: 'Custom Gaming PC - RTX 4070 Ti',
        description:
          'High-end custom build. Intel i7-13700K, RTX 4070 Ti, 32GB DDR5, 2TB NVMe. Built 4 months ago. RGB everything!',
        category_id: categoriesData[3].id,
        subcategory_id: categoriesData[3].subcategories[1].id,
        price: 145000,
        price_type: 'negotiable',
        condition: 'Like New',
        item_type: 'physical',
        location: 'Thrissur',
        contact_phone: '+919876543211',
        contact_method: 'both',
        images: [sample_images.pc],
        specifications: [
          { key: 'CPU', value: 'Intel i7-13700K' },
          { key: 'GPU', value: 'RTX 4070 Ti' },
          { key: 'RAM', value: '32GB DDR5' },
          { key: 'Storage', value: '2TB NVMe SSD' }
        ],
        brand: 'Custom',
        seller_id: testUserDoc.id,
        status: 'active',
        payment_status: 'completed',
        featured: true,
        views_count: 312,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'steelseries-arctis-pro-wireless-4a41fe01',
        title: 'SteelSeries Arctis Pro Wireless',
        description:
          'Premium wireless gaming headset with dual battery system. Hi-Res audio certified. Pristine condition.',
        category_id: categoriesData[1].id,
        subcategory_id: categoriesData[1].subcategories[2].id,
        price: 18000,
        price_type: 'fixed',
        condition: 'Like New',
        item_type: 'physical',
        location: 'Kannur',
        contact_phone: '+919876543211',
        contact_method: 'chat',
        images: [sample_images.headset],
        specifications: [
          { key: 'Type', value: 'Wireless' },
          { key: 'Battery', value: 'Dual Swappable' },
          { key: 'Audio', value: 'Hi-Res Certified' }
        ],
        brand: 'SteelSeries',
        seller_id: testUserDoc.id,
        status: 'active',
        payment_status: 'completed',
        featured: true,
        views_count: 156,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'asus-rog-swift-27-165hz-monitor-2c6ce06b',
        title: 'ASUS ROG Swift 27" 165Hz Monitor',
        description:
          '27 inch 1440p IPS gaming monitor. 165Hz, 1ms response, G-Sync compatible. Perfect for competitive gaming.',
        category_id: categoriesData[1].id,
        subcategory_id: categoriesData[1].subcategories[4].id,
        price: 28000,
        price_type: 'negotiable',
        condition: 'Excellent',
        item_type: 'physical',
        location: 'Kochi',
        contact_phone: '+919876543211',
        contact_method: 'both',
        images: [sample_images.monitor],
        specifications: [
          { key: 'Size', value: '27 inch' },
          { key: 'Resolution', value: '2560x1440' },
          { key: 'Refresh Rate', value: '165Hz' },
          { key: 'Panel', value: 'IPS' }
        ],
        brand: 'ASUS',
        seller_id: testUserDoc.id,
        status: 'active',
        payment_status: 'completed',
        featured: false,
        views_count: 87,
        created_at: new Date().toISOString()
      }
    ];
    await Listing.insertMany(listingsData);

    const pagesData = [
      {
        id: uuidv4(),
        slug: 'about',
        title: 'About GGS',
        content:
          "# About Game Gear Swap\n\nGGS (Game Gear Swap) is Kerala's premier marketplace for buying and selling gaming gear. Founded by MALMER, we connect gamers to trade pre-owned gaming equipment safely.\n\n## Our Mission\n\nTo create a trusted community where gamers can buy and sell their equipment at fair prices.\n\n## Why Choose GGS?\n\n- **Verified Sellers**: All sellers can get verified through our KYC process\n- **Secure Messaging**: Chat directly with buyers/sellers\n- **Local Focus**: Currently serving all of Kerala\n- **Fair Pricing**: Community-driven prices",
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'contact',
        title: 'Contact Us',
        content:
          "# Contact Us\n\nWe'd love to hear from you!\n\n## Get in Touch\n\n- **Email**: support@ggs.com\n- **Phone**: +91 9876543210\n- **Location**: Kochi, Kerala, India\n\n## Business Hours\n\nMonday - Saturday: 10 AM - 7 PM IST\n\n## Response Time\n\nWe typically respond within 24 hours.",
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'terms',
        title: 'Terms and Conditions',
        content:
          '# Terms and Conditions\n\n**Last Updated**: January 2024\n\n## 1. Acceptance\n\nBy using GGS, you agree to these terms.\n\n## 2. User Responsibilities\n\n- Provide accurate information\n- Not post prohibited items\n- Complete transactions honestly\n\n## 3. Listing Fee\n\nA ₹10 service fee is charged per listing to maintain platform quality.\n\n## 4. Prohibited Items\n\n- Stolen goods\n- Counterfeit products\n- Illegal software\n- Pirated games\n\n## 5. Termination\n\nWe reserve the right to terminate accounts that violate these terms.',
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content:
          '# Privacy Policy\n\n**Last Updated**: January 2024\n\n## Information We Collect\n\n- Account information (name, email, phone)\n- Listing details\n- Transaction history\n\n## How We Use Your Information\n\n- To provide our services\n- To communicate with you\n- To ensure platform security\n\n## Data Security\n\nWe implement appropriate security measures to protect your personal information.\n\n## Contact\n\nFor privacy concerns, email us at privacy@ggs.com',
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'refund-policy',
        title: 'Refund Policy',
        content:
          '# Refund Policy\n\n**Last Updated**: January 2024\n\n## Listing Fee\n\nThe ₹10 listing fee is non-refundable once a listing goes live.\n\n## Disputes\n\nBuyer-seller disputes should be resolved between parties. GGS may assist in mediation.\n\n## Fraudulent Listings\n\nIf a listing is removed due to fraud, you may be eligible for a refund.\n\n## Contact\n\nFor refund requests, email support@ggs.com',
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'prohibited-items',
        title: 'Prohibited Items',
        content:
          '# Prohibited Items\n\nThe following items are not allowed on GGS:\n\n## Hardware\n- Stolen equipment\n- Counterfeit products\n- Damaged items sold as working\n\n## Digital\n- Stolen accounts\n- Pirated software\n- Cheats/hacks\n- Accounts obtained through fraud\n\n## General\n- Items from sanctioned countries\n- Illegal modifications\n\nViolating these rules will result in account termination.',
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        slug: 'verified-sellers',
        title: 'Verified Sellers',
        content:
          "# Verified Sellers Program\n\n## What is Verification?\n\nVerified sellers have completed our KYC process, proving their identity and reliability.\n\n## Benefits\n\n- **Trust Badge**: Display on all your listings\n- **Priority Support**: Faster response from our team\n- **Featured Placement**: Higher visibility in search\n\n## How to Get Verified\n\n1. Go to Dashboard → Settings\n2. Click 'Apply for Verification'\n3. Submit required documents\n4. Wait 2-3 business days for review\n\n## Requirements\n\n- Valid government ID\n- Phone number verification\n- At least 3 successful transactions",
        updated_at: new Date().toISOString()
      }
    ];
    // Seed rich static pages and educational blog articles
    const { seedOrUpdateContent } = require('../utils/seedContent');
    await seedOrUpdateContent();

    return res.status(200).json({
      message: 'Database seeded successfully',
      admin_email: 'admin@ggs.com',
      admin_password: 'admin123'
    });
  } catch (error) {
    console.error('Seed database error:', error);
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  seedDatabase
};
