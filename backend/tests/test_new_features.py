"""
GGS (Game Gear Swap) - New Features API Tests
Tests for Chat System, KYC Verification, Admin Reports, and Flagged Messages
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


class TestChatSystem:
    """Chat system tests - conversations and messages"""
    
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
    def listing_id(self, user_token):
        """Get or create a listing for chat testing"""
        # Get existing listings
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) > 0:
            return listings[0]["id"], listings[0]["seller_id"]
        
        # Create a new listing if none exist
        categories_res = requests.get(f"{BASE_URL}/api/categories")
        category_id = categories_res.json()[0]["id"]
        
        listing_data = {
            "title": "TEST Chat Listing",
            "description": "Test listing for chat testing",
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
            headers={"Authorization": f"Bearer {user_token}"}
        )
        listing_id = create_res.json()["id"]
        seller_id = create_res.json()["seller_id"]
        
        # Complete payment
        requests.post(
            f"{BASE_URL}/api/payments/complete",
            json={"listing_id": listing_id, "payment_method": "upi"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        return listing_id, seller_id
    
    def test_create_conversation(self, admin_token, listing_id):
        """Test creating a conversation from listing page"""
        listing_id_val, seller_id = listing_id
        
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id_val,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["listing_id"] == listing_id_val
        print(f"SUCCESS: Created conversation: {data['id']}")
        return data["id"]
    
    def test_get_conversations(self, user_token):
        """Test fetching user's conversations"""
        response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} conversations")
    
    def test_send_message(self, admin_token, listing_id):
        """Test sending a text message"""
        listing_id_val, seller_id = listing_id
        
        # Create conversation first
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id_val,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Send message
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "text": "Hello, is this item still available?"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["text"] == "Hello, is this item still available?"
        assert data["is_flagged"] == False
        print(f"SUCCESS: Sent message: {data['id']}")
    
    def test_profanity_filter(self, admin_token, listing_id):
        """Test profanity filter blocks inappropriate words"""
        listing_id_val, seller_id = listing_id
        
        # Create conversation
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id_val,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Send message with blocked word
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "text": "This is a scam product!"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_flagged"] == True
        assert "****" in data["text"]  # Word should be filtered
        print(f"SUCCESS: Profanity filter working - message flagged and filtered")
        print(f"  Original: 'This is a scam product!'")
        print(f"  Filtered: '{data['text']}'")
    
    def test_get_messages(self, admin_token, listing_id):
        """Test fetching messages in a conversation"""
        listing_id_val, seller_id = listing_id
        
        # Create conversation
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id_val,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Send a message first
        requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "text": "Test message for fetching"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Get messages
        response = requests.get(
            f"{BASE_URL}/api/conversations/{conv_id}/messages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"SUCCESS: Got {len(data)} messages in conversation")
    
    def test_typing_indicator(self, admin_token, listing_id):
        """Test typing indicator endpoint"""
        listing_id_val, seller_id = listing_id
        
        # Create conversation
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id_val,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Set typing status
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/typing?is_typing=true",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Typing indicator endpoint working")
    
    def test_mark_message_read(self, user_token, admin_token, listing_id):
        """Test marking a message as read"""
        listing_id_val, seller_id = listing_id
        
        # Create conversation as admin
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id_val,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Send message as admin
        msg_res = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "text": "Test message for read status"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        msg_id = msg_res.json()["id"]
        
        # Mark as read by user (recipient)
        response = requests.post(
            f"{BASE_URL}/api/messages/{msg_id}/read",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Message marked as read")
    
    def test_send_message_with_image(self, admin_token, listing_id):
        """Test sending a message with image attachment"""
        listing_id_val, seller_id = listing_id
        
        # Create conversation
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id_val,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Send message with image attachment
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "text": "📷 Image",
                "attachment_url": "https://example.com/test-image.jpg",
                "attachment_type": "image"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["attachment_url"] == "https://example.com/test-image.jpg"
        assert data["attachment_type"] == "image"
        print(f"SUCCESS: Message with image attachment sent")


class TestKYCVerification:
    """KYC verification system tests"""
    
    @pytest.fixture
    def new_user_token(self):
        """Create a new user for KYC testing"""
        unique_email = f"TEST_kyc_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST KYC User",
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_submit_kyc_aadhaar(self, new_user_token):
        """Test submitting KYC with Aadhaar card"""
        response = requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "aadhaar",
                "document_number": "1234567890",
                "document_image_url": "https://example.com/aadhaar.jpg"
            },
            headers={"Authorization": f"Bearer {new_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "kyc_id" in data
        print(f"SUCCESS: KYC submitted with Aadhaar - ID: {data['kyc_id']}")
    
    def test_submit_kyc_pan(self):
        """Test submitting KYC with PAN card"""
        # Create new user
        unique_email = f"TEST_kyc_pan_{uuid.uuid4().hex[:8]}@test.com"
        register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST KYC PAN User",
            "auth_type": "email"
        })
        token = register_res.json()["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "pan",
                "document_number": "ABCDE1234F",
                "document_image_url": "https://example.com/pan.jpg"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: KYC submitted with PAN card")
    
    def test_submit_kyc_driving_license(self):
        """Test submitting KYC with Driving License"""
        # Create new user
        unique_email = f"TEST_kyc_dl_{uuid.uuid4().hex[:8]}@test.com"
        register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST KYC DL User",
            "auth_type": "email"
        })
        token = register_res.json()["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "driving_license",
                "document_number": "KL0120210012345",
                "document_image_url": "https://example.com/dl.jpg"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: KYC submitted with Driving License")
    
    def test_submit_kyc_voter_id(self):
        """Test submitting KYC with Voter ID"""
        # Create new user
        unique_email = f"TEST_kyc_voter_{uuid.uuid4().hex[:8]}@test.com"
        register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST KYC Voter User",
            "auth_type": "email"
        })
        token = register_res.json()["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "voter_id",
                "document_number": "ABC1234567",
                "document_image_url": "https://example.com/voter.jpg"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: KYC submitted with Voter ID")
    
    def test_get_kyc_status(self, new_user_token):
        """Test getting KYC status"""
        response = requests.get(
            f"{BASE_URL}/api/kyc/status",
            headers={"Authorization": f"Bearer {new_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        print(f"SUCCESS: Got KYC status: {data['status']}")
    
    def test_duplicate_kyc_submission_rejected(self, new_user_token):
        """Test that duplicate KYC submission is rejected"""
        # Submit first KYC
        requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "aadhaar",
                "document_number": "9876543210",
                "document_image_url": "https://example.com/aadhaar2.jpg"
            },
            headers={"Authorization": f"Bearer {new_user_token}"}
        )
        
        # Try to submit again
        response = requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "pan",
                "document_number": "ZYXWV9876A",
                "document_image_url": "https://example.com/pan2.jpg"
            },
            headers={"Authorization": f"Bearer {new_user_token}"}
        )
        assert response.status_code == 400
        print(f"SUCCESS: Duplicate KYC submission correctly rejected")


class TestAdminKYCManagement:
    """Admin KYC management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def kyc_submission(self):
        """Create a KYC submission for testing"""
        unique_email = f"TEST_kyc_admin_{uuid.uuid4().hex[:8]}@test.com"
        register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST KYC Admin User",
            "auth_type": "email"
        })
        token = register_res.json()["token"]
        
        kyc_res = requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "aadhaar",
                "document_number": "1111222233",
                "document_image_url": "https://example.com/test-aadhaar.jpg"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        return kyc_res.json()["kyc_id"]
    
    def test_admin_get_kyc_submissions(self, admin_token):
        """Test admin fetching all KYC submissions"""
        response = requests.get(
            f"{BASE_URL}/api/admin/kyc",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin got {len(data)} KYC submissions")
    
    def test_admin_get_pending_kyc(self, admin_token):
        """Test admin fetching pending KYC submissions"""
        response = requests.get(
            f"{BASE_URL}/api/admin/kyc?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for kyc in data:
            assert kyc["status"] == "pending"
        print(f"SUCCESS: Admin got {len(data)} pending KYC submissions")
    
    def test_admin_approve_kyc(self, admin_token, kyc_submission):
        """Test admin approving a KYC submission"""
        response = requests.put(
            f"{BASE_URL}/api/admin/kyc/{kyc_submission}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Admin approved KYC: {kyc_submission}")
    
    def test_admin_reject_kyc(self, admin_token):
        """Test admin rejecting a KYC submission"""
        # Create a new KYC submission
        unique_email = f"TEST_kyc_reject_{uuid.uuid4().hex[:8]}@test.com"
        register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "TEST KYC Reject User",
            "auth_type": "email"
        })
        token = register_res.json()["token"]
        
        kyc_res = requests.post(
            f"{BASE_URL}/api/kyc/submit",
            json={
                "document_type": "pan",
                "document_number": "REJECT1234",
                "document_image_url": "https://example.com/reject-pan.jpg"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        kyc_id = kyc_res.json()["kyc_id"]
        
        # Reject KYC
        response = requests.put(
            f"{BASE_URL}/api/admin/kyc/{kyc_id}/reject?reason=Document%20not%20clear",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Admin rejected KYC: {kyc_id}")


class TestAdminReports:
    """Admin reports management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def user_token(self):
        """Get user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_admin_get_reports(self, admin_token):
        """Test admin fetching all reports"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin got {len(data)} reports")
    
    def test_admin_get_pending_reports(self, admin_token):
        """Test admin fetching pending reports"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin got {len(data)} pending reports")
    
    def test_admin_resolve_report(self, admin_token, user_token):
        """Test admin resolving a report"""
        # Create a report first
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) == 0:
            print("SKIP: No listings to report")
            return
        
        listing_id = listings[0]["id"]
        
        report_res = requests.post(
            f"{BASE_URL}/api/reports",
            json={
                "target_type": "listing",
                "target_id": listing_id,
                "reason": "fake",
                "details": "Test report for admin resolve test"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        report_id = report_res.json()["id"]
        
        # Resolve the report
        response = requests.put(
            f"{BASE_URL}/api/admin/reports/{report_id}/review?action=resolved",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Admin resolved report: {report_id}")
    
    def test_admin_dismiss_report(self, admin_token, user_token):
        """Test admin dismissing a report"""
        # Create a report first
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) == 0:
            print("SKIP: No listings to report")
            return
        
        listing_id = listings[0]["id"]
        
        report_res = requests.post(
            f"{BASE_URL}/api/reports",
            json={
                "target_type": "listing",
                "target_id": listing_id,
                "reason": "other",
                "details": "Test report for admin dismiss test"
            },
            headers={"Authorization": f"Bearer {user_token}"}
        )
        report_id = report_res.json()["id"]
        
        # Dismiss the report
        response = requests.put(
            f"{BASE_URL}/api/admin/reports/{report_id}/review?action=dismissed",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Admin dismissed report: {report_id}")


class TestAdminFlaggedMessages:
    """Admin flagged messages management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def flagged_message(self, admin_token):
        """Create a flagged message for testing"""
        # Get a listing
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) == 0:
            return None
        
        listing_id = listings[0]["id"]
        seller_id = listings[0]["seller_id"]
        
        # Create conversation
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Send message with blocked word to trigger flag
        requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "text": "This is a fraud listing!"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        return conv_id
    
    def test_admin_get_flagged_messages(self, admin_token):
        """Test admin fetching all flagged messages"""
        response = requests.get(
            f"{BASE_URL}/api/admin/flagged-messages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin got {len(data)} flagged messages")
    
    def test_admin_get_pending_flagged_messages(self, admin_token):
        """Test admin fetching pending flagged messages"""
        response = requests.get(
            f"{BASE_URL}/api/admin/flagged-messages?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Admin got {len(data)} pending flagged messages")
    
    def test_admin_review_flagged_message(self, admin_token, flagged_message):
        """Test admin reviewing a flagged message"""
        if flagged_message is None:
            print("SKIP: No listings available for flagged message test")
            return
        
        # Get flagged messages
        flagged_res = requests.get(
            f"{BASE_URL}/api/admin/flagged-messages?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        flagged = flagged_res.json()
        
        if len(flagged) == 0:
            print("SKIP: No pending flagged messages")
            return
        
        flag_id = flagged[0]["id"]
        
        # Review the flagged message
        response = requests.put(
            f"{BASE_URL}/api/admin/flagged-messages/{flag_id}/review?action=reviewed",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Admin reviewed flagged message: {flag_id}")
    
    def test_admin_dismiss_flagged_message(self, admin_token):
        """Test admin dismissing a flagged message"""
        # Create a new flagged message
        listings_res = requests.get(f"{BASE_URL}/api/listings")
        listings = listings_res.json()
        if len(listings) == 0:
            print("SKIP: No listings available")
            return
        
        listing_id = listings[0]["id"]
        seller_id = listings[0]["seller_id"]
        
        # Create conversation
        conv_res = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "listing_id": listing_id,
                "seller_id": seller_id
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        conv_id = conv_res.json()["id"]
        
        # Send message with blocked word
        requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "conversation_id": conv_id,
                "text": "You are an idiot seller!"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Get the flagged message
        flagged_res = requests.get(
            f"{BASE_URL}/api/admin/flagged-messages?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        flagged = flagged_res.json()
        
        if len(flagged) == 0:
            print("SKIP: No pending flagged messages")
            return
        
        flag_id = flagged[0]["id"]
        
        # Dismiss the flagged message
        response = requests.put(
            f"{BASE_URL}/api/admin/flagged-messages/{flag_id}/review?action=dismissed",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"SUCCESS: Admin dismissed flagged message: {flag_id}")


class TestNonAdminAccessDenied:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture
    def user_token(self):
        """Get regular user auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "auth_type": "email"
        })
        return response.json()["token"]
    
    def test_non_admin_cannot_access_kyc_list(self, user_token):
        """Test regular user cannot access KYC list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/kyc",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        print(f"SUCCESS: Non-admin correctly blocked from KYC list")
    
    def test_non_admin_cannot_access_reports(self, user_token):
        """Test regular user cannot access admin reports"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        print(f"SUCCESS: Non-admin correctly blocked from admin reports")
    
    def test_non_admin_cannot_access_flagged_messages(self, user_token):
        """Test regular user cannot access flagged messages"""
        response = requests.get(
            f"{BASE_URL}/api/admin/flagged-messages",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        print(f"SUCCESS: Non-admin correctly blocked from flagged messages")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
