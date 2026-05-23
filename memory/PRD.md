# GGS (Game Gear Swap) - Product Requirements Document

## Brand Identity
- **Name**: Game Gear Swap (GGS)
- **Copyright**: MALMER
- **Tagline**: Buy. Sell. Upgrade. Your Gaming Gear
- **Region**: Kerala, India

## Overview
Kerala's trusted marketplace for buying and selling used gaming gear. Users can browse listings freely. Posting requires login and a ₹10 listing fee (mocked for MVP).

## Core Business Rules
1. **Browsing**: Open to everyone (no login required)
2. **Posting**: Requires login + ₹10 fee per listing (mocked payment)
3. **Login Required For**: Posting ads, wishlist, messaging, dashboard
4. **Monetization**: Listing fee (₹10), future: featured listings, boosts

## Core Categories
- Consoles (PS5, Xbox, Switch)
- Games (Physical Discs/Cartridges)
- Controllers
- Accessories
- PC Components (GPUs, RAM)

## What's Been Implemented (December 2024)

### ✅ Real-time Chat System
- **WebSocket connection** for real-time messaging
- **Profanity filter**: Blocked words (abuse, scam, fraud, etc.) replaced with ****
- **Message flagging**: Flagged messages go to admin moderation queue
- **Image sharing**: Upload and share images in chat
- **Typing indicator**: Shows when other user is typing
- **Read status**: Single check (✓) for sent, double check (✓✓) for read
- **Safety notice**: "Be polite & respectful. Chats are monitored for safety."
- **Contact options**: Phone/WhatsApp, GGS Chat, or Both (per seller preference)

### ✅ KYC/Seller Verification System
- **Document types**: Aadhaar (masked), PAN, Driving License, Voter ID
- **Masked storage**: Only last 4 digits stored (privacy)
- **Admin manual review**: Pending → Approved/Rejected
- **Verified badge**: Displayed on profile and listings
- **Privacy disclaimer**: 
  - "Documents used solely for identity verification to prevent scams"
  - "Never shared except when required by law enforcement"

### ✅ Admin Dashboard Features
- **KYC Verify Tab**: View pending submissions, approve/reject with reason
- **Reports Tab**: View reported ads, mark resolved/dismiss
- **Chat Monitor Tab**: View flagged messages (original + filtered text)
- **Chat Reports Tab**: View user-reported chats, resolve/dismiss
- **All Chats Tab**: Admin can view ALL user conversations
- **User Management**: Ban/Unban/Delete/Verify users, Change roles (user/seller/admin)
- **Bulk Operations**: Multi-select users, listings, reports for batch actions
- **Export Data**: Export Users, Payments, Listings, Reports, KYC to Excel (CSV)
- **Invoice System**: Download invoices with GGS letterhead, GST breakdown
- **Privacy notice**: Confidential documents warning

### ✅ Seller Review System
- **Star ratings**: 1-5 star rating system
- **Review comments**: Buyers can leave detailed reviews
- **Seller response**: Sellers can reply to reviews
- **Rating aggregation**: Seller's avg rating and total count updated automatically
- **Display**: Reviews shown on Product Detail page

### ✅ Chat Reporting
- **Report button**: Flag icon in chat header
- **Report reasons**: spam, harassment, scam, inappropriate, other
- **Additional details**: Optional text field for more context
- **Admin management**: Chat Reports tab in Admin Dashboard
- **Actions**: Mark Resolved or Dismiss reports

### ✅ Header Updates
- Full name "Game Gear Swap" in header
- Search bar removed from header
- Clean navigation: Marketplace, Categories, Theme, Sell, User menu

### ✅ Footer Updates
- 8 Social links: Discord, X, Facebook, YouTube, WhatsApp, Instagram, Reddit, Email
- "Kerala's trusted marketplace" branding

### ✅ Post Ad (Single Page Form)
- All fields on one page
- Hierarchical Kerala locations (District → Taluk → Area)
- ₹10 listing fee (MOCKED payment)

### ✅ Product Detail Enhancements
- Ad ID with copy button
- Report button with reason selection
- Safety tips section
- OpenStreetMap embed
- Seller profile link
- Related ads section
- Mark as Sold (for owner)

### ✅ User Dashboard
- My Listings with Mark as Sold
- Profile: Avatar upload, phone edit with OTP
- Apply for Verification (KYC)
- Wishlist and Payments tabs
- **Invoice Download**: Download payment invoices with full details

## Technical Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT (PyJWT)
- **Real-time**: WebSocket (FastAPI native)
- **Map**: OpenStreetMap (free)

## API Endpoints (New)

### Chat
- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - List user's conversations
- `GET /api/conversations/{id}/messages` - Get messages
- `POST /api/messages` - Send message (with profanity filter)
- `POST /api/messages/{id}/read` - Mark as read
- `POST /api/conversations/{id}/typing` - Set typing status
- `WS /ws/chat/{conv_id}?token=JWT` - WebSocket for real-time

### KYC
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/status` - Get user's KYC status
- `GET /api/admin/kyc` - Admin: list KYC submissions
- `PUT /api/admin/kyc/{id}/approve` - Admin: approve KYC
- `PUT /api/admin/kyc/{id}/reject` - Admin: reject KYC

### Moderation
- `GET /api/admin/reports` - Admin: list reported ads
- `PUT /api/admin/reports/{id}/review` - Admin: resolve/dismiss
- `GET /api/admin/flagged-messages` - Admin: list flagged chat messages
- `PUT /api/admin/flagged-messages/{id}/review` - Admin: review/dismiss

### Reviews
- `POST /api/reviews` - Create a review (rating, comment)
- `GET /api/reviews/seller/{seller_id}` - Get seller reviews
- `GET /api/reviews/listing/{listing_id}` - Get listing reviews
- `POST /api/reviews/{review_id}/reply` - Seller reply to review

### Chat Reports
- `POST /api/chat-reports` - Report a chat conversation
- `GET /api/admin/chat-reports` - Admin: list chat reports
- `PUT /api/admin/chat-reports/{id}/review` - Admin: resolve/dismiss

### Admin User Management
- `POST /api/admin/users/{id}/ban` - Ban a user
- `POST /api/admin/users/{id}/unban` - Unban a user
- `DELETE /api/admin/users/{id}` - Delete user permanently
- `POST /api/admin/users/{id}/verify` - Verify user manually
- `POST /api/admin/users/{id}/role?role=X` - Change user role
- `POST /api/admin/users/bulk` - Bulk user operations
- `POST /api/admin/listings/bulk` - Bulk listing operations
- `POST /api/admin/reports/bulk` - Bulk report operations

### Admin All Chats
- `GET /api/admin/conversations` - View all conversations
- `GET /api/admin/conversations/{id}/messages` - View conversation messages

### Admin Export
- `GET /api/admin/export/users` - Export users with KYC
- `GET /api/admin/export/payments` - Export payments
- `GET /api/admin/export/listings` - Export listings
- `GET /api/admin/export/reports` - Export all reports
- `GET /api/admin/export/kyc` - Export KYC data

### Invoice
- `GET /api/payments/{id}/invoice` - Get invoice data
- `GET /api/payments/my` - Get user's payments

## MOCKED Integrations
- **Google Auth**: Frontend mock only
- **Mobile OTP**: Backend accepts any 6-digit OTP
- **Razorpay Payment**: Completes immediately without real transaction

## Test Coverage
- Backend: 100% (34/34 tests in latest iteration)
- Frontend: 100% (all features verified)
- Test reports: 
  - /app/test_reports/iteration_4.json (Chat, KYC, Admin Moderation)
  - /app/test_reports/iteration_5.json (Seller Reviews, Chat Reporting)
  - /app/test_reports/iteration_6.json (Admin Enhancement: User Mgmt, Bulk Ops, Export, Invoice)

## Default Credentials
- Admin: admin@ggs.com / admin123
- User: user@ggs.com / user123

## Profanity Filter Words
abuse, scam, fraud, cheat, fake, stupid, idiot, fool, hate, kill, die, threat, violence, racist, sexist

## Prioritized Backlog

### P0 (Completed)
- [x] Core marketplace functionality
- [x] User authentication
- [x] ₹10 listing fee (mocked)
- [x] Real-time Chat with moderation
- [x] KYC Verification system
- [x] Admin moderation tools
- [x] Seller Review System
- [x] Chat Reporting
- [x] Admin User Management (Ban/Unban/Delete/Verify/Role)
- [x] Bulk Operations (Users, Listings, Reports)
- [x] Excel Export (Users, Payments, Listings, Reports, KYC)
- [x] Invoice System with GST breakdown

### P1 (Next Phase)
- [ ] Real Google OAuth integration
- [ ] Real Mobile OTP (Twilio/MSG91)
- [ ] Real Razorpay payment integration
- [ ] Email notifications
- [ ] Push notifications

### P2 (Future)
- [ ] Featured Listings (paid promotion)
- [ ] Listing Boosts
- [ ] Seller Subscription Plans
- [ ] Mobile app
- [ ] Advanced admin analytics
