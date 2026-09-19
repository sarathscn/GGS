const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Category = require('../models/Category');
const StaticPage = require('../models/StaticPage');
const { STATIC_PAGES } = require('./seedContent');

const ADMIN_EMAIL = 'admin@ggs.com';
const ADMIN_PASSWORD_PLAIN = 'N166@2077#rSix';

const DEFAULT_CATEGORIES = [
  {
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

/**
 * Non-destructive initialization:
 * Ensures the administrator account, required taxonomy, and static legal pages exist.
 * NEVER deletes or overwrites user-created posts, users, messages, or comments.
 */
async function initAdminAndInfrastructure() {
  try {
    // 1. Ensure Administrator Account
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD_PLAIN, 10);
      const adminDoc = new User({
        id: uuidv4(),
        email: ADMIN_EMAIL.toLowerCase(),
        phone: '+919876543210',
        password: hashedPassword,
        name: 'Administrator',
        username: 'admin',
        auth_type: 'email',
        role: 'admin',
        is_verified: true,
        is_seller_verified: true,
        is_suspended: false,
        is_email_verified: true,
        is_phone_verified: true,
        avatar: null,
        avatar_type: 'image',
        avatar_emoji: null,
        location: 'Kochi, Kerala',
        bio: 'Game Gear Swap Administrator',
        rating_avg: 5.0,
        rating_count: 0,
        created_at: new Date().toISOString()
      });
      await adminDoc.save();
      console.log(`🛡️  Administrator account verified/created: ${ADMIN_EMAIL}`);
    } else {
      // Ensure role is admin if not set
      if (existingAdmin.role !== 'admin') {
        await User.updateOne({ id: existingAdmin.id }, { $set: { role: 'admin' } });
      }
    }

    // 2. Ensure Categories Taxonomy (non-destructive insert if empty)
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
        id: uuidv4(),
        ...cat
      }));
      await Category.insertMany(categoriesToInsert);
      console.log(`📂 Initialized ${categoriesToInsert.length} marketplace categories.`);
    }

    // 3. Ensure Static Legal Pages and Blog Posts (including Safety & Fraud Center)
    const { seedOrUpdateContent } = require('./seedContent');
    await seedOrUpdateContent();
  } catch (error) {
    console.error('Error in initAdminAndInfrastructure:', error.message);
  }
}

module.exports = {
  ADMIN_EMAIL,
  ADMIN_PASSWORD_PLAIN,
  DEFAULT_CATEGORIES,
  initAdminAndInfrastructure
};
