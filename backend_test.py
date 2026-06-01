#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class GGSAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_seed_database(self):
        """Seed the database with initial data"""
        return self.run_test("Seed Database", "POST", "seed", 200)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@ggs.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": "user@ggs.com", "password": "user123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   User token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_{timestamp}@ggs.com"
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "testpass123",
                "name": "Test User",
                "username": f"testuser_{timestamp}"
            }
        )
        return success

    def test_get_categories(self):
        """Test getting categories"""
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success:
            print(f"   Found {len(response)} categories")
        return success

    def test_get_listings(self):
        """Test getting listings"""
        success, response = self.run_test("Get Listings", "GET", "listings", 200)
        if success:
            print(f"   Found {len(response)} listings")
        return success

    def test_get_featured_listings(self):
        """Test getting featured listings"""
        success, response = self.run_test("Get Featured Listings", "GET", "listings/featured", 200)
        if success:
            print(f"   Found {len(response)} featured listings")
        return success

    def test_get_latest_listings(self):
        """Test getting latest listings"""
        success, response = self.run_test("Get Latest Listings", "GET", "listings/latest", 200)
        if success:
            print(f"   Found {len(response)} latest listings")
        return success

    def test_create_listing(self):
        """Test creating a listing"""
        if not self.token:
            print("❌ No user token available for listing creation")
            return False

        # First get categories to use one
        success, categories = self.run_test("Get Categories for Listing", "GET", "categories", 200)
        if not success or not categories:
            print("❌ Cannot create listing without categories")
            return False

        category_id = categories[0]['id']
        
        success, response = self.run_test(
            "Create Listing",
            "POST",
            "listings",
            200,
            data={
                "title": "Test Gaming PC",
                "description": "High-end gaming PC for testing",
                "category_id": category_id,
                "price": 50000,
                "condition": "Excellent",
                "location": "Mumbai",
                "contact_phone": "+919876543210",
                "images": ["https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=800"]
            }
        )
        if success:
            print(f"   Created listing with ID: {response.get('id', 'Unknown')}")
            return response.get('id')
        return False

    def test_payment_flow(self, listing_id):
        """Test payment flow"""
        if not self.token or not listing_id:
            print("❌ No token or listing ID for payment test")
            return False

        # Create payment
        success, payment = self.run_test(
            "Create Payment",
            "POST",
            "payments/create",
            200,
            data={"listing_id": listing_id}
        )
        
        if not success:
            return False

        payment_id = payment.get('id')
        print(f"   Created payment with ID: {payment_id}")

        # Complete payment (mock)
        success, _ = self.run_test(
            "Complete Payment",
            "POST",
            f"payments/{payment_id}/complete",
            200
        )
        return success

    def test_wishlist_operations(self):
        """Test wishlist add/remove"""
        if not self.token:
            print("❌ No user token for wishlist test")
            return False

        # Get a listing to add to wishlist
        success, listings = self.run_test("Get Listings for Wishlist", "GET", "listings", 200)
        if not success or not listings:
            print("❌ No listings available for wishlist test")
            return False

        listing_id = listings[0]['id']

        # Add to wishlist
        success, _ = self.run_test(
            "Add to Wishlist",
            "POST",
            f"wishlist?listing_id={listing_id}",
            200
        )
        
        if not success:
            return False

        # Get wishlist
        success, wishlist = self.run_test("Get Wishlist", "GET", "wishlist", 200)
        if success:
            print(f"   Wishlist has {len(wishlist)} items")

        # Remove from wishlist
        success, _ = self.run_test(
            "Remove from Wishlist",
            "DELETE",
            f"wishlist/{listing_id}",
            200
        )
        return success

    def test_admin_operations(self):
        """Test admin operations"""
        if not self.admin_token:
            print("❌ No admin token for admin tests")
            return False

        # Use admin token for these tests
        old_token = self.token
        self.token = self.admin_token

        # Test admin stats
        success, stats = self.run_test("Admin Stats", "GET", "admin/stats", 200)
        if success:
            print(f"   Stats: {stats}")

        # Test admin users
        success, users = self.run_test("Admin Get Users", "GET", "admin/users", 200)
        if success:
            print(f"   Found {len(users)} users")

        # Test admin listings
        success, listings = self.run_test("Admin Get Listings", "GET", "admin/listings", 200)
        if success:
            print(f"   Found {len(listings)} listings")

        # Restore user token
        self.token = old_token
        return success

    def test_static_pages(self):
        """Test static pages"""
        success, pages = self.run_test("Get Static Pages", "GET", "pages", 200)
        if success:
            print(f"   Found {len(pages)} static pages")
            
            # Test individual page
            if pages:
                page_slug = pages[0]['slug']
                success, page = self.run_test(f"Get Page: {page_slug}", "GET", f"pages/{page_slug}", 200)
                if success:
                    print(f"   Page '{page['title']}' loaded successfully")
        return success

def main():
    print("🚀 Starting GGS (Game Gear Swap) API Testing...")
    print("=" * 60)
    
    tester = GGSAPITester()
    
    # Test sequence
    tests = [
        ("API Health Check", tester.test_health_check),
        ("Database Seeding", tester.test_seed_database),
        ("Admin Login", tester.test_admin_login),
        ("User Login", tester.test_user_login),
        ("User Signup", tester.test_user_signup),
        ("Get Categories", tester.test_get_categories),
        ("Get Listings", tester.test_get_listings),
        ("Get Featured Listings", tester.test_get_featured_listings),
        ("Get Latest Listings", tester.test_get_latest_listings),
        ("Static Pages", tester.test_static_pages),
        ("Admin Operations", tester.test_admin_operations),
        ("Wishlist Operations", tester.test_wishlist_operations),
    ]

    # Run basic tests first
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")

    # Test listing creation and payment flow
    print(f"\n{'='*20} Listing & Payment Flow {'='*20}")
    listing_id = tester.test_create_listing()
    if listing_id:
        tester.test_payment_flow(listing_id)

    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
            else:
                print(f"   Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())