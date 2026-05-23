"""
Test suite for GGS Admin Enhancement Features:
- User Management: Ban/Unban/Delete/Verify/Change Role
- Bulk Operations: Users/Listings/Reports
- Admin Conversations: View all chats
- Export Data: Users/Payments/Listings/Reports/KYC
- Invoice: Get payment invoice
- User Payments: Get my payments
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@ggs.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"test_admin_user_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "testpass123"


class TestAdminEnhancements:
    """Test suite for admin enhancement features"""
    
    admin_token = None
    test_user_id = None
    test_user_token = None
    test_listing_id = None
    test_payment_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Setup test fixtures"""
        if not TestAdminEnhancements.admin_token:
            # Login as admin
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "auth_type": "email"
            })
            assert response.status_code == 200, f"Admin login failed: {response.text}"
            TestAdminEnhancements.admin_token = response.json()["token"]
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {TestAdminEnhancements.admin_token}"}
    
    def get_user_headers(self):
        return {"Authorization": f"Bearer {TestAdminEnhancements.test_user_token}"}
    
    # ============== USER MANAGEMENT TESTS ==============
    
    def test_01_create_test_user(self):
        """Create a test user for admin operations"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": "Test Admin User",
            "auth_type": "email"
        })
        assert response.status_code == 200, f"User registration failed: {response.text}"
        data = response.json()
        TestAdminEnhancements.test_user_id = data["user"]["id"]
        TestAdminEnhancements.test_user_token = data["token"]
        print(f"✓ Created test user: {TestAdminEnhancements.test_user_id}")
    
    def test_02_admin_ban_user(self):
        """Test POST /api/admin/users/{user_id}/ban"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}/ban",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Ban user failed: {response.text}"
        data = response.json()
        assert "banned" in data.get("message", "").lower() or "success" in data.get("message", "").lower()
        print("✓ User banned successfully")
    
    def test_03_banned_user_cannot_login(self):
        """Verify banned user cannot access protected routes"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=self.get_user_headers()
        )
        # Should return 403 (suspended) or 401
        assert response.status_code in [401, 403], f"Banned user should not access: {response.status_code}"
        print("✓ Banned user correctly blocked from access")
    
    def test_04_admin_unban_user(self):
        """Test POST /api/admin/users/{user_id}/unban"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}/unban",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Unban user failed: {response.text}"
        print("✓ User unbanned successfully")
    
    def test_05_unbanned_user_can_login(self):
        """Verify unbanned user can access protected routes"""
        # Re-login to get fresh token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "auth_type": "email"
        })
        assert response.status_code == 200, f"Unbanned user login failed: {response.text}"
        TestAdminEnhancements.test_user_token = response.json()["token"]
        
        # Verify can access protected route
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=self.get_user_headers()
        )
        assert response.status_code == 200, f"Unbanned user should access: {response.text}"
        print("✓ Unbanned user can access protected routes")
    
    def test_06_admin_verify_user(self):
        """Test POST /api/admin/users/{user_id}/verify"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}/verify",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Verify user failed: {response.text}"
        
        # Verify user is now verified
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=self.get_user_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("is_seller_verified") == True, "User should be verified"
        print("✓ User verified successfully")
    
    def test_07_admin_change_role_to_seller(self):
        """Test POST /api/admin/users/{user_id}/role?role=seller"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}/role?role=seller",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Change role failed: {response.text}"
        
        # Verify role changed
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=self.get_user_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("role") == "seller", f"Role should be seller, got: {data.get('role')}"
        print("✓ User role changed to seller")
    
    def test_08_admin_change_role_to_user(self):
        """Test changing role back to user"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}/role?role=user",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Change role failed: {response.text}"
        print("✓ User role changed back to user")
    
    def test_09_admin_change_role_invalid(self):
        """Test invalid role change"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}/role?role=invalid_role",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 400, f"Should reject invalid role: {response.status_code}"
        print("✓ Invalid role correctly rejected")
    
    def test_10_cannot_ban_admin(self):
        """Test that admin users cannot be banned"""
        # Get admin user ID
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200
        users = response.json()
        admin_user = next((u for u in users if u.get("role") == "admin"), None)
        
        if admin_user:
            response = requests.post(
                f"{BASE_URL}/api/admin/users/{admin_user['id']}/ban",
                headers=self.get_admin_headers()
            )
            assert response.status_code == 400, f"Should not ban admin: {response.status_code}"
            print("✓ Admin users cannot be banned")
        else:
            print("⚠ No admin user found to test")
    
    # ============== BULK OPERATIONS TESTS ==============
    
    def test_11_bulk_user_ban(self):
        """Test POST /api/admin/users/bulk - ban action"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/bulk",
            headers=self.get_admin_headers(),
            json={
                "user_ids": [TestAdminEnhancements.test_user_id],
                "action": "ban"
            }
        )
        assert response.status_code == 200, f"Bulk ban failed: {response.text}"
        data = response.json()
        assert data.get("success", 0) >= 1, f"Expected success >= 1, got: {data}"
        print(f"✓ Bulk ban: {data.get('success')} users banned")
    
    def test_12_bulk_user_unban(self):
        """Test POST /api/admin/users/bulk - unban action"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/bulk",
            headers=self.get_admin_headers(),
            json={
                "user_ids": [TestAdminEnhancements.test_user_id],
                "action": "unban"
            }
        )
        assert response.status_code == 200, f"Bulk unban failed: {response.text}"
        data = response.json()
        assert data.get("success", 0) >= 1
        print(f"✓ Bulk unban: {data.get('success')} users unbanned")
    
    def test_13_bulk_user_verify(self):
        """Test POST /api/admin/users/bulk - verify action"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/bulk",
            headers=self.get_admin_headers(),
            json={
                "user_ids": [TestAdminEnhancements.test_user_id],
                "action": "verify"
            }
        )
        assert response.status_code == 200, f"Bulk verify failed: {response.text}"
        data = response.json()
        assert data.get("success", 0) >= 1
        print(f"✓ Bulk verify: {data.get('success')} users verified")
    
    def test_14_create_test_listing_for_bulk(self):
        """Create a test listing for bulk operations"""
        # Re-login user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "auth_type": "email"
        })
        if response.status_code == 200:
            TestAdminEnhancements.test_user_token = response.json()["token"]
        
        # Get categories
        response = requests.get(f"{BASE_URL}/api/categories")
        categories = response.json()
        category_id = categories[0]["id"] if categories else "test-cat"
        
        # Create listing
        response = requests.post(
            f"{BASE_URL}/api/listings",
            headers=self.get_user_headers(),
            json={
                "title": "TEST_Bulk_Listing",
                "description": "Test listing for bulk operations",
                "category_id": category_id,
                "price": 100,
                "price_type": "fixed",
                "condition": "new",
                "item_type": "physical",
                "location": "Kochi",
                "contact_phone": "9876543210",
                "contact_method": "both",
                "images": []
            }
        )
        assert response.status_code == 200, f"Create listing failed: {response.text}"
        TestAdminEnhancements.test_listing_id = response.json()["id"]
        print(f"✓ Created test listing: {TestAdminEnhancements.test_listing_id}")
    
    def test_15_bulk_listing_approve(self):
        """Test POST /api/admin/listings/bulk - approve action"""
        response = requests.post(
            f"{BASE_URL}/api/admin/listings/bulk",
            headers=self.get_admin_headers(),
            json={
                "listing_ids": [TestAdminEnhancements.test_listing_id],
                "action": "approve"
            }
        )
        assert response.status_code == 200, f"Bulk approve failed: {response.text}"
        data = response.json()
        assert data.get("success", 0) >= 1
        print(f"✓ Bulk approve: {data.get('success')} listings approved")
    
    def test_16_bulk_listing_feature(self):
        """Test POST /api/admin/listings/bulk - feature action"""
        response = requests.post(
            f"{BASE_URL}/api/admin/listings/bulk",
            headers=self.get_admin_headers(),
            json={
                "listing_ids": [TestAdminEnhancements.test_listing_id],
                "action": "feature"
            }
        )
        assert response.status_code == 200, f"Bulk feature failed: {response.text}"
        data = response.json()
        assert data.get("success", 0) >= 1
        print(f"✓ Bulk feature: {data.get('success')} listings featured")
    
    def test_17_bulk_listing_reject(self):
        """Test POST /api/admin/listings/bulk - reject action"""
        response = requests.post(
            f"{BASE_URL}/api/admin/listings/bulk",
            headers=self.get_admin_headers(),
            json={
                "listing_ids": [TestAdminEnhancements.test_listing_id],
                "action": "reject"
            }
        )
        assert response.status_code == 200, f"Bulk reject failed: {response.text}"
        data = response.json()
        assert data.get("success", 0) >= 1
        print(f"✓ Bulk reject: {data.get('success')} listings rejected")
    
    def test_18_bulk_report_operations(self):
        """Test POST /api/admin/reports/bulk"""
        # First get existing reports
        response = requests.get(
            f"{BASE_URL}/api/admin/reports",
            headers=self.get_admin_headers()
        )
        if response.status_code == 200:
            reports = response.json()
            if reports:
                report_id = reports[0]["id"]
                # Test bulk resolve
                response = requests.post(
                    f"{BASE_URL}/api/admin/reports/bulk",
                    headers=self.get_admin_headers(),
                    json={
                        "report_ids": [report_id],
                        "action": "resolve",
                        "report_type": "ad"
                    }
                )
                assert response.status_code == 200, f"Bulk report resolve failed: {response.text}"
                print(f"✓ Bulk report resolve successful")
            else:
                print("⚠ No reports to test bulk operations")
        else:
            print("⚠ Could not fetch reports for bulk test")
    
    # ============== ADMIN CONVERSATIONS TESTS ==============
    
    def test_19_admin_get_all_conversations(self):
        """Test GET /api/admin/conversations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/conversations",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Get conversations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return list of conversations"
        print(f"✓ Admin can view all conversations: {len(data)} found")
        
        # Store a conversation ID for message test
        if data:
            TestAdminEnhancements.test_conv_id = data[0]["id"]
    
    def test_20_admin_get_conversation_messages(self):
        """Test GET /api/admin/conversations/{conv_id}/messages"""
        if not hasattr(TestAdminEnhancements, 'test_conv_id') or not TestAdminEnhancements.test_conv_id:
            pytest.skip("No conversation available for testing")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/conversations/{TestAdminEnhancements.test_conv_id}/messages",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Get messages failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return list of messages"
        print(f"✓ Admin can view conversation messages: {len(data)} messages")
    
    # ============== EXPORT DATA TESTS ==============
    
    def test_21_export_users(self):
        """Test GET /api/admin/export/users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/users",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Export users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return list of users"
        assert len(data) > 0, "Should have at least one user"
        # Verify user data structure
        if data:
            user = data[0]
            assert "id" in user, "User should have id"
            assert "name" in user, "User should have name"
            assert "password" not in user, "Password should not be exported"
        print(f"✓ Export users: {len(data)} users exported")
    
    def test_22_export_payments(self):
        """Test GET /api/admin/export/payments"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/payments",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Export payments failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return list of payments"
        print(f"✓ Export payments: {len(data)} payments exported")
    
    def test_23_export_listings(self):
        """Test GET /api/admin/export/listings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/listings",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Export listings failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return list of listings"
        print(f"✓ Export listings: {len(data)} listings exported")
    
    def test_24_export_reports(self):
        """Test GET /api/admin/export/reports"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/reports",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Export reports failed: {response.text}"
        data = response.json()
        # Reports return nested structure
        assert "ad_reports" in data or "chat_reports" in data, "Should have report types"
        print(f"✓ Export reports: ad={len(data.get('ad_reports', []))}, chat={len(data.get('chat_reports', []))}")
    
    def test_25_export_kyc(self):
        """Test GET /api/admin/export/kyc"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/kyc",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Export KYC failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return list of KYC submissions"
        print(f"✓ Export KYC: {len(data)} submissions exported")
    
    def test_26_export_invalid_type(self):
        """Test invalid export type returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/invalid_type",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 400, f"Should reject invalid export type: {response.status_code}"
        print("✓ Invalid export type correctly rejected")
    
    # ============== INVOICE TESTS ==============
    
    def test_27_create_payment_for_invoice(self):
        """Create a payment to test invoice"""
        # Complete payment for the test listing
        if TestAdminEnhancements.test_listing_id:
            response = requests.post(
                f"{BASE_URL}/api/payments/complete",
                headers=self.get_user_headers(),
                json={
                    "listing_id": TestAdminEnhancements.test_listing_id,
                    "payment_method": "upi"
                }
            )
            if response.status_code == 200:
                TestAdminEnhancements.test_payment_id = response.json().get("payment_id")
                print(f"✓ Created payment: {TestAdminEnhancements.test_payment_id}")
            elif response.status_code == 400 and "already completed" in response.text.lower():
                # Payment already exists, get it
                response = requests.get(
                    f"{BASE_URL}/api/payments/my",
                    headers=self.get_user_headers()
                )
                if response.status_code == 200:
                    payments = response.json()
                    if payments:
                        TestAdminEnhancements.test_payment_id = payments[0]["id"]
                        print(f"✓ Using existing payment: {TestAdminEnhancements.test_payment_id}")
    
    def test_28_get_payment_invoice(self):
        """Test GET /api/payments/{payment_id}/invoice"""
        if not TestAdminEnhancements.test_payment_id:
            # Try to get any payment
            response = requests.get(
                f"{BASE_URL}/api/payments/my",
                headers=self.get_user_headers()
            )
            if response.status_code == 200:
                payments = response.json()
                if payments:
                    TestAdminEnhancements.test_payment_id = payments[0]["id"]
        
        if not TestAdminEnhancements.test_payment_id:
            pytest.skip("No payment available for invoice test")
        
        response = requests.get(
            f"{BASE_URL}/api/payments/{TestAdminEnhancements.test_payment_id}/invoice",
            headers=self.get_user_headers()
        )
        assert response.status_code == 200, f"Get invoice failed: {response.text}"
        data = response.json()
        
        # Verify invoice structure
        assert "invoice_number" in data, "Invoice should have invoice_number"
        assert "invoice_date" in data, "Invoice should have invoice_date"
        assert "total_amount" in data, "Invoice should have total_amount"
        assert "base_amount" in data, "Invoice should have base_amount"
        assert "gst_amount" in data, "Invoice should have gst_amount"
        assert "user_name" in data, "Invoice should have user_name"
        assert "company_name" in data, "Invoice should have company_name"
        
        print(f"✓ Invoice retrieved: {data['invoice_number']}")
    
    def test_29_admin_can_view_any_invoice(self):
        """Test admin can view any user's invoice"""
        if not TestAdminEnhancements.test_payment_id:
            pytest.skip("No payment available for invoice test")
        
        response = requests.get(
            f"{BASE_URL}/api/payments/{TestAdminEnhancements.test_payment_id}/invoice",
            headers=self.get_admin_headers()
        )
        assert response.status_code == 200, f"Admin get invoice failed: {response.text}"
        print("✓ Admin can view any user's invoice")
    
    # ============== USER PAYMENTS TESTS ==============
    
    def test_30_get_my_payments(self):
        """Test GET /api/payments/my"""
        response = requests.get(
            f"{BASE_URL}/api/payments/my",
            headers=self.get_user_headers()
        )
        assert response.status_code == 200, f"Get my payments failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return list of payments"
        
        # Verify payment structure if any exist
        if data:
            payment = data[0]
            assert "id" in payment, "Payment should have id"
            assert "amount" in payment, "Payment should have amount"
            assert "status" in payment, "Payment should have status"
        
        print(f"✓ Get my payments: {len(data)} payments found")
    
    # ============== NON-ADMIN ACCESS TESTS ==============
    
    def test_31_non_admin_cannot_ban_user(self):
        """Test non-admin cannot access admin endpoints"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}/ban",
            headers=self.get_user_headers()
        )
        assert response.status_code == 403, f"Non-admin should be blocked: {response.status_code}"
        print("✓ Non-admin correctly blocked from ban endpoint")
    
    def test_32_non_admin_cannot_export(self):
        """Test non-admin cannot export data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/users",
            headers=self.get_user_headers()
        )
        assert response.status_code == 403, f"Non-admin should be blocked: {response.status_code}"
        print("✓ Non-admin correctly blocked from export endpoint")
    
    def test_33_non_admin_cannot_view_all_conversations(self):
        """Test non-admin cannot view all conversations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/conversations",
            headers=self.get_user_headers()
        )
        assert response.status_code == 403, f"Non-admin should be blocked: {response.status_code}"
        print("✓ Non-admin correctly blocked from admin conversations")
    
    # ============== CLEANUP ==============
    
    def test_99_cleanup_test_user(self):
        """Delete test user and listing"""
        # Delete test listing
        if TestAdminEnhancements.test_listing_id:
            response = requests.post(
                f"{BASE_URL}/api/admin/listings/bulk",
                headers=self.get_admin_headers(),
                json={
                    "listing_ids": [TestAdminEnhancements.test_listing_id],
                    "action": "delete"
                }
            )
            print(f"✓ Cleaned up test listing")
        
        # Delete test user
        if TestAdminEnhancements.test_user_id:
            response = requests.delete(
                f"{BASE_URL}/api/admin/users/{TestAdminEnhancements.test_user_id}",
                headers=self.get_admin_headers()
            )
            if response.status_code == 200:
                print(f"✓ Cleaned up test user")
            else:
                print(f"⚠ Could not delete test user: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
