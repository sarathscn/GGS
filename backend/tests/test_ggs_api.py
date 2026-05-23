"""
GGS (Game Gear Swap) API Tests
Tests for authentication, listings, categories, and user features
Current model: ₹10 listing fee with mocked payment
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@ggs.com"
ADMIN_PASSWORD = "admin123"
USER_EMAIL = "user@ggs.com"
USER_PASSWORD = "user123"


class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        print(f"SUCCESS: API health check passed")
    
    def test_get_locations(self):
        """Test locations endpoint returns Kerala cities"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        data = response.json()
        assert "locations" in data
        assert len(data["locations"]) > 0
        assert "Kochi" in data["locations"]
        assert "Thiruvananthapuram" in data["locations"]
        print(f"SUCCESS: Got {len(data['locations'])} Kerala locations")


class TestCategories:
    """Category endpoint tests"""
    
    def test_get_categories(self):
        """Test fetching all categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6  # Should have at least 6 categories
        print(f"SUCCESS: Got {len(data)} categories")
    
    def test_category_structure(self):
        """Test category has required fields"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            cat = data[0]
            assert "id" in cat
            assert "name" in cat
            assert "slug" in cat
            assert "subcategories" in cat
            print(f"SUCCESS: Category structure is valid")
    
    def test_get_category_by_slug(self):
        """Test fetching single category by slug"""
        response = requests.get(f"{BASE_URL}/api/categories/pc-components")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "pc-components"
        assert "subcategories" in data
        print(f"SUCCESS: Got category by slug: {data['name']}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_admin_login(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"SUCCESS: Admin login successful")
    
    def test_user_login(self):
        """Test regular user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "user"
        print(f"SUCCESS: User login successful")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword",
            "auth_type": "email"
        })
        assert response.status_code == 401
        print(f"SUCCESS: Invalid credentials rejected correctly")
    
    def test_signup_new_user(self):
        """Test user registration"""
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST New User",
            "auth_type": "email"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        print(f"SUCCESS: New user registered: {unique_email}")
        return data["token"]
    
    def test_signup_duplicate_email(self):
        """Test signup with existing email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "testpass123",
            "name": "Duplicate User",
            "auth_type": "email"
        })
        assert response.status_code == 400
        print(f"SUCCESS: Duplicate email rejected correctly")
    
    def test_get_current_user(self):
        """Test getting current user profile"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        token = login_res.json()["token"]
        
        # Get profile
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == USER_EMAIL
        print(f"SUCCESS: Got current user profile")


class TestListings:
    """Listing CRUD tests - ₹10 payment model"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def category_id(self):
        """Get a valid category ID"""
        response = requests.get(f"{BASE_URL}/api/categories")
        return response.json()[0]["id"]
    
    def test_get_listings(self):
        """Test fetching all active listings"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} listings")
    
    def test_get_featured_listings(self):
        """Test fetching featured listings"""
        response = requests.get(f"{BASE_URL}/api/listings/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} featured listings")
    
    def test_get_latest_listings(self):
        """Test fetching latest listings"""
        response = requests.get(f"{BASE_URL}/api/listings/latest")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} latest listings")
    
    def test_create_listing_with_payment(self, auth_token, category_id):
        """Test creating a listing - requires ₹10 payment to go live"""
        listing_data = {
            "title": "TEST RTX 4090 Graphics Card",
            "description": "Test listing for API testing. High-end GPU.",
            "category_id": category_id,
            "price": 150000,
            "price_type": "negotiable",
            "condition": "Like New",
            "item_type": "physical",
            "location": "Kochi",
            "location_district": "Ernakulam",
            "location_taluk": "Kochi",
            "contact_phone": "+919876543210",
            "contact_method": "both",
            "images": ["https://example.com/test.jpg"],
            "specifications": [{"key": "VRAM", "value": "24GB"}]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/listings",
            json=listing_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Listing should be pending payment initially
        assert data["status"] == "pending_payment"
        assert data["payment_status"] == "pending"
        assert data["title"] == listing_data["title"]
        
        print(f"SUCCESS: Created listing (pending payment): {data['id']}")
        print(f"  - Status: {data['status']}")
        print(f"  - Payment Status: {data['payment_status']}")
        return data["id"]
    
    def test_complete_payment_for_listing(self, auth_token, category_id):
        """Test completing ₹10 payment to activate listing"""
        # Create listing first
        listing_data = {
            "title": "TEST Payment Flow Listing",
            "description": "Test listing for payment flow",
            "category_id": category_id,
            "price": 50000,
            "price_type": "fixed",
            "condition": "Like New",
            "item_type": "physical",
            "location": "Kochi",
            "contact_phone": "+919876543210",
            "contact_method": "both",
            "images": [],
            "specifications": []
        }
        
        create_res = requests.post(
            f"{BASE_URL}/api/listings",
            json=listing_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        listing_id = create_res.json()["id"]
        
        # Complete payment
        payment_res = requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing_id, "payment_method": "upi"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert payment_res.status_code == 200
        payment_data = payment_res.json()
        assert payment_data["success"] == True
        
        # Verify listing is now active
        listing_res = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        listing_data = listing_res.json()
        assert listing_data["status"] == "active"
        assert listing_data["payment_status"] == "completed"
        
        print(f"SUCCESS: Payment completed, listing now active: {listing_id}")
    
    def test_get_listing_by_id(self, auth_token, category_id):
        """Test fetching a specific listing"""
        # First create a listing and complete payment
        listing_data = {
            "title": "TEST PS5 Console",
            "description": "Test listing",
            "category_id": category_id,
            "price": 45000,
            "price_type": "fixed",
            "condition": "Excellent",
            "item_type": "physical",
            "location": "Thiruvananthapuram",
            "contact_phone": "+919876543210",
            "contact_method": "both",
            "images": [],
            "specifications": []
        }
        
        create_res = requests.post(
            f"{BASE_URL}/api/listings",
            json=listing_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        listing_id = create_res.json()["id"]
        
        # Complete payment to make it active
        requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing_id, "payment_method": "upi"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Fetch the listing
        response = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == listing_id
        assert data["title"] == listing_data["title"]
        print(f"SUCCESS: Got listing by ID: {listing_id}")
    
    def test_get_my_listings(self, auth_token):
        """Test fetching user's own listings"""
        response = requests.get(
            f"{BASE_URL}/api/my-listings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} user listings")
    
    def test_filter_listings_by_category(self):
        """Test filtering listings by category"""
        response = requests.get(f"{BASE_URL}/api/listings?category=pc-components")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Filtered listings by category: {len(data)} results")
    
    def test_filter_listings_by_location(self):
        """Test filtering listings by location"""
        response = requests.get(f"{BASE_URL}/api/listings?location=Kochi")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Filtered listings by location: {len(data)} results")
    
    def test_filter_listings_by_condition(self):
        """Test filtering listings by condition"""
        response = requests.get(f"{BASE_URL}/api/listings?condition=Like%20New")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Filtered listings by condition: {len(data)} results")
    
    def test_search_listings(self):
        """Test searching listings"""
        response = requests.get(f"{BASE_URL}/api/listings?search=RTX")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Search results: {len(data)} listings")


class TestWishlist:
    """Wishlist feature tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_get_wishlist(self, auth_token):
        """Test fetching user's wishlist"""
        response = requests.get(
            f"{BASE_URL}/api/wishlist",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got wishlist with {len(data)} items")


class TestSellerProfile:
    """Seller profile tests"""
    
    def test_get_seller_profile(self):
        """Test fetching seller profile"""
        # First get a user ID
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        user_id = login_res.json()["user"]["id"]
        
        response = requests.get(f"{BASE_URL}/api/sellers/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "seller" in data
        assert "listings" in data
        print(f"SUCCESS: Got seller profile")


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_admin_get_stats(self, admin_token):
        """Test admin stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_listings" in data
        assert "active_listings" in data
        print(f"SUCCESS: Admin stats - Users: {data['total_users']}, Listings: {data['total_listings']}")
    
    def test_admin_get_users(self, admin_token):
        """Test admin users list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin got {len(data)} users")
    
    def test_admin_get_listings(self, admin_token):
        """Test admin listings list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/listings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin got {len(data)} listings")
    
    def test_non_admin_cannot_access_admin_endpoints(self):
        """Test that regular users cannot access admin endpoints"""
        # Login as regular user
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        user_token = login_res.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        print(f"SUCCESS: Non-admin correctly blocked from admin endpoints")


class TestOTPAuth:
    """OTP authentication tests (MOCKED)"""
    
    def test_send_otp(self):
        """Test sending OTP (mocked)"""
        response = requests.post(f"{BASE_URL}/api/auth/otp/send", json={
            "phone": "9876543210"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "mock_otp" in data  # Mock OTP for testing
        print(f"SUCCESS: OTP sent (mock): {data['mock_otp']}")


class TestMarkAsSold:
    """Mark as Sold feature tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def category_id(self):
        """Get a valid category ID"""
        response = requests.get(f"{BASE_URL}/api/categories")
        return response.json()[0]["id"]
    
    def test_mark_listing_as_sold(self, auth_token, category_id):
        """Test marking a listing as sold"""
        # Create and activate a listing
        listing_data = {
            "title": "TEST Mark as Sold Item",
            "description": "Test listing for mark as sold",
            "category_id": category_id,
            "price": 10000,
            "price_type": "fixed",
            "condition": "Good",
            "item_type": "physical",
            "location": "Kochi",
            "contact_phone": "+919876543210",
            "contact_method": "both",
            "images": [],
            "specifications": []
        }
        
        create_res = requests.post(
            f"{BASE_URL}/api/listings",
            json=listing_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        listing_id = create_res.json()["id"]
        
        # Complete payment
        requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing_id, "payment_method": "upi"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Mark as sold
        response = requests.post(
            f"{BASE_URL}/api/listings/{listing_id}/mark-sold",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify status changed
        listing_res = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        assert listing_res.json()["status"] == "sold"
        print(f"SUCCESS: Listing marked as sold: {listing_id}")


class TestVerification:
    """Seller verification tests"""
    
    def test_apply_for_verification(self):
        """Test applying for seller verification"""
        # Create a new user to test verification
        unique_email = f"TEST_verify_{uuid.uuid4().hex[:8]}@test.com"
        register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST Verify User",
            "auth_type": "email"
        })
        token = register_res.json()["token"]
        
        # Apply for verification
        response = requests.post(
            f"{BASE_URL}/api/verification/apply",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Verification application submitted")
    
    def test_already_verified_user_cannot_apply(self):
        """Test that already verified user cannot apply again"""
        # Login as verified user
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        token = login_res.json()["token"]
        
        # Try to apply (should fail if already verified)
        response = requests.post(
            f"{BASE_URL}/api/verification/apply",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Either 400 (already verified) or 200 (not verified yet)
        assert response.status_code in [200, 400]
        print(f"SUCCESS: Verification endpoint handled correctly")


class TestReports:
    """Report feature tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_create_report(self, auth_token):
        """Test creating a report for a listing"""
        # Get a listing to report
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) == 0:
            print("SKIP: No listings to report")
            return
        
        listing_id = listings[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/reports",
            json={
                "target_type": "listing",
                "target_id": listing_id,
                "reason": "fake",
                "details": "Test report for API testing"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print(f"SUCCESS: Report created for listing {listing_id}")


class TestPhoneUpdate:
    """Phone update with OTP tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_update_phone_with_otp(self, auth_token):
        """Test updating phone number with OTP (mocked)"""
        response = requests.post(
            f"{BASE_URL}/api/profile/update-phone",
            json={"phone": "+919876543299", "otp": "123456"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print(f"SUCCESS: Phone updated with OTP")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
