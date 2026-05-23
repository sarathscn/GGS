"""
GGS (Game Gear Swap) - Seller Reviews and Chat Reporting API Tests
Tests for the NEW features: Seller Review System and Chat Reporting
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


class TestSellerReviews:
    """Seller Review System tests - POST /api/reviews, GET /api/reviews/seller/{seller_id}, POST /api/reviews/{review_id}/reply"""
    
    @pytest.fixture
    def user_token(self):
        """Get auth token for regular user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def user_id(self):
        """Get user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["user"]["id"]
    
    @pytest.fixture
    def admin_token(self):
        """Get auth token for admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def admin_id(self):
        """Get admin ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["user"]["id"]
    
    @pytest.fixture
    def test_listing(self, admin_token, admin_id):
        """Create a test listing for review testing"""
        # Get categories
        categories_res = requests.get(f"{BASE_URL}/api/categories")
        categories = categories_res.json()
        if len(categories) == 0:
            pytest.skip("No categories available")
        category_id = categories[0]["id"]
        
        # Create listing
        listing_data = {
            "title": f"TEST Review Listing {uuid.uuid4().hex[:8]}",
            "description": "Test listing for review testing",
            "category_id": category_id,
            "price": 5000,
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
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_res.status_code == 200, f"Failed to create listing: {create_res.text}"
        listing = create_res.json()
        
        # Complete payment to make listing active
        payment_res = requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing["id"], "payment_method": "upi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        return listing["id"], admin_id
    
    def test_create_review_success(self, user_token, test_listing):
        """Test POST /api/reviews - Create a new review for a seller"""
        listing_id, seller_id = test_listing
        
        review_data = {
            "listing_id": listing_id,
            "seller_id": seller_id,
            "rating": 5,
            "comment": "Excellent seller! Fast response and great product quality."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create review: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Review ID missing"
        assert data["rating"] == 5, "Rating mismatch"
        assert data["comment"] == review_data["comment"], "Comment mismatch"
        assert data["seller_id"] == seller_id, "Seller ID mismatch"
        assert data["listing_id"] == listing_id, "Listing ID mismatch"
        assert "reviewer_name" in data, "Reviewer name missing"
        assert data["seller_response"] is None, "Seller response should be None initially"
        
        print(f"SUCCESS: Created review {data['id']} with rating {data['rating']}")
        return data["id"]
    
    def test_create_review_invalid_rating(self, user_token, admin_token, admin_id):
        """Test POST /api/reviews - Rating must be between 1 and 5"""
        # Create a new listing for this test
        categories_res = requests.get(f"{BASE_URL}/api/categories")
        categories = categories_res.json()
        category_id = categories[0]["id"]
        
        listing_data = {
            "title": f"TEST Invalid Rating {uuid.uuid4().hex[:8]}",
            "description": "Test listing",
            "category_id": category_id,
            "price": 1000,
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
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        listing = create_res.json()
        
        # Complete payment
        requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing["id"], "payment_method": "upi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Try to create review with invalid rating (0)
        review_data = {
            "listing_id": listing["id"],
            "seller_id": admin_id,
            "rating": 0,
            "comment": "Invalid rating test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid rating, got {response.status_code}"
        print("SUCCESS: Invalid rating (0) correctly rejected")
        
        # Try with rating > 5
        review_data["rating"] = 6
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400 for rating > 5, got {response.status_code}"
        print("SUCCESS: Invalid rating (6) correctly rejected")
    
    def test_duplicate_review_rejected(self, user_token, test_listing):
        """Test POST /api/reviews - Cannot review same listing twice"""
        listing_id, seller_id = test_listing
        
        # First review
        review_data = {
            "listing_id": listing_id,
            "seller_id": seller_id,
            "rating": 4,
            "comment": "First review"
        }
        
        first_res = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Second review attempt
        review_data["comment"] = "Second review attempt"
        second_res = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert second_res.status_code == 400, f"Expected 400 for duplicate review, got {second_res.status_code}"
        assert "already reviewed" in second_res.json().get("detail", "").lower()
        print("SUCCESS: Duplicate review correctly rejected")
    
    def test_get_seller_reviews(self, admin_id):
        """Test GET /api/reviews/seller/{seller_id} - Get all reviews for a seller"""
        response = requests.get(f"{BASE_URL}/api/reviews/seller/{admin_id}")
        
        assert response.status_code == 200, f"Failed to get seller reviews: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Got {len(data)} reviews for seller")
        
        # Verify review structure if reviews exist
        if len(data) > 0:
            review = data[0]
            assert "id" in review, "Review ID missing"
            assert "rating" in review, "Rating missing"
            assert "comment" in review, "Comment missing"
            assert "reviewer_name" in review, "Reviewer name missing"
            assert "created_at" in review, "Created at missing"
            print(f"  First review: {review['rating']} stars - '{review['comment'][:50]}...'")
    
    def test_get_listing_reviews(self, test_listing):
        """Test GET /api/reviews/listing/{listing_id} - Get reviews for a specific listing"""
        listing_id, _ = test_listing
        
        response = requests.get(f"{BASE_URL}/api/reviews/listing/{listing_id}")
        
        assert response.status_code == 200, f"Failed to get listing reviews: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Got {len(data)} reviews for listing")
    
    def test_seller_reply_to_review(self, user_token, admin_token, admin_id):
        """Test POST /api/reviews/{review_id}/reply - Seller can respond to a review"""
        # Create a new listing and review
        categories_res = requests.get(f"{BASE_URL}/api/categories")
        categories = categories_res.json()
        category_id = categories[0]["id"]
        
        listing_data = {
            "title": f"TEST Reply Review {uuid.uuid4().hex[:8]}",
            "description": "Test listing for reply test",
            "category_id": category_id,
            "price": 2000,
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
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        listing = create_res.json()
        
        # Complete payment
        requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing["id"], "payment_method": "upi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Create review as user
        review_data = {
            "listing_id": listing["id"],
            "seller_id": admin_id,
            "rating": 3,
            "comment": "Good product but slow delivery"
        }
        
        review_res = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        review_id = review_res.json()["id"]
        
        # Seller replies to review
        reply_data = {
            "response": "Thank you for your feedback! We apologize for the delay and will improve our delivery times."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews/{review_id}/reply",
            json=reply_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to reply to review: {response.text}"
        data = response.json()
        assert data["success"] == True, "Reply should succeed"
        print(f"SUCCESS: Seller replied to review {review_id}")
    
    def test_non_seller_cannot_reply(self, user_token, admin_token, admin_id):
        """Test POST /api/reviews/{review_id}/reply - Only seller can respond"""
        # Create a new listing and review
        categories_res = requests.get(f"{BASE_URL}/api/categories")
        categories = categories_res.json()
        category_id = categories[0]["id"]
        
        listing_data = {
            "title": f"TEST Non-Seller Reply {uuid.uuid4().hex[:8]}",
            "description": "Test listing",
            "category_id": category_id,
            "price": 3000,
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
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        listing = create_res.json()
        
        # Complete payment
        requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing["id"], "payment_method": "upi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Create review as user
        review_data = {
            "listing_id": listing["id"],
            "seller_id": admin_id,
            "rating": 4,
            "comment": "Nice product"
        }
        
        review_res = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        review_id = review_res.json()["id"]
        
        # Non-seller (user) tries to reply
        reply_data = {
            "response": "This should fail"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews/{review_id}/reply",
            json=reply_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403 for non-seller reply, got {response.status_code}"
        print("SUCCESS: Non-seller correctly blocked from replying")
    
    def test_seller_rating_updated(self, user_token, admin_token, admin_id):
        """Test that seller's average rating is updated after review"""
        # Get seller's current rating
        seller_res = requests.get(f"{BASE_URL}/api/sellers/{admin_id}")
        initial_rating = seller_res.json()["seller"].get("rating_avg", 0)
        initial_count = seller_res.json()["seller"].get("rating_count", 0)
        
        # Create a new listing
        categories_res = requests.get(f"{BASE_URL}/api/categories")
        categories = categories_res.json()
        category_id = categories[0]["id"]
        
        listing_data = {
            "title": f"TEST Rating Update {uuid.uuid4().hex[:8]}",
            "description": "Test listing",
            "category_id": category_id,
            "price": 4000,
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
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        listing = create_res.json()
        
        # Complete payment
        requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing["id"], "payment_method": "upi"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Create review
        review_data = {
            "listing_id": listing["id"],
            "seller_id": admin_id,
            "rating": 5,
            "comment": "Perfect!"
        }
        
        requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Check seller's updated rating
        seller_res = requests.get(f"{BASE_URL}/api/sellers/{admin_id}")
        new_count = seller_res.json()["seller"].get("rating_count", 0)
        
        assert new_count > initial_count, "Rating count should increase"
        print(f"SUCCESS: Seller rating count updated from {initial_count} to {new_count}")


class TestChatReporting:
    """Chat Reporting System tests - POST /api/chat-reports, GET /api/admin/chat-reports, PUT /api/admin/chat-reports/{report_id}/resolve"""
    
    @pytest.fixture
    def user_token(self):
        """Get auth token for regular user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get auth token for admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def test_conversation(self, user_token):
        """Create a test conversation for chat report testing"""
        # Get a listing
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) == 0:
            pytest.skip("No listings available")
        
        listing = listings[0]
        
        # Create conversation
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing["id"],
                "seller_id": listing["seller_id"]
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert conv_res.status_code == 200, f"Failed to create conversation: {conv_res.text}"
        conv = conv_res.json()
        
        # Send a message
        msg_res = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv["id"],
                "text": "Test message for chat report"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        return conv["id"], msg_res.json()["id"] if msg_res.status_code == 200 else None
    
    def test_report_chat_conversation(self, user_token, test_conversation):
        """Test POST /api/chat-reports - Report a chat conversation"""
        conv_id, _ = test_conversation
        
        report_data = {
            "conversation_id": conv_id,
            "reason": "spam",
            "details": "User is sending spam messages"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat-reports",
            json=report_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to report chat: {response.text}"
        data = response.json()
        
        assert data["success"] == True, "Report should succeed"
        assert "report_id" in data, "Report ID missing"
        print(f"SUCCESS: Created chat report {data['report_id']}")
        return data["report_id"]
    
    def test_report_specific_message(self, user_token, test_conversation):
        """Test POST /api/chat-reports - Report a specific message"""
        conv_id, msg_id = test_conversation
        
        if msg_id is None:
            pytest.skip("No message ID available")
        
        report_data = {
            "conversation_id": conv_id,
            "message_id": msg_id,
            "reason": "harassment",
            "details": "This specific message is harassing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat-reports",
            json=report_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to report message: {response.text}"
        data = response.json()
        
        assert data["success"] == True, "Report should succeed"
        print(f"SUCCESS: Reported specific message {msg_id}")
    
    def test_report_chat_all_reasons(self, user_token, admin_token):
        """Test POST /api/chat-reports - Test all report reasons"""
        reasons = ["spam", "harassment", "scam", "inappropriate", "other"]
        
        # Get a listing
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) == 0:
            pytest.skip("No listings available")
        
        listing = listings[0]
        
        for reason in reasons:
            # Create new conversation for each test
            conv_res = requests.post(
                f"{BASE_URL}/api/conversations",
                json={
                    "listing_id": listing["id"],
                    "seller_id": listing["seller_id"]
                },
                headers={"Authorization": f"Bearer {user_token}"}
            )
            conv_id = conv_res.json()["id"]
            
            report_data = {
                "conversation_id": conv_id,
                "reason": reason,
                "details": f"Test report with reason: {reason}"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/chat-reports",
                json=report_data,
                headers={"Authorization": f"Bearer {user_token}"}
            )
            
            assert response.status_code == 200, f"Failed to report with reason '{reason}': {response.text}"
            print(f"SUCCESS: Report with reason '{reason}' accepted")
    
    def test_admin_get_chat_reports(self, admin_token):
        """Test GET /api/admin/chat-reports - Admin can view all chat reports"""
        response = requests.get(
            f"{BASE_URL}/api/admin/chat-reports",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get chat reports: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Admin got {len(data)} chat reports")
        
        # Verify report structure if reports exist
        if len(data) > 0:
            report = data[0]
            assert "id" in report, "Report ID missing"
            assert "conversation_id" in report, "Conversation ID missing"
            assert "reason" in report, "Reason missing"
            assert "status" in report, "Status missing"
            assert "reporter_name" in report, "Reporter name missing"
            print(f"  First report: {report['reason']} - Status: {report['status']}")
    
    def test_admin_get_pending_chat_reports(self, admin_token):
        """Test GET /api/admin/chat-reports?status=pending - Filter by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/chat-reports?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get pending reports: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        for report in data:
            assert report["status"] == "pending", f"Expected pending status, got {report['status']}"
        print(f"SUCCESS: Admin got {len(data)} pending chat reports")
    
    def test_admin_resolve_chat_report(self, admin_token, user_token, test_conversation):
        """Test PUT /api/admin/chat-reports/{report_id}/review - Admin can resolve a chat report"""
        conv_id, _ = test_conversation
        
        # Create a report
        report_data = {
            "conversation_id": conv_id,
            "reason": "scam",
            "details": "Test report for resolve test"
        }
        
        report_res = requests.post(
            f"{BASE_URL}/api/chat-reports",
            json=report_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        report_id = report_res.json()["report_id"]
        
        # Admin resolves the report
        response = requests.put(
            f"{BASE_URL}/api/admin/chat-reports/{report_id}/review?action=resolved",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to resolve report: {response.text}"
        data = response.json()
        assert data["success"] == True, "Resolve should succeed"
        print(f"SUCCESS: Admin resolved chat report {report_id}")
    
    def test_admin_dismiss_chat_report(self, admin_token, user_token, test_conversation):
        """Test PUT /api/admin/chat-reports/{report_id}/review?action=dismissed - Admin can dismiss a chat report"""
        conv_id, _ = test_conversation
        
        # Create a report
        report_data = {
            "conversation_id": conv_id,
            "reason": "other",
            "details": "Test report for dismiss test"
        }
        
        report_res = requests.post(
            f"{BASE_URL}/api/chat-reports",
            json=report_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        report_id = report_res.json()["report_id"]
        
        # Admin dismisses the report
        response = requests.put(
            f"{BASE_URL}/api/admin/chat-reports/{report_id}/review?action=dismissed",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to dismiss report: {response.text}"
        data = response.json()
        assert data["success"] == True, "Dismiss should succeed"
        print(f"SUCCESS: Admin dismissed chat report {report_id}")
    
    def test_non_admin_cannot_view_chat_reports(self, user_token):
        """Test GET /api/admin/chat-reports - Non-admin cannot access"""
        response = requests.get(
            f"{BASE_URL}/api/admin/chat-reports",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("SUCCESS: Non-admin correctly blocked from viewing chat reports")
    
    def test_non_admin_cannot_resolve_chat_report(self, user_token, admin_token, test_conversation):
        """Test PUT /api/admin/chat-reports/{report_id}/review - Non-admin cannot resolve"""
        conv_id, _ = test_conversation
        
        # Create a report
        report_data = {
            "conversation_id": conv_id,
            "reason": "spam",
            "details": "Test report"
        }
        
        report_res = requests.post(
            f"{BASE_URL}/api/chat-reports",
            json=report_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        report_id = report_res.json()["report_id"]
        
        # Non-admin tries to resolve
        response = requests.put(
            f"{BASE_URL}/api/admin/chat-reports/{report_id}/review?action=resolved",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("SUCCESS: Non-admin correctly blocked from resolving chat reports")
    
    def test_report_invalid_conversation(self, user_token):
        """Test POST /api/chat-reports - Cannot report non-existent conversation"""
        report_data = {
            "conversation_id": "non-existent-conv-id",
            "reason": "spam",
            "details": "Test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat-reports",
            json=report_data,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid conversation, got {response.status_code}"
        print("SUCCESS: Invalid conversation correctly rejected")


class TestReviewsReceivedEndpoint:
    """Test /api/reviews/received endpoint for sellers to see their reviews"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_get_received_reviews(self, admin_token):
        """Test GET /api/reviews/received - Seller can see reviews they received"""
        response = requests.get(
            f"{BASE_URL}/api/reviews/received",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get received reviews: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Got {len(data)} received reviews")
        
        # Verify structure if reviews exist
        if len(data) > 0:
            review = data[0]
            assert "reviewer_name" in review, "Reviewer name missing"
            assert "rating" in review, "Rating missing"
            assert "comment" in review, "Comment missing"


class TestMyReviewsEndpoint:
    """Test /api/reviews/my-reviews endpoint for users to see reviews they left"""
    
    @pytest.fixture
    def user_token(self):
        """Get user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_get_my_reviews(self, user_token):
        """Test GET /api/reviews/my-reviews - User can see reviews they left"""
        response = requests.get(
            f"{BASE_URL}/api/reviews/my-reviews",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get my reviews: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Got {len(data)} reviews left by user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
