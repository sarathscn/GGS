const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Models
const User = require('../models/User');
const Listing = require('../models/Listing');
const Category = require('../models/Category');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const KYCSubmission = require('../models/KYCSubmission');
const SupportTicket = require('../models/SupportTicket');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const ModerationRecord = require('../models/ModerationRecord');
const StaticPage = require('../models/StaticPage');
const { STATIC_PAGES } = require('./seedContent');
const { initAdminAndInfrastructure } = require('./initAdmin');

// Kerala Location Data
const KERALA_DISTRICTS_DATA = [
  {
    name: 'Ernakulam',
    lat: 9.9816,
    lng: 76.2999,
    taluks: [
      { name: 'Kanayannur', areas: ['Edappally', 'Kaloor', 'MG Road', 'Palarivattom', 'Vyttila', 'Panampilly Nagar', 'Kadavanthra', 'Marine Drive'] },
      { name: 'Kochi', areas: ['Fort Kochi', 'Mattancherry', 'Thoppumpady', 'Willingdon Island', 'Palluruthy'] },
      { name: 'Aluva', areas: ['Aluva Town', 'Angamaly', 'Nedumbassery', 'Kalady', 'Chengamanad'] },
      { name: 'Kunnathunad', areas: ['Kakkanad', 'Infopark', 'Perumbavoor', 'Kizhakkambalam', 'Pattimattom'] },
      { name: 'Muvattupuzha', areas: ['Muvattupuzha Town', 'Vazhakulam', 'Piravom', 'Koothattukulam'] }
    ]
  },
  {
    name: 'Thiruvananthapuram',
    lat: 8.5241,
    lng: 76.9366,
    taluks: [
      { name: 'Thiruvananthapuram', areas: ['Kazhakkoottam', 'Technopark', 'Palayam', 'Kowdiar', 'Pattom', 'Vellayambalam', 'Statue', 'Thampanoor', 'Sreekaryam'] },
      { name: 'Neyyattinkara', areas: ['Neyyattinkara Town', 'Balaramapuram', 'Vizhinjam', 'Kovalam', 'Poovar'] },
      { name: 'Nedumangad', areas: ['Nedumangad Town', 'Vembayam', 'Aruvikkara', 'Venjaramoodu'] },
      { name: 'Chirayinkeezhu', areas: ['Attingal', 'Varkala', 'Kilimanoor', 'Kadakkavoor'] }
    ]
  },
  {
    name: 'Kozhikode',
    lat: 11.2588,
    lng: 75.7804,
    taluks: [
      { name: 'Kozhikode', areas: ['Mavoor Road', 'SM Street', 'Palayam', 'Nadakkavu', 'West Hill', 'Elathur', 'Medical College', 'Kallayi'] },
      { name: 'Vadakara', areas: ['Vadakara Town', 'Chorode', 'Onchiyam', 'Villiappally', 'Azhiyur'] },
      { name: 'Koyilandy', areas: ['Koyilandy Town', 'Balussery', 'Atholi', 'Chemancheri'] },
      { name: 'Thamarassery', areas: ['Thamarassery Town', 'Koduvally', 'Mukkam', 'Kunnamangalam'] }
    ]
  },
  {
    name: 'Thrissur',
    lat: 10.5276,
    lng: 76.2144,
    taluks: [
      { name: 'Thrissur', areas: ['Swaraj Round', 'East Fort', 'Ayyanthole', 'Ollur', 'Mannuthy', 'Puzhakkal', 'Koorkenchery'] },
      { name: 'Chalakudy', areas: ['Chalakudy Town', 'Koratty', 'Muringoor', 'Potta'] },
      { name: 'Mukundapuram', areas: ['Irinjalakuda', 'Pudukkad', 'Kodakara', 'Nenmenikkara'] },
      { name: 'Chavakkad', areas: ['Guruvayur', 'Chavakkad Town', 'Kunnamkulam', 'Pavaratty'] },
      { name: 'Kodungallur', areas: ['Kodungallur Town', 'Methala', 'Lokamaleswaram', 'Eriyad'] }
    ]
  },
  {
    name: 'Kottayam',
    lat: 9.5916,
    lng: 76.5222,
    taluks: [
      { name: 'Kottayam', areas: ['Kottayam Town', 'Kumaranalloor', 'Nattakom', 'Manarcadu', 'Vijayapuram', 'Ayarkkunnam'] },
      { name: 'Changanassery', areas: ['Changanassery Town', 'Vazhappally', 'Perunna', 'Kurichi', 'Madappally'] },
      { name: 'Meenachil', areas: ['Pala', 'Erattupetta', 'Bharananganam', 'Kidangoor', 'Ramapuram'] },
      { name: 'Kanjirappally', areas: ['Kanjirappally Town', 'Mundakayam', 'Ponkunnam', 'Chirakkadavu'] }
    ]
  },
  {
    name: 'Palakkad',
    lat: 10.7867,
    lng: 76.6548,
    taluks: [
      { name: 'Palakkad', areas: ['Palakkad Town', 'Kalpathy', 'Pirayiri', 'Marutharode', 'Kanjikode'] },
      { name: 'Ottapalam', areas: ['Ottapalam Town', 'Shoranur', 'Cherpulassery', 'Vaniyamkulam'] },
      { name: 'Alathur', areas: ['Alathur Town', 'Vadakkencherry', 'Kuzhalmannam', 'Tarur'] }
    ]
  },
  {
    name: 'Malappuram',
    lat: 11.0510,
    lng: 76.0711,
    taluks: [
      { name: 'Eranad', areas: ['Manjeri Town', 'Malappuram Town', 'Kondotty', 'Edavanna'] },
      { name: 'Tirur', areas: ['Tirur Town', 'Tanur', 'Valanchery', 'Kottakkal'] },
      { name: 'Perinthalmanna', areas: ['Perinthalmanna Town', 'Angadippuram', 'Melattur'] }
    ]
  },
  {
    name: 'Kollam',
    lat: 8.8932,
    lng: 76.6141,
    taluks: [
      { name: 'Kollam', areas: ['Chinnakada', 'Asramam', 'Tangasseri', 'Kilikolloor', 'Kavanad'] },
      { name: 'Karunagappally', areas: ['Karunagappally Town', 'Oachira', 'Chavara', 'Clappana'] },
      { name: 'Kottarakkara', areas: ['Kottarakkara Town', 'Puthur', 'Neduvathoor', 'Ezhukone'] }
    ]
  },
  {
    name: 'Kannur',
    lat: 11.8745,
    lng: 75.3704,
    taluks: [
      { name: 'Kannur', areas: ['Kannur City', 'Puzhathi', 'Pallikkunnu', 'Edakkad', 'Azhikode'] },
      { name: 'Thalassery', areas: ['Thalassery Town', 'Kuthuparamba', 'Panoor', 'Dharmadam'] },
      { name: 'Payyanur', areas: ['Payyanur Town', 'Cherupuzha', 'Peringome', 'Karivellur'] }
    ]
  },
  {
    name: 'Alappuzha',
    lat: 9.4981,
    lng: 76.3388,
    taluks: [
      { name: 'Ambalappuzha', areas: ['Alappuzha Town', 'Mullakkal', 'Punnapra', 'Aryad'] },
      { name: 'Cherthala', areas: ['Cherthala Town', 'Aroor', 'Thuravoor', 'Mararikulam'] }
    ]
  },
  {
    name: 'Pathanamthitta',
    lat: 9.2648,
    lng: 76.7870,
    taluks: [
      { name: 'Kozhencherry', areas: ['Pathanamthitta Town', 'Kozhencherry Town', 'Omallur', 'Elanthoor'] },
      { name: 'Thiruvalla', areas: ['Thiruvalla Town', 'Kuttoor', 'Kavumbhagom', 'Peringara'] },
      { name: 'Adoor', areas: ['Adoor Town', 'Pandalam', 'Enadimangalam', 'Kadampanad'] }
    ]
  },
  {
    name: 'Kasaragod',
    lat: 12.4996,
    lng: 74.9869,
    taluks: [
      { name: 'Kasaragod', areas: ['Kasaragod Town', 'Kumbla', 'Badiadka', 'Chengala'] },
      { name: 'Hosdurg', areas: ['Kanhangad Town', 'Nileshwaram', 'Cheruvathur', 'Trikarpur'] }
    ]
  },
  {
    name: 'Wayanad',
    lat: 11.6854,
    lng: 76.1320,
    taluks: [
      { name: 'Vythiri', areas: ['Kalpetta Town', 'Meppadi', 'Vythiri', 'Pozhuthana'] },
      { name: 'Sulthan Bathery', areas: ['Sulthan Bathery Town', 'Ambalavayal', 'Meenangadi'] },
      { name: 'Mananthavady', areas: ['Mananthavady Town', 'Panamaram', 'Thirunelly'] }
    ]
  },
  {
    name: 'Idukki',
    lat: 9.9189,
    lng: 77.1025,
    taluks: [
      { name: 'Thodupuzha', areas: ['Thodupuzha Town', 'Muttom', 'Kumaramangalam', 'Karikode'] },
      { name: 'Devikulam', areas: ['Munnar', 'Devikulam Town', 'Adimali', 'Marayoor'] },
      { name: 'Udumbanchola', areas: ['Nedumkandam', 'Kattappana Town', 'Rajakkad'] }
    ]
  }
];

// Names for Kerala & Pan-Indian Gamers
const FIRST_NAMES = [
  'Arjun', 'Nikhil', 'Ananya', 'Rahul', 'Sneha', 'Fahad', 'Devika', 'Gokul', 'Vivek', 'Aishwarya',
  'Siddharth', 'Meera', 'Kevin', 'Rohan', 'Diya', 'Abhishek', 'Malavika', 'Vishnu', 'Keerthi', 'Ashwin',
  'Shruti', 'Hari', 'Pooja', 'Deepak', 'Anjali', 'Kiran', 'Reshma', 'Naveen', 'Arya', 'Sanjay',
  'Gautham', 'Lakshmi', 'Akash', 'Swathi', 'Pranav', 'Nandana', 'Aditya', 'Aparna', 'Manoj', 'Gayathri',
  'Suraj', 'Divya', 'Sreehari', 'Neethu', 'Varun', 'Rhea', 'Aravind', 'Haritha', 'Midhun', 'Athira',
  'Sarath', 'Shreya', 'Farhan', 'Pavithra', 'Joel', 'Donna', 'Justin', 'Anupama', 'Alen', 'Sandra',
  'Nithin', 'Amritha', 'Akhil', 'Gopika', 'Ajay', 'Varsha', 'Sachin', 'Parvathi', 'Jithin', 'Krishnapriya',
  'Basil', 'Sreelakshmi', 'Mathew', 'Angel', 'Roshan', 'Ganga', 'Sudev', 'Archana', 'Harikrishnan', 'Maya',
  'Vaisakh', 'Kavya', 'Amal', 'Aparna', 'Bipin', 'Namitha', 'Manu', 'Deepthi', 'Govind', 'Preethi'
];

const LAST_NAMES = [
  'Menon', 'Nair', 'Varma', 'Pillai', 'Kurian', 'Mathew', 'Thomas', 'George', 'Rahman', 'Joseph',
  'Suresh', 'Krishna', 'Das', 'Kumar', 'Chandran', 'Prasad', 'Nambiar', 'Babu', 'Mohan', 'Raj',
  'Kaimal', 'Panicker', 'Shenoy', 'Prabhu', 'Hussain', 'Ali', 'Iyer', 'Sharma', 'Verma', 'Patel',
  'Fernandez', 'D Souza', 'Varghese', 'Chacko', 'Koshy', 'Jacob', 'Antony', 'Paul', 'Philip', 'Alexander',
  'Unnithan', 'Thampi', 'Kartha', 'Warrier', 'Pisharody', 'Nedungadi', 'Moopan', 'Rawther', 'Shaikh', 'Khan'
];

const GAMER_TAGS = [
  'tech', 'rigs', 'gaming', 'fps', 'builds', 'overclock', 'custom', 'modder', 'swap', 'pro',
  'zone', 'arcade', 'speed', 'forge', 'volt', 'pixel', 'clutch', 'stream', 'setup', 'vibe',
  'kerala', 'kochi', 'gamer', 'hub', 'prime', 'titan', 'apex', 'matrix', 'cyber', 'quest'
];

const BIOS = [
  'PC hardware enthusiast & competitive Valorant / CS2 player. Selling well-maintained pre-owned parts with boxes.',
  'Software developer in Infopark Kochi by day, sim racer by night. Upgrading my triple-monitor rig regularly.',
  'Casual console gamer moving to a compact ITX build. All listed items tested thoroughly in air-conditioned room.',
  'Hardware modder & custom mechanical keyboard builder in Trivandrum. Open to safe public meetups.',
  'Dedicated tech collector. Selling mint condition graphics cards, processors, and retro handhelds.',
  'Gamer & 3D animator. Selling spare GPUs and studio monitors in top-tier working condition.',
  'Student at CET Trivandrum. Upgrading components semester by semester. Fair prices and honest testing.',
  'Electronics engineer in Kozhikode. Stress-testing every piece with FurMark, Cinebench, and MemTest86.',
  'Esports fan & streaming enthusiast. All components come with original packaging and invoice copies where available.',
  'Console collector selling duplicate PS5, Xbox Series X, and Nintendo Switch titles and controllers.'
];

// Hardware Image Library
const HARDWARE_IMAGES = {
  gpus: [
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80'
  ],
  cpus: [
    'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80'
  ],
  motherboards: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80'
  ],
  ram: [
    'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=800&auto=format&fit=crop&q=80'
  ],
  storage: [
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=800&auto=format&fit=crop&q=80'
  ],
  psu: [
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80'
  ],
  cooling: [
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800&auto=format&fit=crop&q=80'
  ],
  cases: [
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80'
  ],
  keyboards: [
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80'
  ],
  mouse: [
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80'
  ],
  headsets: [
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
  ],
  controllers: [
    'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&auto=format&fit=crop&q=80'
  ],
  monitors: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80'
  ],
  consoles: [
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=80'
  ],
  systems: [
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&auto=format&fit=crop&q=80'
  ],
  digital: [
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
  ],
  accessories: [
    'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580481077197-0f8b17b35f60?w=800&auto=format&fit=crop&q=80'
  ]
};

// Item Catalog Templates by Category & Subcategory
const LISTING_TEMPLATES = [
  // PC Components
  {
    categorySlug: 'pc-components',
    subSlug: 'gpus',
    brand: 'NVIDIA / ASUS',
    model: 'ROG Strix RTX 4080 Super 16GB OC',
    title: 'ASUS ROG Strix GeForce RTX 4080 Super 16GB OC Edition',
    price: 94000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'VRAM', value: '16GB GDDR6X' },
      { key: 'Boost Clock', value: '2640 MHz' },
      { key: 'Cooling', value: 'Triple Fan Axial-tech' },
      { key: 'Warranty', value: '22 Months Remaining with Bill & Box' },
      { key: 'Power Connector', value: '16-Pin 12VHPWR' }
    ],
    desc: 'Selling my ASUS ROG Strix RTX 4080 Super OC. Purchased from MDComputers with authentic GST invoice. Used exclusively in an air-conditioned studio for 3D rendering and light 4K gaming. Max temperature under FurMark stress test is 62°C. Zero coil whine. Complete retail box and 16-pin power adapter included. Stress-testing in person welcome in Kochi.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'gpus',
    brand: 'Gigabyte',
    model: 'GeForce RTX 4070 Ti Super Gaming OC 16GB',
    title: 'Gigabyte RTX 4070 Ti Super Gaming OC 16GB GDDR6X',
    price: 72000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'VRAM', value: '16GB GDDR6X 256-bit' },
      { key: 'Boost Clock', value: '2655 MHz' },
      { key: 'Warranty', value: '30 Months India Warranty' },
      { key: 'Condition', value: 'Flawless 10/10' }
    ],
    desc: 'Pristine Gigabyte RTX 4070 Ti Super 16GB. Excellent 1440p and 4K high refresh rate gaming card with DLSS 3.5 frame generation. Bill, box, anti-sag bracket, and warranty card all intact.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'gpus',
    brand: 'MSI',
    model: 'GeForce RTX 3080 Gaming X Trio 10GB',
    title: 'MSI RTX 3080 Gaming X Trio 10GB GDDR6X Triple Fan',
    price: 36500,
    priceType: 'negotiable',
    condition: 'Excellent',
    itemType: 'physical',
    specs: [
      { key: 'VRAM', value: '10GB GDDR6X' },
      { key: 'Thermal Pads', value: 'Fresh Gelid Ultimate Repasted' },
      { key: 'Condition', value: 'Clean & Dust-free' }
    ],
    desc: 'Very well maintained MSI RTX 3080 Gaming X Trio. Freshly serviced with premium Gelid Extreme thermal pads and Noctua NT-H2 paste. Memory junction temps stay under 78°C under full load.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'cpus',
    brand: 'AMD',
    model: 'Ryzen 7 7800X3D',
    title: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread 3D V-Cache Processor',
    price: 33000,
    priceType: 'fixed',
    condition: 'Brand New',
    itemType: 'physical',
    specs: [
      { key: 'Cores / Threads', value: '8 Cores / 16 Threads' },
      { key: 'L3 Cache', value: '96MB 3D V-Cache' },
      { key: 'Socket', value: 'AM5' },
      { key: 'Warranty', value: '3 Years National Warranty' }
    ],
    desc: 'The world fastest gaming CPU. Brand new sealed pack with box and invoice from PrimeABGB. Never installed or overclocked. Supports DDR5 memory on all B650 and X670 motherboards.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'cpus',
    brand: 'Intel',
    model: 'Core i7-14700K',
    title: 'Intel Core i7-14700K 20-Core (8P+12E) Desktop Processor',
    price: 34500,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Cores', value: '20 Cores (8 Performance + 12 Efficient)' },
      { key: 'Max Turbo', value: 'Up to 5.6 GHz' },
      { key: 'Socket', value: 'LGA1700' }
    ],
    desc: 'Great multi-threaded CPU for premiere video editing, Unreal Engine, and gaming. Used for 4 months with 360mm AIO cooler. Stable voltages on latest BIOS microcode.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'motherboards',
    brand: 'ASUS',
    model: 'ROG STRIX B650-A GAMING WIFI',
    title: 'ASUS ROG Strix B650-A Gaming WiFi White AM5 Motherboard',
    price: 18500,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Form Factor', value: 'ATX' },
      { key: 'VRM', value: '12+2 Power Stages' },
      { key: 'PCIe 5.0', value: 'PCIe 5.0 M.2 Slot' },
      { key: 'WiFi', value: 'WiFi 6E + 2.5G LAN' }
    ],
    desc: 'Gorgeous silver/white aesthetic motherboard for AMD Ryzen 7000/8000/9000 series CPUs. Comes with WiFi magnetic antenna, SATA cables, M.2 thermal pads, and box.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'ram',
    brand: 'G.Skill',
    model: 'Trident Z5 Neo RGB 32GB (2x16GB) DDR5 6000MHz CL30',
    title: 'G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5-6000 CL30 AMD EXPO',
    price: 9800,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Capacity', value: '32GB (2 x 16GB)' },
      { key: 'Speed', value: 'DDR5-6000 MT/s' },
      { key: 'Timings', value: 'CL30-38-38-96' },
      { key: 'Profile', value: 'AMD EXPO Certified' }
    ],
    desc: 'The optimal sweet-spot memory kit for AMD AM5 systems with tight CL30 sub-timings. Lifetime warranty from Acro Engineering. Flawless RGB lighting.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'storage',
    brand: 'Samsung',
    model: '990 PRO 2TB NVMe PCIe 4.0 SSD',
    title: 'Samsung 990 PRO 2TB PCIe 4.0 M.2 Internal NVMe SSD (7450 MB/s)',
    price: 13500,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Capacity', value: '2TB' },
      { key: 'Read Speed', value: 'Up to 7,450 MB/s' },
      { key: 'Write Speed', value: 'Up to 6,900 MB/s' },
      { key: 'Health Status', value: '100% in Samsung Magician (1.2 TBW written)' }
    ],
    desc: 'Top-tier gen 4 SSD for PS5 storage expansion or high-end Windows PC. Extremely low write cycles. Complete with original packaging.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'psu',
    brand: 'Corsair',
    model: 'RM850x 850W 80+ Gold Fully Modular',
    title: 'Corsair RM850x 850 Watt 80 PLUS Gold Certified Modular PSU',
    price: 8500,
    priceType: 'fixed',
    condition: 'Excellent',
    itemType: 'physical',
    specs: [
      { key: 'Wattage', value: '850 Watts' },
      { key: 'Efficiency', value: '80 PLUS Gold' },
      { key: 'Warranty', value: '10-Year Corsair Warranty (6 Yrs Left)' },
      { key: 'Fan Mode', value: 'Zero RPM Silent Fan' }
    ],
    desc: 'Tier-A power supply with Japanese 105°C capacitors. All modular cables, velvet cable pouch, and original box included.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'cooling',
    brand: 'DeepCool',
    model: 'LT720 360mm Liquid Cooler',
    title: 'DeepCool LT720 High-Performance 360mm AIO Liquid CPU Cooler',
    price: 7200,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Radiator', value: '360mm Aluminum' },
      { key: 'Pump', value: '4th Gen Dual-Chamber Pump' },
      { key: 'Infinity Mirror', value: 'Multidimensional ARGB Block' }
    ],
    desc: 'Excellent liquid cooler capable of handling 250W+ loads with ease. Includes Intel LGA1700 and AMD AM5 brackets.'
  },
  {
    categorySlug: 'pc-components',
    subSlug: 'cases',
    brand: 'Lian Li',
    model: 'O11 Dynamic EVO White',
    title: 'Lian Li O11 Dynamic EVO Mid-Tower Case - Pure White',
    price: 11000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Form Factor', value: 'Dual-Chamber Mid-Tower' },
      { key: 'Panels', value: 'Tempered Glass Front & Side' },
      { key: 'Color', value: 'Pure Snow White' }
    ],
    desc: 'Showcase dual-chamber PC case in immaculate condition with no scratches on tempered glass. Includes all drive cages and accessories.'
  },

  // Gaming Peripherals
  {
    categorySlug: 'peripherals',
    subSlug: 'keyboards',
    brand: 'Keychron',
    model: 'Q1 Pro Wireless Custom Mechanical Keyboard',
    title: 'Keychron Q1 Pro 75% QMK/VIA Wireless Custom Mechanical Keyboard',
    price: 14500,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Body', value: 'Full CNC Aluminum' },
      { key: 'Switches', value: 'Gateron Jupiter Banana (Lubed)' },
      { key: 'Connectivity', value: 'Bluetooth 5.1 + Type-C' },
      { key: 'Keycaps', value: 'KSA Double-Shot PBT' }
    ],
    desc: 'Heavyweight custom aluminum mechanical keyboard with gasket mount design. Incredible creamy typing sound with tape mod and force break mod. Supports Mac & Windows.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'keyboards',
    brand: 'Wooting',
    model: '60HE+ Rapid Trigger',
    title: 'Wooting 60HE+ Analog Rapid Trigger Gaming Keyboard',
    price: 19500,
    priceType: 'negotiable',
    condition: 'Brand New',
    itemType: 'physical',
    specs: [
      { key: 'Switches', value: 'Lekker Hall Effect Magnetic' },
      { key: 'Rapid Trigger', value: '0.1mm Adjustable Actuation' },
      { key: 'Polling Rate', value: '1000Hz True' }
    ],
    desc: 'The gold standard esports keyboard for Valorant and Apex Legends. Ultra-fast rapid trigger actuation. Brand new in sealed box.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'mouse',
    brand: 'Logitech G',
    model: 'PRO X SUPERLIGHT 2 Wireless',
    title: 'Logitech G PRO X SUPERLIGHT 2 Wireless Gaming Mouse - White',
    price: 10500,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Weight', value: '60g Ultra-Lightweight' },
      { key: 'Sensor', value: 'HERO 2 32,000 DPI' },
      { key: 'Switches', value: 'LIGHTFORCE Hybrid Optical-Mechanical' },
      { key: 'Polling', value: '4000Hz Support' }
    ],
    desc: 'Used for 1 month with Corepad skate upgrades. Flawless battery life and pristine white coating with zero shine or wear.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'mouse',
    brand: 'Razer',
    model: 'Viper V3 Pro Wireless',
    title: 'Razer Viper V3 Pro Ultra-lightweight Wireless Gaming Mouse (54g)',
    price: 12000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Weight', value: '54 grams' },
      { key: 'Polling', value: '8000Hz HyperPolling Dongle Included' },
      { key: 'Sensor', value: 'Focus Pro 35K Optical Sensor Gen-2' }
    ],
    desc: 'Razer flagship competitive mouse. Includes 8K wireless dongle, USB-C cable, and box. Used sparingly by an FPS player.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'headsets',
    brand: 'HyperX',
    model: 'Cloud III Wireless',
    title: 'HyperX Cloud III Wireless Gaming Headset with 120-Hour Battery',
    price: 11000,
    priceType: 'fixed',
    condition: 'Brand New',
    itemType: 'physical',
    specs: [
      { key: 'Battery', value: 'Up to 120 Hours' },
      { key: 'Drivers', value: 'Angled 53mm Audio Drivers' },
      { key: 'Microphone', value: '10mm Ultra-Clear Mic with LED Mute' }
    ],
    desc: 'Brand new unopened HyperX Cloud III Wireless. Unmatched memory foam comfort with DTS Headphone:X spatial audio.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'controllers',
    brand: 'Sony',
    model: 'DualSense Edge Wireless Controller',
    title: 'PlayStation DualSense Edge Wireless Pro Controller for PS5 & PC',
    price: 13500,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Customization', value: 'Swappable Stick Modules & Back Paddles' },
      { key: 'Triggers', value: 'Adjustable Trigger Stops' },
      { key: 'Case', value: 'Hardshell Carrying Case & Braided Cable' }
    ],
    desc: 'Sony official pro controller with back paddles, customizable profiles, and swappable analog modules. Complete in carrying case.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'monitors',
    brand: 'LG',
    model: 'UltraGear 27GR95QE-B 240Hz OLED',
    title: 'LG UltraGear 27-inch QHD (2560x1440) 240Hz 0.03ms OLED Gaming Monitor',
    price: 52000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Panel', value: '27" OLED 2560 x 1440 QHD' },
      { key: 'Refresh Rate', value: '240Hz' },
      { key: 'Response Time', value: '0.03ms (GtG)' },
      { key: 'Color Gamut', value: 'DCI-P3 98.5%' }
    ],
    desc: 'Incredible OLED gaming monitor with true blacks, 0.03ms instant response, and 240Hz smoothness. Zero pixel defects or burn-in. Comes with remote, stand, power brick, and box.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'monitors',
    brand: 'BenQ ZOWIE',
    model: 'XL2546K 240Hz DyAc+',
    title: 'BenQ ZOWIE XL2546K 24.5-Inch 240Hz Esports Gaming Monitor with DyAc+',
    price: 31000,
    priceType: 'fixed',
    condition: 'Excellent',
    itemType: 'physical',
    specs: [
      { key: 'Refresh Rate', value: '240Hz Native' },
      { key: 'Technology', value: 'DyAc+ DyAc Plus Motion Blur Reduction' },
      { key: 'Shield', value: 'Side Privacy Shields Included' }
    ],
    desc: 'The official monitor of CS2 Major tournaments. Unrivaled motion clarity for tracking opponents. Complete with S-Switch and side shields.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'capture-cards',
    brand: 'Elgato',
    model: '4K X Capture Card',
    title: 'Elgato 4K X USB 3.2 Gen 2 Ultra-Low Latency HDMI 2.1 Capture Card',
    price: 18000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Passthrough', value: '4K144 / 1440p240 HDR VRR' },
      { key: 'Capture', value: 'Up to 4K144 on PC/Mac' }
    ],
    desc: 'Next-gen HDMI 2.1 capture card for PS5 / Xbox Series X / dual PC streaming setups.'
  },
  {
    categorySlug: 'peripherals',
    subSlug: 'webcams',
    brand: 'Elgato',
    model: 'Facecam Pro 4K60',
    title: 'Elgato Facecam Pro - True 4K60 Ultra HD Studio Webcam',
    price: 22000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Resolution', value: '4K at 60 FPS Uncompressed' },
      { key: 'Sensor', value: 'Sony STARVIS CMOS Sensor' }
    ],
    desc: 'DSLR-grade webcam with autofocus and manual optical adjustments via Camera Hub.'
  },

  // Gaming Consoles
  {
    categorySlug: 'consoles',
    subSlug: 'playstation',
    brand: 'Sony',
    model: 'PlayStation 5 Slim Disc Edition 1TB',
    title: 'Sony PlayStation 5 Slim 1TB Disc Edition with 2 DualSense Controllers',
    price: 43500,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Model', value: 'CFI-2000 PS5 Slim Disc Edition' },
      { key: 'Storage', value: '1TB Custom High-Speed SSD' },
      { key: 'Controllers', value: '2 Original White DualSense Controllers' },
      { key: 'Games Included', value: 'Spider-Man 2 & God of War Ragnarok Disc' }
    ],
    desc: 'PS5 Slim Disc edition bought from Reliance Digital Kochi. 8 months warranty remaining with invoice. Includes 2 original DualSense controllers and 2 blockbuster disc games. In-person testing available.'
  },
  {
    categorySlug: 'consoles',
    subSlug: 'xbox',
    brand: 'Microsoft',
    model: 'Xbox Series X 1TB',
    title: 'Microsoft Xbox Series X 1TB Console 4K 120FPS with Game Pass Ready',
    price: 38000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'GPU', value: '12 TFLOPS RDNA 2' },
      { key: 'Storage', value: '1TB Custom NVMe SSD' },
      { key: 'Optical Drive', value: '4K UHD Blu-Ray' }
    ],
    desc: 'Flawless Xbox Series X console with 1 wireless controller, high-speed HDMI 2.1 cable, and box. Whisper-quiet cooling and instant Quick Resume.'
  },
  {
    categorySlug: 'consoles',
    subSlug: 'nintendo',
    brand: 'Nintendo',
    model: 'Switch OLED Model',
    title: 'Nintendo Switch OLED - Neon Blue & Neon Red with 256GB SanDisk Card',
    price: 24500,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Screen', value: '7-inch Vibrant OLED Screen' },
      { key: 'Storage', value: '64GB Internal + 256GB High-Speed MicroSD' },
      { key: 'Accessories', value: 'Dock, Joy-Con Grip, Straps, Spigen Case' }
    ],
    desc: 'Nintendo Switch OLED with tempered glass installed from day one. Zero Joy-Con drift. Comes with Spigen Rugged Armor travel case.'
  },
  {
    categorySlug: 'consoles',
    subSlug: 'handhelds',
    brand: 'Valve',
    model: 'Steam Deck OLED 512GB',
    title: 'Valve Steam Deck OLED 512GB Handheld Gaming PC with Carrying Case',
    price: 49000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Display', value: '7.4" 90Hz HDR OLED Screen' },
      { key: 'Storage', value: '512GB NVMe SSD' },
      { key: 'Battery', value: '50Wh (3-12 Hours Playtime)' }
    ],
    desc: 'The upgraded Steam Deck OLED with brighter 90Hz display, larger battery, and faster WiFi 6E. Plays Cyberpunk 2077, Elden Ring, and GTA V smoothly on the go.'
  },
  {
    categorySlug: 'consoles',
    subSlug: 'retro',
    brand: 'Sony',
    model: 'PlayStation Vita Slim (PCH-2000)',
    title: 'Sony PS Vita Slim PCH-2000 Aqua Blue with Henkaku & 128GB SD2Vita',
    price: 12500,
    priceType: 'fixed',
    condition: 'Excellent',
    itemType: 'physical',
    specs: [
      { key: 'Firmware', value: '3.65 Enso Henkaku Custom Firmware' },
      { key: 'Storage', value: '128GB SD2Vita Card with PKGj Preconfigured' }
    ],
    desc: 'Collectible Japanese Aqua Blue PS Vita Slim in pristine condition. Screen protector installed. Plays PSP, PS1, and Vita libraries natively.'
  },

  // Full Systems
  {
    categorySlug: 'systems',
    subSlug: 'custom',
    brand: 'Custom Build',
    model: 'RTX 4080 Super / Ryzen 7 7800X3D Rig',
    title: 'High-End 4K Gaming PC - Ryzen 7 7800X3D / RTX 4080 Super / 32GB DDR5 / 2TB',
    price: 185000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Processor', value: 'AMD Ryzen 7 7800X3D' },
      { key: 'Graphics Card', value: 'ZOTAC Gaming RTX 4080 Super 16GB' },
      { key: 'Motherboard', value: 'MSI MAG B650 Tomahawk WiFi' },
      { key: 'RAM', value: '32GB Corsair Vengeance RGB DDR5 6000MHz' },
      { key: 'Storage', value: '2TB WD Black SN850X Gen4 SSD' },
      { key: 'PSU', value: 'Corsair RM850e 850W Gold ATX 3.0' },
      { key: 'Case', value: 'NZXT H9 Flow Dual Chamber White' }
    ],
    desc: 'Turnkey 4K 144Hz powerhouse gaming rig built 3 months ago. Cable management done to perfection. All individual component boxes and bills included. Stress test in person before payment.'
  },
  {
    categorySlug: 'systems',
    subSlug: 'custom',
    brand: 'Custom Build',
    model: 'RTX 4070 / i5-13600K 1440p Rig',
    title: 'Custom 1440p Esports PC - Intel i5-13600K / RTX 4070 12GB / 32GB DDR5',
    price: 108000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'CPU', value: 'Intel Core i5-13600K 14-Core' },
      { key: 'GPU', value: 'Gigabyte RTX 4070 Windforce OC 12GB' },
      { key: 'RAM', value: '32GB G.Skill Ripjaws S5 DDR5 5600MHz' },
      { key: 'Storage', value: '1TB Kingston KC3000 Gen4 M.2' }
    ],
    desc: 'Clean 1440p ultra settings rig. Runs Warzone, Cyberpunk, and Battlefield at over 120 FPS.'
  },
  {
    categorySlug: 'systems',
    subSlug: 'laptops',
    brand: 'Lenovo',
    model: 'Legion Pro 7i Gen 8',
    title: 'Lenovo Legion Pro 7i Gen 8 - Core i9-13900HX / RTX 4080 12GB 175W / 32GB / 1TB 240Hz',
    price: 165000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Display', value: '16" WQXGA (2560x1600) 240Hz 500 nits HDR' },
      { key: 'CPU', value: 'Intel Core i9-13900HX 24 Cores' },
      { key: 'GPU', value: 'NVIDIA RTX 4080 12GB 175W Full TGP' },
      { key: 'RAM & SSD', value: '32GB DDR5-5600 + 1TB PCIe 4.0 NVMe' }
    ],
    desc: 'Beast gaming laptop with full 175W RTX 4080 desktop-class performance and Coldfront 5.0 vapor chamber cooling. Includes 330W GaN charger and Legion backpack.'
  },
  {
    categorySlug: 'systems',
    subSlug: 'laptops',
    brand: 'ASUS ROG',
    model: 'Zephyrus G14 OLED (2024)',
    title: 'ASUS ROG Zephyrus G14 (2024) - Ryzen 9 8945HS / RTX 4070 / 32GB / 3K 120Hz OLED',
    price: 148000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Weight', value: '1.50 kg Ultra-Slim CNC Aluminum' },
      { key: 'Screen', value: '14" 3K (2880x1800) 120Hz 0.2ms OLED' },
      { key: 'GPU', value: 'NVIDIA RTX 4070 8GB' }
    ],
    desc: 'The best portable gaming laptop in the world with stunning 3K OLED screen and all-day battery life.'
  },
  {
    categorySlug: 'systems',
    subSlug: 'prebuilt',
    brand: 'Alienware',
    model: 'Aurora R16',
    title: 'Dell Alienware Aurora R16 Gaming Desktop - i7-14700F / RTX 4070 Super / 32GB',
    price: 135000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Design', value: 'Legend 3 Airflow Redesign' },
      { key: 'Cooling', value: 'Alienware 240mm Liquid Cooling' }
    ],
    desc: 'OEM prebuilt with official Dell on-site warranty until 2026. Sleek, quiet, and powerful.'
  },
  {
    categorySlug: 'systems',
    subSlug: 'mini-pc',
    brand: 'Minisforum',
    model: 'AtomMan G7 PT',
    title: 'Minisforum AtomMan G7 PT Gaming Mini PC - Ryzen 9 7945HX / Radeon RX 7600M XT',
    price: 68000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Form Factor', value: '2.5L Compact Mini PC' },
      { key: 'CPU', value: 'AMD Ryzen 9 7945HX 16 Cores 32 Threads' },
      { key: 'GPU', value: 'AMD Radeon RX 7600M XT 8GB' }
    ],
    desc: 'Ultra-compact high performance workstation and 1080p/1440p gaming machine.'
  },

  // Digital Goods
  {
    categorySlug: 'digital',
    subSlug: 'accounts',
    brand: 'Riot Games',
    model: 'Valorant Radiant Account',
    title: 'Valorant Stacked Account - Immortal Peak with Kuronami, Prime & Reaver Bundles',
    price: 14000,
    priceType: 'negotiable',
    condition: 'Brand New',
    itemType: 'digital',
    specs: [
      { key: 'Region', value: 'Asia-Pacific / Mumbai Server' },
      { key: 'Total Skins', value: '38 Premium Vandal/Phantom/Knife Skins' },
      { key: 'First Email', value: 'Includes Full Original Email Ownership' }
    ],
    desc: 'Personal Valorant account with Kuronami Vandal & Knife, Prime 2.0, Reaver Karambit, Champions 2023 bundle, and 4500 VP. Clean MMR. Original email creation proof provided.'
  },
  {
    categorySlug: 'digital',
    subSlug: 'accounts',
    brand: 'Steam',
    model: 'Steam 10-Year Level 60 Account',
    title: 'Steam Account Level 60 - 85+ AAA Games (Cyberpunk, RDR2, Elden Ring, Baldur Gate 3)',
    price: 12000,
    priceType: 'fixed',
    condition: 'Brand New',
    itemType: 'digital',
    specs: [
      { key: 'Games Count', value: '88 Purchased Games' },
      { key: 'Account Age', value: '9 Years Clean History (No VAC Bans)' }
    ],
    desc: 'Steam account loaded with top single-player titles. Includes full email transfer and first CD-key receipt.'
  },
  {
    categorySlug: 'digital',
    subSlug: 'ingame',
    brand: 'Valve',
    model: 'CS2 Knife Skin',
    title: 'Counter-Strike 2 - Butterfly Knife | Doppler Phase 2 (Factory New 0.01 Float)',
    price: 88000,
    priceType: 'negotiable',
    condition: 'Brand New',
    itemType: 'digital',
    specs: [
      { key: 'Skin', value: 'Doppler Phase 2 (Pink Galaxy)' },
      { key: 'Float', value: '0.0142 Low Float' },
      { key: 'Delivery', value: 'Instant Steam Trade Offer' }
    ],
    desc: 'Clean pink galaxy Butterfly Knife Doppler Phase 2. Immediate trade offer once payment clears.'
  },
  {
    categorySlug: 'digital',
    subSlug: 'keys',
    brand: 'CD Projekt Red',
    model: 'Cyberpunk 2077 Ultimate Edition',
    title: 'Cyberpunk 2077: Ultimate Edition (Base Game + Phantom Liberty) Global Steam Key',
    price: 2400,
    priceType: 'fixed',
    condition: 'Brand New',
    itemType: 'digital',
    specs: [
      { key: 'Platform', value: 'Steam (Global Activation)' },
      { key: 'Includes', value: 'Base Game + Phantom Liberty Expansion' }
    ],
    desc: 'Official unused activation code. Activate immediately on Steam.'
  },
  {
    categorySlug: 'digital',
    subSlug: 'giftcards',
    brand: 'Sony PlayStation',
    model: 'PlayStation Network Gift Card',
    title: 'PSN India ₹5,000 Wallet Top-up Digital Gift Card Code',
    price: 4450,
    priceType: 'fixed',
    condition: 'Brand New',
    itemType: 'digital',
    specs: [
      { key: 'Value', value: '₹5,000 INR Wallet Balance' },
      { key: 'Region', value: 'India PSN Store' }
    ],
    desc: 'Digital wallet recharge card code. Unredeemed voucher code provided upon transaction.'
  },

  // Accessories
  {
    categorySlug: 'accessories',
    subSlug: 'chairs',
    brand: 'Secretlab',
    model: 'TITAN Evo Stealth Edition',
    title: 'Secretlab TITAN Evo Gaming Chair - Regular Size / NEO Hybrid Leatherette',
    price: 32000,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Size', value: 'Regular (Recommended 170-189cm, <100kg)' },
      { key: 'Material', value: 'NEO Hybrid Leatherette (Stealth Black)' },
      { key: 'Lumbar Support', value: '4-Way L-ADAPT Integrated Lumbar System' },
      { key: 'Head Pillow', value: 'Magnetic Memory Foam with Cooling Gel' }
    ],
    desc: 'The best ergonomic gaming chair. Zero tears or peeling. Used in smoke-free home with AC. Includes magnetic head pillow.'
  },
  {
    categorySlug: 'accessories',
    subSlug: 'desks',
    brand: 'Eureka Ergonomic',
    model: '60" Electric Standing Desk',
    title: 'Eureka Ergonomic 60-Inch Electric Height Adjustable Gaming Desk with Mousepad',
    price: 21000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Dimensions', value: '60" x 27" Carbon Fiber Texture Top' },
      { key: 'Motor', value: 'Dual Motor with 4 Memory Presets' }
    ],
    desc: 'Sturdy motorized sit-stand desk with full desk custom mousepad, cable management tray, and cup holder.'
  },
  {
    categorySlug: 'accessories',
    subSlug: 'cables',
    brand: 'CableMod',
    model: 'Pro ModMesh Sleeved Cable Kit',
    title: 'CableMod Pro ModMesh 12VHPWR Sleeved Cable Kit for Corsair PSUs - Carbon',
    price: 4500,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Compatibility', value: 'Corsair Type 4 PSUs' },
      { key: 'Color', value: 'Carbon Black' }
    ],
    desc: 'Premium individually sleeved replacement cables with pre-installed closed aluminum combs.'
  },
  {
    categorySlug: 'accessories',
    subSlug: 'stands',
    brand: 'Ergotron',
    model: 'LX Monitor Arm',
    title: 'Ergotron LX Desk Mount Single Monitor Arm - Polished Aluminum',
    price: 11500,
    priceType: 'negotiable',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Capacity', value: 'Up to 34" Monitors (3.2 to 11.3 kg)' },
      { key: 'Adjustment', value: 'Full Motion Gas Spring' }
    ],
    desc: 'Heavy-duty monitor arm that holds heavy 27-34 inch monitors rock solid.'
  },
  {
    categorySlug: 'accessories',
    subSlug: 'rgb',
    brand: 'Philips Hue',
    model: 'Play Gradient Lightstrip for PC',
    title: 'Philips Hue Play Gradient Lightstrip for 24-27 Inch PC Monitors with Bridge',
    price: 13000,
    priceType: 'fixed',
    condition: 'Like New',
    itemType: 'physical',
    specs: [
      { key: 'Compatibility', value: 'Single 24-27" Monitor' },
      { key: 'Sync', value: 'Real-time On-screen Color Matching' }
    ],
    desc: 'Immersive reactive ambient lighting strip with Hue Bridge included.'
  }
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function randomDateBetween(startDaysAgo, endDaysAgo = 0) {
  const now = Date.now();
  const startTime = now - startDaysAgo * 24 * 60 * 60 * 1000;
  const endTime = now - endDaysAgo * 24 * 60 * 60 * 1000;
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime).toISOString();
}

/**
 * Main seeding function: generates exactly 500 users, 500 listings, and all relational engagement records
 */
async function generateComprehensiveSeedData() {
  console.log('================================================================');
  console.log('🚀 Starting Comprehensive Synthetic Seed Data Generation for GGs');
  console.log('================================================================');

  // 1. Ensure Categories & Legal Pages exist
  await initAdminAndInfrastructure();

  const categories = await Category.find().lean();
  if (!categories || categories.length === 0) {
    throw new Error('Categories must exist before seeding.');
  }

  const adminUser = await User.findOne({ email: 'admin@ggs.com' }).lean();
  if (!adminUser) {
    throw new Error('Admin user must exist.');
  }

  console.log(`Found ${categories.length} core categories in database.`);

  // Clear previous non-admin records for a clean baseline
  console.log('Cleaning previous non-admin records to ensure exact 500 target counts...');
  await User.deleteMany({ email: { $ne: 'admin@ggs.com' } });
  await Listing.deleteMany({});
  await Payment.deleteMany({});
  await Review.deleteMany({});
  await Wishlist.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});
  await KYCSubmission.deleteMany({});
  await SupportTicket.deleteMany({});
  await Report.deleteMany({});
  await AuditLog.deleteMany({});
  await ModerationRecord.deleteMany({});

  // 2. Generate exactly 500 unique Users
  console.log('Generating 500 unique users with rich Kerala profiles...');
  const userList = [];
  const usedUsernames = new Set(['admin', 'administrator', 'root', 'ggsadmin']);
  const usedEmails = new Set(['admin@ggs.com']);
  const usedPhones = new Set();

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('UserPass123!', salt);

  for (let i = 1; i <= 500; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const tag = randomChoice(GAMER_TAGS);

    let username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`.replace(/[^a-z0-9_]/g, '');
    if (usedUsernames.has(username) || username.length < 3) {
      username = `${firstName.toLowerCase()}_${tag}_${i}`;
    }
    usedUsernames.add(username);

    const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me'];
    let email = `${username}@${randomChoice(emailDomains)}`;
    if (usedEmails.has(email)) {
      email = `${username}_${i}@${randomChoice(emailDomains)}`;
    }
    usedEmails.add(email);

    let phone = `+91 ${randomChoice(['98', '97', '94', '85', '70', '99', '96', '95'])}${randomInt(10000000, 99999999)}`;
    while (usedPhones.has(phone)) {
      phone = `+91 ${randomChoice(['98', '97', '94', '85', '70', '99', '96', '95'])}${randomInt(10000000, 99999999)}`;
    }
    usedPhones.add(phone);

    const districtObj = randomChoice(KERALA_DISTRICTS_DATA);
    const talukObj = randomChoice(districtObj.taluks);
    const areaName = randomChoice(talukObj.areas);
    const locationString = `${areaName}, ${talukObj.name}, ${districtObj.name}`;

    const isVerified = Math.random() < 0.24; // 24% verified sellers
    const isBanned = i > 485; // 15 banned users (3%) for moderation testing
    const createdAt = randomDateBetween(180, 2);

    let verificationStatus = null;
    let verifiedAt = null;
    let verifiedBy = null;
    let verificationRevokedAt = null;
    let verificationRevokedBy = null;
    let verificationRevocationReason = null;
    const moderationHistory = [];

    if (isVerified && !isBanned) {
      verificationStatus = 'verified';
      verifiedAt = randomDateBetween(120, 10);
      verifiedBy = adminUser.id;
      moderationHistory.push({
        action: 'VERIFIED',
        date: verifiedAt,
        admin_email: 'admin@ggs.com',
        reason: 'Aadhaar / Driving License verified successfully'
      });
    } else if (i % 25 === 0) {
      verificationStatus = 'revoked';
      verificationRevokedAt = randomDateBetween(30, 2);
      verificationRevokedBy = adminUser.id;
      verificationRevocationReason = 'Seller verification revoked due to unverified document photocopy.';
      moderationHistory.push({
        action: 'REVOKED',
        date: verificationRevokedAt,
        admin_email: 'admin@ggs.com',
        reason: verificationRevocationReason
      });
    }

    let banReason = null;
    let adminNotes = null;
    let bannedAt = null;
    let bannedBy = null;

    if (isBanned) {
      bannedAt = randomDateBetween(40, 1);
      bannedBy = adminUser.id;
      banReason = 'Account suspended for policy violation (Attempted unverified off-platform token advance payment).';
      adminNotes = 'User flagged by 2 separate buyers for insisting on Google Pay token advance without physical inspection.';
      moderationHistory.push({
        action: 'BANNED',
        date: bannedAt,
        admin_email: 'admin@ggs.com',
        user_visible_reason: banReason,
        admin_notes: adminNotes
      });
    }

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

    const userDoc = {
      id: uuidv4(),
      email,
      phone,
      password: commonPasswordHash,
      name: fullName,
      username,
      auth_type: i % 10 === 0 ? 'google' : (i % 8 === 0 ? 'phone' : 'email'),
      role: isVerified ? 'seller' : 'user',
      is_verified: isVerified,
      is_seller_verified: isVerified,
      is_email_verified: true,
      is_phone_verified: Math.random() < 0.88,
      google_linked: i % 10 === 0,
      google_email: i % 10 === 0 ? email : null,
      google_id: i % 10 === 0 ? `google_${uuidv4().substring(0, 12)}` : null,
      verification_status: verificationStatus,
      is_suspended: isBanned,
      is_banned: isBanned,
      avatar: avatarUrl,
      avatar_type: 'image',
      avatar_emoji: null,
      location: locationString,
      location_district: districtObj.name,
      location_taluk: talukObj.name,
      location_area: areaName,
      bio: randomChoice(BIOS),
      rating_avg: randomFloat(4.2, 5.0, 1),
      rating_count: randomInt(1, 28),
      banned_at: bannedAt,
      banned_by: bannedBy,
      ban_reason: banReason,
      admin_notes: adminNotes,
      verified_at: verifiedAt,
      verified_by: verifiedBy,
      verification_revoked_at: verificationRevokedAt,
      verification_revoked_by: verificationRevokedBy,
      verification_revocation_reason: verificationRevocationReason,
      moderation_history: moderationHistory,
      created_at: createdAt
    };

    userList.push(userDoc);
  }

  await User.insertMany(userList);
  console.log(`✅ Successfully seeded 500 users into database.`);

  // 3. Generate exactly 500 unique Listings across ALL categories
  console.log('Generating 500 unique listings distributed across all 6 categories...');
  const listingsList = [];
  const paymentsList = [];
  const auditLogsList = [];

  const totalCategories = categories.length; // 6
  const targetPerCategory = Math.floor(500 / totalCategories); // 83
  let remainder = 500 % totalCategories; // 2

  let postIndex = 1;
  const createdSlugs = new Set();

  for (let cIdx = 0; cIdx < categories.length; cIdx++) {
    const cat = categories[cIdx];
    const postsForThisCategory = targetPerCategory + (remainder > 0 ? 1 : 0);
    remainder--;

    const matchingTemplates = LISTING_TEMPLATES.filter(t => t.categorySlug === cat.slug);
    const catSubcategories = cat.subcategories || [];

    for (let p = 0; p < postsForThisCategory; p++) {
      const template = matchingTemplates.length > 0 
        ? matchingTemplates[p % matchingTemplates.length] 
        : randomChoice(LISTING_TEMPLATES);

      const subObj = catSubcategories.length > 0
        ? catSubcategories[p % catSubcategories.length]
        : null;

      const seller = userList[(postIndex - 1) % userList.length];
      const districtObj = randomChoice(KERALA_DISTRICTS_DATA);
      const talukObj = randomChoice(districtObj.taluks);
      const areaName = randomChoice(talukObj.areas);
      const locationString = `${areaName}, ${talukObj.name}, ${districtObj.name}`;

      // Status distribution: ~400 active, ~45 sold, ~30 expired, ~15 soft-deleted, ~10 pending payment
      let status = 'active';
      let paymentStatus = 'completed';
      let isDeleted = false;
      let deletedAt = null;
      let deletedBy = null;
      let deletionReason = null;
      let soldAt = null;
      let soldToUserId = null;

      if (postIndex <= 10) {
        status = 'pending_payment';
        paymentStatus = 'pending';
      } else if (postIndex <= 25) {
        status = 'deleted';
        isDeleted = true;
        deletedAt = randomDateBetween(10, 1);
        deletedBy = seller.id;
        deletionReason = 'Seller marked item as deleted / no longer available';
      } else if (postIndex <= 55) {
        status = 'expired';
      } else if (postIndex <= 100) {
        status = 'sold';
        soldAt = randomDateBetween(30, 2);
        const buyer = userList[(postIndex + 10) % userList.length];
        soldToUserId = buyer.id;
      }

      // Timing & Expiry (90-day post validity)
      let publishedAt = randomDateBetween(85, 2);
      let validityDays = 90;
      let extensionCount = 0;
      const extensionHistory = [];

      if (status === 'expired') {
        // Published >90 days ago
        publishedAt = randomDateBetween(150, 95);
      }

      const publishedTimeMs = new Date(publishedAt).getTime();
      let expiresAtTimeMs = publishedTimeMs + (validityDays * 24 * 60 * 60 * 1000);

      // Extended listings (some active listings have 30-day extension)
      if (postIndex > 100 && postIndex <= 130) {
        extensionCount = 1;
        validityDays = 120;
        const requestedAt = new Date(publishedTimeMs + 65 * 24 * 60 * 60 * 1000).toISOString();
        const approvedAt = new Date(publishedTimeMs + 66 * 24 * 60 * 60 * 1000).toISOString();
        const prevExpires = new Date(expiresAtTimeMs).toISOString();
        expiresAtTimeMs += 30 * 24 * 60 * 60 * 1000;
        const newExpires = new Date(expiresAtTimeMs).toISOString();

        extensionHistory.push({
          requested_at: requestedAt,
          approved_at: approvedAt,
          previous_expires_at: prevExpires,
          new_expires_at: newExpires,
          approved_by: adminUser.id,
          extension_days: 30,
          reason: 'Item has high interest but needs additional time for local buyer inspection meetup.',
          admin_notes: 'Verified genuine seller post with clean history. Extension approved.'
        });
      }

      const expiresAt = new Date(expiresAtTimeMs).toISOString();

      // Free Edit Allowance History
      let freeEditAllowed = false;
      let freeEditUsed = false;
      let freeEditGrantedAt = null;
      let freeEditGrantedBy = null;
      let freeEditReason = null;
      const freeEditHistory = [];

      if (postIndex > 130 && postIndex <= 150) {
        freeEditUsed = true;
        freeEditGrantedAt = randomDateBetween(60, 20);
        freeEditGrantedBy = adminUser.id;
        freeEditReason = 'Seller requested price and warranty specification adjustment.';
        freeEditHistory.push({
          granted_at: freeEditGrantedAt,
          granted_by: adminUser.id,
          reason: freeEditReason,
          used_at: randomDateBetween(19, 5)
        });
      }

      // Generate unique slug
      let title = `${template.title}`;
      if (p > 0) {
        const variants = ['Edition', 'Series', 'V2', 'Mint Condition', 'Box Pack', '1 Year Warranty', 'Invoice Available', 'Like New', 'Tested 100%'];
        title = `${template.brand} ${template.model} - ${variants[p % variants.length]}`;
      }

      let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      let slug = `${baseSlug}-${uuidv4().substring(0, 8)}`;
      while (createdSlugs.has(slug)) {
        slug = `${baseSlug}-${uuidv4().substring(0, 8)}`;
      }
      createdSlugs.add(slug);

      // Category Images
      const imgPool = HARDWARE_IMAGES[template.subSlug] || HARDWARE_IMAGES[template.categorySlug] || HARDWARE_IMAGES.gpus;
      const listingImages = [
        randomChoice(imgPool),
        randomChoice(HARDWARE_IMAGES.gpus),
        randomChoice(HARDWARE_IMAGES.accessories)
      ];

      const priceVariation = randomInt(-10, 15) * 100;
      const finalPrice = Math.max(1500, template.price + priceVariation);

      const listingId = uuidv4();
      const listingDoc = {
        id: listingId,
        slug,
        title,
        description: template.desc,
        category_id: cat.id,
        subcategory_id: subObj ? subObj.id : null,
        price: finalPrice,
        price_type: template.priceType || 'fixed',
        condition: template.condition || 'Like New',
        item_type: template.itemType || 'physical',
        location: locationString,
        location_district: districtObj.name,
        location_taluk: talukObj.name,
        location_area: areaName,
        address_details: `Near ${areaName} junction, ${talukObj.name}`,
        latitude: districtObj.lat + randomFloat(-0.04, 0.04, 4),
        longitude: districtObj.lng + randomFloat(-0.04, 0.04, 4),
        contact_phone: seller.phone,
        contact_method: 'both',
        hide_phone: false,
        images: listingImages,
        specifications: template.specs || [],
        brand: template.brand,
        model: template.model,
        seller_id: seller.id,
        status,
        payment_status: paymentStatus,
        featured: postIndex % 7 === 0,
        views_count: randomInt(45, 1280),
        moderation_note: null,
        is_deleted: isDeleted,
        deleted_at: deletedAt,
        deleted_by: deletedBy,
        deletion_reason: deletionReason,
        previous_status: isDeleted ? 'active' : null,
        created_by_admin: false,
        is_free_listing: false,
        published_at: publishedAt,
        expires_at: expiresAt,
        validity_days: validityDays,
        extension_count: extensionCount,
        extension_history: extensionHistory,
        free_edit_allowed: freeEditAllowed,
        free_edit_granted_at: freeEditGrantedAt,
        free_edit_granted_by: freeEditGrantedBy,
        free_edit_reason: freeEditReason,
        free_edit_history: freeEditHistory,
        free_edit_used: freeEditUsed,
        free_edit_used_at: freeEditUsed ? randomDateBetween(15, 2) : null,
        sold_at: soldAt,
        sold_to_user_id: soldToUserId,
        created_at: publishedAt,
        updated_at: publishedAt
      };

      listingsList.push(listingDoc);

      // Create Payment for completed listings
      if (paymentStatus === 'completed') {
        const paymentId = uuidv4();
        const invoiceNum = `GGS-INV-2026-${String(postIndex).padStart(5, '0')}`;
        const txnId = `TXN_${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;

        paymentsList.push({
          id: paymentId,
          user_id: seller.id,
          listing_id: listingId,
          base_amount: 8.47,
          gst_percentage: 18.00,
          gst_amount: 1.53,
          amount: 10.00,
          currency: 'INR',
          status: 'completed',
          payment_method: randomChoice(['upi', 'card', 'netbanking']),
          transaction_id: txnId,
          policy_accepted: true,
          policy_version: 'v2.0',
          policy_accepted_at: publishedAt,
          invoice_number: invoiceNum,
          invoice_status: 'issued',
          created_at: publishedAt
        });
      }

      // Create Audit Log for listing publication
      auditLogsList.push({
        id: uuidv4(),
        user_id: seller.id,
        user_email: seller.email,
        admin_id: null,
        admin_email: null,
        entity_type: 'listing',
        entity_id: listingId,
        action: 'POST_CREATED',
        new_state: { title, price: finalPrice, category: cat.name },
        reason: 'User published listing with ₹10 service charge',
        created_at: publishedAt
      });

      if (isDeleted) {
        auditLogsList.push({
          id: uuidv4(),
          user_id: seller.id,
          user_email: seller.email,
          admin_id: null,
          admin_email: null,
          entity_type: 'listing',
          entity_id: listingId,
          action: 'POST_DELETED',
          reason: deletionReason,
          created_at: deletedAt
        });
      }

      postIndex++;
    }
  }

  await Listing.insertMany(listingsList);
  await Payment.insertMany(paymentsList);
  console.log(`✅ Successfully seeded 500 listings & ${paymentsList.length} payments into database.`);

  // 4. Generate Reviews between Users
  console.log('Generating realistic reviews & ratings...');
  const reviewsList = [];
  const REVIEW_COMMENTS = [
    'Great seller! Met at Lulu Mall Edappally, GPU was in mint condition and ran FurMark perfectly.',
    'Fast response and very smooth transaction. Tested the PS5 disc drive before payment.',
    'Item exactly as described. Provided original invoice and warranty card.',
    'Friendly fellow gamer in Trivandrum. Keychron keyboard feels amazing to type on.',
    'Superb packaging and honest seller. Tested 3D Mark benchmark together.',
    'Authentic hardware and great communication. Highly recommended trader!',
    'Quick delivery and verified original serial numbers on AMD warranty portal.'
  ];

  for (let r = 0; r < 120; r++) {
    const listing = listingsList[r % listingsList.length];
    const reviewer = userList[(r * 3 + 7) % userList.length];
    if (reviewer.id === listing.seller_id) continue;

    reviewsList.push({
      id: uuidv4(),
      reviewer_id: reviewer.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      listing_title: listing.title,
      rating: randomChoice([5, 5, 5, 4, 4, 5]),
      comment: randomChoice(REVIEW_COMMENTS),
      seller_response: 'Thanks for the quick deal brother! Enjoy high FPS gaming 🎮',
      seller_response_at: randomDateBetween(15, 1),
      created_at: randomDateBetween(45, 2)
    });
  }
  await Review.insertMany(reviewsList);
  console.log(`✅ Successfully seeded ${reviewsList.length} reviews.`);

  // 5. Generate Wishlists / Saved Listings
  console.log('Generating user wishlists & saved items...');
  const wishlistList = [];
  const savedPairs = new Set();

  for (let w = 0; w < 350; w++) {
    const user = userList[w % userList.length];
    const listing = listingsList[(w * 7 + 3) % listingsList.length];
    const key = `${user.id}:${listing.id}`;
    if (!savedPairs.has(key) && user.id !== listing.seller_id) {
      savedPairs.add(key);
      wishlistList.push({
        id: uuidv4(),
        user_id: user.id,
        listing_id: listing.id,
        created_at: randomDateBetween(60, 1)
      });
    }
  }
  await Wishlist.insertMany(wishlistList);
  console.log(`✅ Successfully seeded ${wishlistList.length} saved wishlist items.`);

  // 6. Generate Conversations & Messages
  console.log('Generating in-app buyer-seller chat threads and messages...');
  const conversationsList = [];
  const messagesList = [];

  const CHAT_SCRIPTS = [
    [
      { text: 'Hi! Is this still available for meetup in Kochi?' },
      { text: 'Yes, available! Can meet near Edappally or Kaloor.' },
      { text: 'Can you run a quick benchmark test before I come?' },
      { text: 'Sure! I have FurMark and GPU-Z test results ready with timestamps.' },
      { text: 'Awesome! Let us meet tomorrow at 4 PM near Lulu.' }
    ],
    [
      { text: 'Hello, is the price slightly negotiable for direct cash/UPI pickup?' },
      { text: 'I can do ₹1,000 off if you pick up from Technopark Kazhakkoottam today.' },
      { text: 'Deal! Does it have the original box and invoice?' },
      { text: 'Yes, full box and GST invoice from MDComputers included.' }
    ],
    [
      { text: 'Hi bro, does this support 4K 120Hz on PS5?' },
      { text: 'Yes! It has HDMI 2.1 full bandwidth with VRR support.' },
      { text: 'Great, I will take it. What is your available time?' }
    ]
  ];

  for (let c = 0; c < 80; c++) {
    const listing = listingsList[(c * 5) % listingsList.length];
    const buyer = userList[(c * 3 + 1) % userList.length];
    if (buyer.id === listing.seller_id) continue;

    const convId = uuidv4();
    const script = CHAT_SCRIPTS[c % CHAT_SCRIPTS.length];
    let lastMsgText = '';
    let lastMsgAt = '';

    for (let mIdx = 0; mIdx < script.length; mIdx++) {
      const isBuyerMsg = mIdx % 2 === 0;
      const senderId = isBuyerMsg ? buyer.id : listing.seller_id;
      const msgText = script[mIdx].text;
      const msgTime = randomDateBetween(30 - mIdx * 2, 29 - mIdx * 2);

      lastMsgText = msgText;
      lastMsgAt = msgTime;

      messagesList.push({
        id: uuidv4(),
        conversation_id: convId,
        sender_id: senderId,
        text: msgText,
        original_text: msgText,
        is_read: true,
        read_at: msgTime,
        created_at: msgTime
      });
    }

    conversationsList.push({
      id: convId,
      listing_id: listing.id,
      buyer_id: buyer.id,
      seller_id: listing.seller_id,
      participants: [buyer.id, listing.seller_id],
      last_message: lastMsgText,
      last_message_at: lastMsgAt,
      status: listing.status === 'sold' ? 'closed_sold' : 'open',
      message_count: script.length,
      contact_sharing_status: 'SHARED',
      created_at: randomDateBetween(35, 15),
      updated_at: lastMsgAt
    });
  }

  await Conversation.insertMany(conversationsList);
  await Message.insertMany(messagesList);
  console.log(`✅ Successfully seeded ${conversationsList.length} conversations & ${messagesList.length} messages.`);

  // 7. Generate KYC Submissions for Sellers
  console.log('Generating KYC document verification records...');
  const kycList = [];
  for (let k = 0; k < 60; k++) {
    const user = userList[k];
    const docType = randomChoice(['aadhaar', 'driving_license', 'passport', 'voter_id']);
    const docNum = `${randomInt(1000, 9999)}`;
    const isApproved = user.is_seller_verified;

    kycList.push({
      id: uuidv4(),
      user_id: user.id,
      document_type: docType,
      document_number: docNum,
      document_image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      status: isApproved ? 'approved' : (user.verification_status || 'pending'),
      decision: isApproved ? 'VERIFIED' : (user.verification_status === 'revoked' ? 'REVOKED' : 'PENDING_REVIEW'),
      rejection_reason: user.verification_revocation_reason || (isApproved ? null : 'Unclear photo. Please re-upload front and back clearly.'),
      admin_notes: isApproved ? 'Identity and address verified against official government registry.' : 'Awaiting clearer document upload.',
      reviewed_by: isApproved ? adminUser.id : null,
      reviewed_at: isApproved ? user.verified_at : null,
      created_at: randomDateBetween(100, 10)
    });
  }
  await KYCSubmission.insertMany(kycList);
  console.log(`✅ Successfully seeded ${kycList.length} KYC submissions.`);

  // 8. Generate Support Tickets (Including Expiry Extensions & Free Edits)
  console.log('Generating Support Tickets with extension and edit requests...');
  const ticketsList = [];

  for (let t = 0; t < 50; t++) {
    const user = userList[(t * 4) % userList.length];
    const listing = listingsList[(t * 3) % listingsList.length];

    let reqType = 'general';
    let subject = 'General Inquiry regarding marketplace feature';
    let desc = 'Hello GGS support team, I had a question regarding the local meetup safety recommendations.';
    let actionTaken = 'none';
    let decision = 'RESOLVED';
    let status = 'resolved';

    if (t % 4 === 0) {
      reqType = 'expiry_extension';
      subject = `30-Day Expiry Extension Request for Listing #${listing.id.substring(0, 8)}`;
      desc = `Requesting 30 days extension for my ${listing.title}. I have buyers in conversation who will be in town next week.`;
      actionTaken = 'extension_granted';
      decision = 'EXTENSION_GRANTED';
    } else if (t % 4 === 1) {
      reqType = 'free_edit';
      subject = `One-Time Free Edit Allowance Request for Listing #${listing.id.substring(0, 8)}`;
      desc = `I need to update the warranty expiration date and add extra benchmarking photos to my listing description.`;
      actionTaken = 'free_edit_granted';
      decision = 'FREE_EDIT_GRANTED';
    } else if (t % 4 === 2) {
      reqType = 'payment_issue';
      subject = 'Tax Invoice Download Request';
      desc = 'Could you please confirm if GST tax invoice has been generated for my recent listing publication?';
      decision = 'RESOLVED';
    }

    ticketsList.push({
      id: uuidv4(),
      ticket_number: `TKT-${2026}-${String(t + 1).padStart(4, '0')}`,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_phone: user.phone,
      category: reqType === 'expiry_extension' ? 'Expiry Extension Request' : (reqType === 'free_edit' ? 'Free Edit Request' : 'General Support'),
      request_type: reqType,
      subject,
      description: desc,
      listing_id: listing.id,
      listing_title: listing.title,
      current_expires_at: listing.expires_at,
      action_taken: actionTaken,
      status,
      priority: randomChoice(['low', 'medium', 'high']),
      admin_response: 'Your request has been reviewed and processed by our moderation team.',
      decision,
      admin_notes: 'Administrative review completed with positive verification.',
      resolved_by: adminUser.id,
      resolved_at: randomDateBetween(20, 2),
      created_at: randomDateBetween(40, 5)
    });
  }
  await SupportTicket.insertMany(ticketsList);
  console.log(`✅ Successfully seeded ${ticketsList.length} Support Tickets.`);

  // 9. Generate Reports
  console.log('Generating community moderation reports...');
  const reportsList = [];
  for (let rp = 0; rp < 30; rp++) {
    const reporter = userList[(rp * 7 + 1) % userList.length];
    const targetListing = listingsList[(rp * 6 + 2) % listingsList.length];

    reportsList.push({
      id: uuidv4(),
      reporter_id: reporter.id,
      target_type: 'listing',
      target_id: targetListing.id,
      reason: randomChoice(['Misleading Price / Token Trap', 'Suspected Low-Ball Resale', 'Duplicate Post', 'Specification Error']),
      details: 'Buyer reported price inconsistency between chat and listed price.',
      status: rp % 2 === 0 ? 'resolved' : 'dismissed',
      decision: rp % 2 === 0 ? 'ACTION_TAKEN' : 'NO_VIOLATION',
      admin_response: 'Moderator reviewed the listing details and took appropriate action.',
      admin_notes: 'Inspected listing history; seller verified and confirmed legitimate.',
      reviewed_by: adminUser.id,
      reviewed_at: randomDateBetween(15, 1),
      created_at: randomDateBetween(35, 2)
    });
  }
  await Report.insertMany(reportsList);
  console.log(`✅ Successfully seeded ${reportsList.length} reports.`);

  // 10. Generate Multilingual Moderation Records
  console.log('Generating multilingual moderation logs...');
  const modRecords = [];
  const SAMPLE_MOD_TEXTS = [
    { text: 'Call me for advance courier deposit at 9876543210', term: 'advance courier', cat: 'scam', sev: 'HIGH' },
    { text: 'Pay advance token money first on gpay', term: 'token money', cat: 'scam', sev: 'CRITICAL' },
    { text: 'Stolen laptop without charger fast cash deal', term: 'stolen', cat: 'prohibited_items', sev: 'CRITICAL' },
    { text: 'Counterfeit BIOS flashed RTX 3080 card', term: 'counterfeit', cat: 'scam', sev: 'HIGH' }
  ];

  for (let m = 0; m < 25; m++) {
    const sample = SAMPLE_MOD_TEXTS[m % SAMPLE_MOD_TEXTS.length];
    const user = userList[(m * 5) % userList.length];

    modRecords.push({
      id: uuidv4(),
      content_type: 'post_description',
      content_id: listingsList[m].id,
      user_id: user.id,
      user_name: user.name,
      original_text: sample.text,
      normalized_text: sample.text.toLowerCase(),
      filtered_text: sample.text.replace(sample.term, '***'),
      matched_terms: [{ term: sample.term, category: sample.cat, severity: sample.sev }],
      language: 'english',
      severity: sample.sev,
      action_taken: 'AUTO_BLOCKED',
      status: m % 2 === 0 ? 'approved' : 'rejected',
      admin_notes: 'Automated filter detection with admin verification.',
      reviewed_by: adminUser.id,
      reviewed_at: randomDateBetween(10, 1),
      created_at: randomDateBetween(25, 2)
    });
  }
  await ModerationRecord.insertMany(modRecords);
  console.log(`✅ Successfully seeded ${modRecords.length} moderation records.`);

  // Insert additional audit logs
  await AuditLog.insertMany(auditLogsList);
  console.log(`✅ Successfully seeded ${auditLogsList.length} platform audit log entries.`);

  console.log('================================================================');
  console.log('🎉 COMPREHENSIVE SEED DATA GENERATION COMPLETE!');
  console.log('================================================================');
}

module.exports = { generateComprehensiveSeedData };

if (require.main === module) {
  mongoose
    .connect('mongodb://127.0.0.1:27017/ggs_database')
    .then(async () => {
      await generateComprehensiveSeedData();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal seeding error:', err);
      process.exit(1);
    });
}
