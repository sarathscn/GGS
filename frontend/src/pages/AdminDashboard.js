import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { generateInvoicePdf } from '../lib/invoicePdf';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import Logo from '../components/Logo';
import PaginationControls from '../components/ui/PaginationControls';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  FolderOpen,
  FileText,
  TrendingUp,
  Eye,
  Check,
  X,
  Star,
  Ban,
  Shield,
  Loader2,
  Edit,
  Trash2,
  Flag,
  MessageCircle,
  Download,
  Camera,
  Upload,
  UserX,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  RotateCcw,
  HelpCircle,
  Search,
  MoreVertical,
  ExternalLink,
  FileSpreadsheet,
  Receipt,
  AlertTriangle,
  Plus,
  Send,
  BookOpen,
  Clock,
  ShoppingBag,
  Tag,
  MapPin,
  Sparkles,
  Filter,
  Layers,
  Copy,
  CheckCheck,
  Code,
  FileSearch,
  History,
  RefreshCw,
  ZoomIn
} from 'lucide-react';

// Utility: Export to Excel (CSV)
const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Interactive Stats Card Component
function StatsCard({ title, value, icon: Icon, color, subtitle, onClick, to, ariaLabel, isActive, className = '' }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  const isInteractive = Boolean(onClick || to);

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); } } : undefined}
      aria-label={ariaLabel || title}
      className={`bg-card border border-border rounded-xl p-6 transition-all select-none group ${
        isInteractive 
          ? 'cursor-pointer hover:border-violet-500/50 hover:bg-muted/30 hover:shadow-md hover:shadow-violet-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 active:scale-[0.99]' 
          : ''
      } ${isActive ? 'ring-1 ring-violet-500/50 border-violet-500/60 bg-violet-500/5' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-sm text-muted-foreground font-medium truncate group-hover:text-foreground transition-colors">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground truncate">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Overview Component with Interactive Cards & Quick Stats
function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-overview">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Dashboard Overview</h2>
          <span className="text-xs text-muted-foreground">Click any card to filter or navigate</span>
        </div>
        
        {/* Main 4 Interactive Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats?.total_users || 0}
            subtitle={`${stats?.banned_users || 0} banned, ${stats?.verified_users || 0} verified`}
            icon={Users}
            color="bg-violet-600"
            to="/admin/users"
            ariaLabel="Navigate to Users Management"
          />
          <StatsCard
            title="Total Listings"
            value={stats?.total_listings || 0}
            subtitle={`${stats?.active_listings || 0} active`}
            icon={Package}
            color="bg-cyan-500"
            to="/admin/listings?status=all"
            ariaLabel="Navigate to Listings Management"
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${stats?.total_revenue || 0}`}
            subtitle={`${stats?.total_payments || 0} payments`}
            icon={CreditCard}
            color="bg-emerald-500"
            to="/admin/payments"
            ariaLabel="Navigate to Revenue & Payments"
          />
          <StatsCard
            title="Pending Actions"
            value={(stats?.pending_reports || 0) + (stats?.pending_chat_reports || 0) + (stats?.pending_kyc || 0)}
            subtitle={`${stats?.pending_kyc || 0} KYC, ${stats?.pending_reports || 0} reports`}
            icon={AlertTriangle}
            color="bg-amber-500"
            to="/admin/moderation?status=pending"
            ariaLabel="Navigate to Pending Moderation Actions"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Stats Interactive List */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Quick Stats</h3>
            <span className="text-[11px] text-muted-foreground">Click row to open view</span>
          </div>
          <div className="space-y-2.5">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/listings?status=pending_payment')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/admin/listings?status=pending_payment'); }}
              className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-violet-500/30 hover:bg-muted/40 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-sm text-muted-foreground hover:text-foreground">Pending Listings (Payment)</span>
              </div>
              <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded text-xs">
                {stats?.pending_listings || 0}
              </span>
            </div>

            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/kyc?status=pending')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/admin/kyc?status=pending'); }}
              className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-amber-500/30 hover:bg-muted/40 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-muted-foreground hover:text-foreground">Pending KYC & Verification</span>
              </div>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs">
                {stats?.pending_kyc || 0}
              </span>
            </div>

            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/reports?status=pending')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/admin/reports?status=pending'); }}
              className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-muted/40 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-sm text-muted-foreground hover:text-foreground">Pending Ad Reports</span>
              </div>
              <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-xs">
                {stats?.pending_reports || 0}
              </span>
            </div>

            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/reports?type=chat')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/admin/reports?type=chat'); }}
              className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-cyan-500/30 hover:bg-muted/40 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-sm text-muted-foreground hover:text-foreground">Chat Moderation Reports</span>
              </div>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-xs">
                {stats?.pending_chat_reports || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-bold mb-4">Export Data</h3>
          <div className="grid grid-cols-2 gap-2">
            <ExportButton type="users" label="Users" />
            <ExportButton type="payments" label="Payments" />
            <ExportButton type="listings" label="Listings" />
            <ExportButton type="reports" label="Reports" />
            <ExportButton type="kyc" label="KYC Data" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export Button Component
function ExportButton({ type, label }) {
  const [loading, setLoading] = useState(false);
  
  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/export/${type}`);
      let data = response.data;
      
      // Handle reports which have nested structure
      if (type === 'reports') {
        const combined = [
          ...(data.ad_reports || []).map(r => ({ ...r, type: 'ad' })),
          ...(data.chat_reports || []).map(r => ({ ...r, type: 'chat' }))
        ];
        data = combined;
      }
      
      exportToExcel(data, `ggs_${type}`);
      toast.success(`${label} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${label}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="w-full"
      data-testid={`export-${type}-btn`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <FileSpreadsheet className="w-4 h-4 mr-2" />
      )}
      {label}
    </Button>
  );
}

// Enhanced Users Management Component
function UsersManagement({ onUserUpdated }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersPage, setUsersPage] = useState(1);

  // Ban / Unban Dialog States (User-visible reason + confidential internal notes)
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [userVisibleBanReason, setUserVisibleBanReason] = useState('');
  const [banAdminNotes, setBanAdminNotes] = useState('');
  const [banLoading, setBanLoading] = useState(false);

  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [userToUnban, setUserToUnban] = useState(null);
  const [unbanLoading, setUnbanLoading] = useState(false);

  // Revoke Verification Dialog States
  const [showRevokeVerificationDialog, setShowRevokeVerificationDialog] = useState(false);
  const [userToRevokeVerification, setUserToRevokeVerification] = useState(null);
  const [revokeVerificationReason, setRevokeVerificationReason] = useState('');
  const [revokeVerificationAdminNotes, setRevokeVerificationAdminNotes] = useState('');
  const [revokeVerificationLoading, setRevokeVerificationLoading] = useState(false);

  // Detail Modal State
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (user) => {
    setUserDetail(user);
    setShowDetailDialog(true);
    setDetailsLoading(true);
    try {
      const [listingsRes, paymentsRes] = await Promise.all([
        api.get(`/admin/listings?user_id=${user.id}`),
        api.get(`/admin/payments?user_id=${user.id}`)
      ]);
      setUserListings(listingsRes.data);
      setUserPayments(paymentsRes.data);
    } catch (error) {
      toast.error('Failed to fetch user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openBanDialog = (user) => {
    setUserToBan(user);
    setUserVisibleBanReason('Account suspended by administrator for violation of platform terms of service.');
    setBanAdminNotes('');
    setShowBanDialog(true);
  };

  const confirmBan = async () => {
    if (!userToBan) return;
    setBanLoading(true);
    try {
      await api.post(`/admin/users/${userToBan.id}/ban`, {
        user_visible_reason: userVisibleBanReason.trim() || 'Account suspended by administrator',
        admin_notes: banAdminNotes.trim(),
        reason: userVisibleBanReason.trim() || 'Account suspended by administrator'
      });
      toast.success(`User ${userToBan.name} has been banned`);
      setShowBanDialog(false);
      setUserToBan(null);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to ban user');
    } finally {
      setBanLoading(false);
    }
  };

  const openUnbanDialog = (user) => {
    setUserToUnban(user);
    setShowUnbanDialog(true);
  };

  const confirmUnban = async () => {
    if (!userToUnban) return;
    setUnbanLoading(true);
    try {
      await api.post(`/admin/users/${userToUnban.id}/unban`);
      toast.success(`User ${userToUnban.name} has been unbanned`);
      setShowUnbanDialog(false);
      setUserToUnban(null);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error('Failed to unban user');
    } finally {
      setUnbanLoading(false);
    }
  };

  const openRevokeVerificationDialog = (user) => {
    setUserToRevokeVerification(user);
    setRevokeVerificationReason('Identity verification revoked due to policy violation or unverified document update.');
    setRevokeVerificationAdminNotes('');
    setShowRevokeVerificationDialog(true);
  };

  const confirmRevokeVerification = async () => {
    if (!userToRevokeVerification) return;
    setRevokeVerificationLoading(true);
    try {
      await api.post(`/admin/users/${userToRevokeVerification.id}/revoke-verification`, {
        user_visible_reason: revokeVerificationReason.trim() || 'Seller verification revoked by admin',
        admin_notes: revokeVerificationAdminNotes.trim(),
        reason: revokeVerificationReason.trim()
      });
      toast.success(`Verification revoked for ${userToRevokeVerification.name}`);
      setShowRevokeVerificationDialog(false);
      setUserToRevokeVerification(null);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to revoke verification');
    } finally {
      setRevokeVerificationLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user and all their data?')) return;
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (userId) => {
    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/verify`);
      toast.success('User verified');
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error('Failed to verify user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    setActionLoading(selectedUser.id);
    try {
      await api.post(`/admin/users/${selectedUser.id}/role?role=${newRole}`);
      toast.success(`Role changed to ${newRole}`);
      setShowRoleDialog(false);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error('Failed to change role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Select at least one user');
      return;
    }
    
    const confirmMsg = action === 'delete' 
      ? `Are you sure you want to permanently delete ${selectedUsers.length} users?`
      : action === 'ban'
      ? `Are you sure you want to ban ${selectedUsers.length} users?`
      : `Are you sure you want to ${action} ${selectedUsers.length} users?`;
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const response = await api.post('/admin/users/bulk', {
        user_ids: selectedUsers,
        action: action,
        role: action === 'change_role' ? newRole : undefined,
        reason: action === 'ban' ? 'Bulk suspension by administrator' : undefined
      });
      toast.success(`${response.data.success} users updated`);
      setSelectedUsers([]);
      fetchUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    const filteredUsers = getFilteredUsers();
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const getFilteredUsers = () => {
    let result = users;

    if (filter === 'banned') {
      result = result.filter(u => u.is_suspended || u.is_banned);
    } else if (filter === 'active') {
      result = result.filter(u => !u.is_suspended && !u.is_banned);
    } else if (filter === 'verified') {
      result = result.filter(u => u.is_seller_verified);
    } else if (filter === 'pending_kyc') {
      result = result.filter(u => u.verification_status === 'pending');
    } else if (filter === 'admin') {
      result = result.filter(u => u.role === 'admin');
    } else if (filter === 'seller') {
      result = result.filter(u => u.role === 'seller');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q))
      );
    }

    return result;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const filteredUsers = getFilteredUsers();
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * 20, usersPage * 20);

  return (
    <div data-testid="admin-users" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">User Management</h2>
          <p className="text-xs text-muted-foreground">Manage user accounts, ban enforcement, permissions, and verification status</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setUsersPage(1); }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Filter Select */}
          <Select value={filter} onValueChange={(val) => { setFilter(val); setUsersPage(1); }}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users ({users.length})</SelectItem>
              <SelectItem value="active">Active ({users.filter(u => !u.is_suspended && !u.is_banned).length})</SelectItem>
              <SelectItem value="banned">Banned ({users.filter(u => u.is_suspended || u.is_banned).length})</SelectItem>
              <SelectItem value="verified">Verified Sellers ({users.filter(u => u.is_seller_verified).length})</SelectItem>
              <SelectItem value="pending_kyc">Pending KYC ({users.filter(u => u.verification_status === 'pending').length})</SelectItem>
              <SelectItem value="admin">Admins ({users.filter(u => u.role === 'admin').length})</SelectItem>
              <SelectItem value="seller">Sellers ({users.filter(u => u.role === 'seller').length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{selectedUsers.length} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10" onClick={() => handleBulkAction('ban')}>
              <Ban className="w-4 h-4 mr-1" /> Ban Selected
            </Button>
            <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleBulkAction('unban')}>
              <UserCheck className="w-4 h-4 mr-1" /> Unban Selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('verify')}>
              <ShieldCheck className="w-4 h-4 mr-1" /> Verify
            </Button>
            <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="text-left p-4 w-10">
                  <Checkbox
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Joined</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedUsers.map((user) => {
                const isBanned = Boolean(user.is_suspended || user.is_banned);
                return (
                  <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${isBanned ? 'bg-red-500/5' : ''}`}>
                    <td className="p-4">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                        disabled={user.role === 'admin'}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          size="md"
                          className="w-10 h-10 border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                            {user.username && (
                              <span className="text-xs font-mono text-muted-foreground">@{user.username}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email || user.phone || 'No contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={
                          user.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' :
                          user.role === 'seller' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : ''
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {isBanned ? (
                          <>
                            <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 font-bold flex items-center gap-1">
                              <Ban className="w-3 h-3" /> Banned
                            </Badge>
                            {user.ban_reason && (
                              <span className="text-[11px] text-muted-foreground truncate max-w-[160px]" title={user.ban_reason}>
                                {user.ban_reason}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </Badge>
                            {user.is_seller_verified && (
                              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                                Verified Seller
                              </Badge>
                            )}
                            {user.verification_status === 'pending' && (
                              <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                                KYC Pending
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fetchUserDetails(user)}
                          title="View Full Details"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4 text-violet-400" />
                        </Button>
                        
                        {user.role !== 'admin' && (
                          <>
                            {isBanned ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openUnbanDialog(user)}
                                disabled={actionLoading === user.id}
                                title="Unban User"
                                className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openBanDialog(user)}
                                disabled={actionLoading === user.id}
                                title="Ban / Suspend User"
                                className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}

                            {!user.is_seller_verified ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVerify(user.id)}
                                disabled={actionLoading === user.id}
                                title="Verify User"
                                className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openRevokeVerificationDialog(user)}
                                disabled={actionLoading === user.id}
                                title="Revoke Verification"
                                className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              >
                                <ShieldOff className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setShowRoleDialog(true);
                              }}
                              title="Change Role"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading === user.id}
                              title="Delete User"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted-foreground text-sm">
                    No users matching the current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={usersPage}
          totalPages={Math.ceil(filteredUsers.length / 20)}
          totalRecords={filteredUsers.length}
          pageSize={20}
          onPageChange={setUsersPage}
        />
      </div>

      {/* Ban User Confirmation Dialog (User-Visible Reason + Confidential Admin Notes) */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Ban className="w-5 h-5" /> Ban / Suspend User
            </DialogTitle>
            <DialogDescription>
              Suspending this account will immediately revoke access, reject future logins with the ban reason, and block protected features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <Avatar src={userToBan?.avatar} name={userToBan?.name} size="md" className="w-10 h-10 border border-border" />
              <div>
                <p className="font-semibold text-sm">{userToBan?.name}</p>
                <p className="text-xs text-muted-foreground">{userToBan?.email || userToBan?.phone}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ban-user-reason" className="text-xs font-semibold text-red-400">
                User-Facing Ban Reason * (Shown to user when login is rejected)
              </Label>
              <Textarea
                id="ban-user-reason"
                placeholder="Enter suspension reason visible to the user upon login attempt..."
                value={userVisibleBanReason}
                onChange={(e) => setUserVisibleBanReason(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ban-admin-notes" className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Internal Confidential Notes</span>
                <span className="text-[10px] text-amber-400 font-mono">🔒 Admin Only</span>
              </Label>
              <Textarea
                id="ban-admin-notes"
                placeholder="Internal details, evidence links, or moderator observations..."
                value={banAdminNotes}
                onChange={(e) => setBanAdminNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBanDialog(false)} disabled={banLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBan}
              disabled={banLoading || !userVisibleBanReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {banLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke User Verification Dialog */}
      <Dialog open={showRevokeVerificationDialog} onOpenChange={setShowRevokeVerificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <ShieldOff className="w-5 h-5" /> Revoke Seller Verification
            </DialogTitle>
            <DialogDescription>
              Revoking verification will remove verified seller badges and privileges from <strong className="text-foreground">{userToRevokeVerification?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="revoke-reason" className="text-xs font-semibold text-rose-400">
                User-Facing Revocation Reason *
              </Label>
              <Textarea
                id="revoke-reason"
                placeholder="Explain to user why verification was revoked..."
                value={revokeVerificationReason}
                onChange={(e) => setRevokeVerificationReason(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="revoke-admin-notes" className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Internal Confidential Notes</span>
                <span className="text-[10px] text-amber-400 font-mono">🔒 Admin Only</span>
              </Label>
              <Textarea
                id="revoke-admin-notes"
                placeholder="Internal moderation notes regarding this revocation..."
                value={revokeVerificationAdminNotes}
                onChange={(e) => setRevokeVerificationAdminNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRevokeVerificationDialog(false)} disabled={revokeVerificationLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRevokeVerification}
              disabled={revokeVerificationLoading || !revokeVerificationReason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {revokeVerificationLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldOff className="w-4 h-4 mr-2" />}
              Confirm Revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban User Confirmation Dialog */}
      <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <UserCheck className="w-5 h-5" /> Unban & Restore Access
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to lift the suspension for this user? They will be able to log in and use their account normally with all past data preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 my-2">
            <Avatar src={userToUnban?.avatar} name={userToUnban?.name} size="md" className="w-10 h-10 border border-border" />
            <div>
              <p className="font-semibold text-sm">{userToUnban?.name}</p>
              <p className="text-xs text-muted-foreground">{userToUnban?.email || userToUnban?.phone}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowUnbanDialog(false)} disabled={unbanLoading}>
              Cancel
            </Button>
            <Button
              onClick={confirmUnban}
              disabled={unbanLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {unbanLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
              Confirm Unban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User detailed View</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="overview" className="w-full">
            <div className="w-full overflow-x-auto no-scrollbar pb-1">
              <TabsList className="bg-muted p-1 inline-flex w-auto min-w-full sm:min-w-0 flex-nowrap gap-1">
                <TabsTrigger value="overview" className="shrink-0 px-3 py-1.5 text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="listings" className="shrink-0 px-3 py-1.5 text-xs sm:text-sm">Listings ({userListings.length})</TabsTrigger>
                <TabsTrigger value="payments" className="shrink-0 px-3 py-1.5 text-xs sm:text-sm">Payments ({userPayments.length})</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="p-4 space-y-6">
              {/* Ban Banner if Banned */}
              {(userDetail?.is_suspended || userDetail?.is_banned) && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                      <Ban className="w-4 h-4" /> Account Suspended / Banned
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">Reason:</span> {userDetail.ban_reason || 'Policy violation'}
                    </p>
                    {userDetail.banned_at && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Banned on: {new Date(userDetail.banned_at).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shrink-0"
                    onClick={() => {
                      setShowDetailDialog(false);
                      openUnbanDialog(userDetail);
                    }}
                  >
                    <UserCheck className="w-4 h-4 mr-1" /> Unban User
                  </Button>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6">
                <Avatar
                  src={userDetail?.avatar}
                  name={userDetail?.name}
                  size="4xl"
                  className="w-32 h-32 rounded-2xl border border-border text-5xl shrink-0"
                />
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</Label>
                      <p className="font-bold text-lg">{userDetail?.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Username</Label>
                      <p className="font-mono text-violet-500 font-bold">@{userDetail?.username || 'none'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email Address</Label>
                      <p className="text-sm">{userDetail?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</Label>
                      <p className="text-sm font-mono">{userDetail?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
                      <p className="text-sm">{userDetail?.location || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account Status</Label>
                      <div className="flex gap-2 items-center flex-wrap mt-1">
                        <Badge variant={userDetail?.role === 'admin' ? 'default' : 'outline'}>{userDetail?.role}</Badge>
                        {(userDetail?.is_suspended || userDetail?.is_banned) ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                        )}
                        {userDetail?.is_seller_verified && <Badge className="bg-emerald-500">Verified Seller</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="listings" className="p-0">
              <div className="bg-card rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Listing</th>
                      <th className="text-left p-3 font-medium">Price</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userListings.map(listing => (
                      <tr key={listing.id} className="border-t border-border">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded bg-muted overflow-hidden shrink-0">
                               <img src={listing.images?.[0] || ''} alt="" className="w-full h-full object-cover" />
                             </div>
                             <span className="font-medium truncate max-w-[200px]">{listing.title}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono">₹{listing.price}</td>
                        <td className="p-3 uppercase text-[10px] font-bold tracking-tighter">
                          <Badge variant="outline" className="px-1 py-0">{listing.status}</Badge>
                        </td>
                        <td className="p-3">
                           <Link to={`/listing/${listing.id}`} target="_blank">
                             <Button size="icon" variant="ghost" className="w-8 h-8"><ExternalLink className="w-3 h-3" /></Button>
                           </Link>
                        </td>
                      </tr>
                    ))}
                    {userListings.length === 0 && (
                      <tr><td colSpan="4" className="p-8 text-center text-muted-foreground">No listings found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="p-0">
               <div className="bg-card rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Transaction ID</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPayments.map(payment => (
                      <tr key={payment.id} className="border-t border-border font-mono">
                        <td className="p-3">{payment.id.slice(0, 8)}...</td>
                        <td className="p-3 text-emerald-500 font-bold">₹{payment.amount}</td>
                        <td className="p-3 text-[11px]">{formatDate(payment.created_at)}</td>
                        <td className="p-3">
                           <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 h-5 text-[10px]">{payment.status}</Badge>
                        </td>
                      </tr>
                    ))}
                    {userPayments.length === 0 && (
                      <tr><td colSpan="4" className="p-8 text-center text-muted-foreground">No payment records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6 flex justify-between sm:justify-between items-center">
            {userDetail?.role !== 'admin' && !(userDetail?.is_suspended || userDetail?.is_banned) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setShowDetailDialog(false);
                  openBanDialog(userDetail);
                }}
              >
                <Ban className="w-4 h-4 mr-1" /> Ban User
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="ml-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700" 
              onClick={handleChangeRole}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Enhanced Listings Management Component
function ListingsManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedListings, setSelectedListings] = useState([]);
  const [deletingListing, setDeletingListing] = useState(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  const [inspectListing, setInspectListing] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending_payment: 0,
    expired: 0,
    sold: 0,
    deleted: 0,
    archived: 0,
    total_views: 0,
    viewed_listings: 0
  });

  // Sync state if URL query params change (e.g. navigation from Overview cards)
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlSort = searchParams.get('sort');
    if (urlStatus && urlStatus !== filter) {
      setFilter(urlStatus);
      setListingsPage(1);
    }
    if (urlSort && urlSort !== sort) {
      setSort(urlSort);
      setListingsPage(1);
    }
  }, [searchParams]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/admin/listings/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch listing stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (categoryFilter !== 'all') params.append('category_id', categoryFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sort && sort !== 'newest') params.append('sort', sort);
      params.append('page', String(listingsPage));
      params.append('limit', '20');

      const response = await api.get(`/admin/listings?${params.toString()}`);
      const rawData = response.data;

      if (Array.isArray(rawData)) {
        setListings(rawData);
        setTotalListings(rawData.length);
      } else {
        const items = rawData.listings || rawData.items || [];
        setListings(items);
        setTotalListings(rawData.total !== undefined ? rawData.total : items.length);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      toast.error('Failed to load listings data');
      setListings([]);
      setTotalListings(0);
    } finally {
      setLoading(false);
    }
  }, [filter, categoryFilter, searchQuery, sort, listingsPage]);

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, [fetchStats, fetchCategories]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleCardFilterSelect = (newStatus, newSort = 'newest') => {
    setFilter(newStatus);
    setSort(newSort);
    setListingsPage(1);
    const newParams = {};
    if (newStatus !== 'all') newParams.status = newStatus;
    if (newSort !== 'newest') newParams.sort = newSort;
    setSearchParams(newParams);
  };

  const updateListing = async (listingId, data) => {
    try {
      await api.put(`/admin/listings/${listingId}`, data);
      fetchListings();
      fetchStats();
      toast.success('Listing updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update listing');
    }
  };

  const confirmDeleteListing = async () => {
    if (!deletingListing) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/listings/${deletingListing.id}`, {
        data: { reason: deletionReason.trim() || 'Removed by administrator' }
      });
      toast.success('Listing soft-deleted successfully');
      setDeletingListing(null);
      setDeletionReason('');
      fetchListings();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete listing');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedListings.length === 0) {
      toast.error('Select at least one listing');
      return;
    }
    
    try {
      const response = await api.post('/admin/listings/bulk', {
        listing_ids: selectedListings,
        action: action
      });
      toast.success(`${response.data.success || selectedListings.length} listings updated`);
      setSelectedListings([]);
      fetchListings();
      fetchStats();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelectListing = (listingId) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const toggleSelectAllPage = () => {
    if (selectedListings.length === listings.length && listings.length > 0) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings.map(l => l.id));
    }
  };

  const handleOpenInspect = async (listing) => {
    setInspectListing(listing);
    try {
      await api.post(`/admin/listings/${listing.id}/view`);
      fetchStats();
    } catch (err) {
      // Non-blocking view tracking
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    pending_payment: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
    sold: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    expired: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    archived: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    deleted: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  };

  const handleRestoreListing = async (listingId) => {
    try {
      const res = await api.post(`/admin/listings/${listingId}/restore`);
      const restoredStatus = res.data?.listing?.status || 'active';
      toast.success(`Listing restored to "${restoredStatus}" status`);
      fetchListings();
      fetchStats();
    } catch (err) {
      toast.error('Failed to restore listing');
    }
  };

  const handleArchiveListing = async (listingId) => {
    try {
      await api.post(`/admin/listings/${listingId}/archive`);
      toast.success('Listing archived');
      fetchListings();
      fetchStats();
    } catch (err) {
      toast.error('Failed to archive listing');
    }
  };

  const resetAllFilters = () => {
    setFilter('all');
    setSort('newest');
    setCategoryFilter('all');
    setSearchQuery('');
    setListingsPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalListings / 20) || 1;

  return (
    <div data-testid="admin-listings" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Listing Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admin lifecycle control, 90-day validity tracking, soft-delete recovery, and marketplace compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchStats(); fetchListings(); }}
            className="text-xs font-semibold h-9"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Refresh Data
          </Button>
          <Link to="/post">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Post as Admin
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Summary / Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Listings */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => handleCardFilterSelect('all', 'newest')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardFilterSelect('all', 'newest'); }}
          aria-label="Filter to All Listings"
          className={`bg-card border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-sm cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
            filter === 'all' && sort !== 'views_desc' 
              ? 'border-violet-500/60 bg-violet-500/10 ring-1 ring-violet-500/40' 
              : 'border-border hover:border-violet-500/40 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Total Listings</span>
            <div className="w-8 h-8 rounded-lg bg-violet-600/10 text-violet-400 flex items-center justify-center border border-violet-500/20 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black font-mono text-foreground">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stats.total}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">All registered posts</p>
          </div>
        </div>

        {/* Active Listings */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => handleCardFilterSelect('active', 'newest')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardFilterSelect('active', 'newest'); }}
          aria-label="Filter to Active Listings"
          className={`bg-card border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-sm cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
            filter === 'active' && sort !== 'views_desc' 
              ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40' 
              : 'border-border hover:border-emerald-500/40 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-emerald-400 transition-colors">Active</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black font-mono text-emerald-400">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stats.active}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Live on marketplace</p>
          </div>
        </div>

        {/* Read / Viewed Listings (Sorts Most Viewed) */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => handleCardFilterSelect('all', 'views_desc')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardFilterSelect('all', 'views_desc'); }}
          aria-label="Sort by Most Viewed Listings"
          className={`bg-card border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-sm cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
            sort === 'views_desc' 
              ? 'border-cyan-500/60 bg-cyan-500/10 ring-1 ring-cyan-500/40' 
              : 'border-border hover:border-cyan-500/40 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-cyan-400 transition-colors">Viewed (Sort)</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black font-mono text-cyan-400">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stats.viewed_listings}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={`${(stats.total_views || 0).toLocaleString()} Total Views`}>
              {(stats.total_views || 0).toLocaleString()} views recorded
            </p>
          </div>
        </div>

        {/* Expired Listings */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => handleCardFilterSelect('expired', 'newest')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardFilterSelect('expired', 'newest'); }}
          aria-label="Filter to Expired Listings"
          className={`bg-card border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-sm cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
            filter === 'expired' 
              ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/40' 
              : 'border-border hover:border-amber-500/40 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-amber-400 transition-colors">Expired</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black font-mono text-amber-400">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stats.expired}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">&gt;90 days validity</p>
          </div>
        </div>

        {/* Sold Listings */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => handleCardFilterSelect('sold', 'newest')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardFilterSelect('sold', 'newest'); }}
          aria-label="Filter to Sold Listings"
          className={`bg-card border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-sm cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
            filter === 'sold' 
              ? 'border-violet-500/60 bg-violet-500/10 ring-1 ring-violet-500/40' 
              : 'border-border hover:border-violet-500/40 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-violet-400 transition-colors">Sold</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black font-mono text-violet-400">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stats.sold}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completed swaps</p>
          </div>
        </div>

        {/* Soft-Deleted Listings */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => handleCardFilterSelect('deleted', 'newest')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardFilterSelect('deleted', 'newest'); }}
          aria-label="Filter to Soft-Deleted Listings"
          className={`bg-card border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-sm cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
            filter === 'deleted' 
              ? 'border-red-500/60 bg-red-500/10 ring-1 ring-red-500/40' 
              : 'border-border hover:border-red-500/40 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-red-400 transition-colors">Deleted</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 group-hover:scale-105 transition-transform">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black font-mono text-red-400">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stats.deleted}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Soft-deleted / Archival</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, seller, ID, location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setListingsPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setListingsPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <Select 
            value={categoryFilter} 
            onValueChange={(val) => { 
              setCategoryFilter(val); 
              setListingsPage(1); 
            }}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id || cat.slug} value={cat.id || cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select 
            value={filter} 
            onValueChange={(val) => { 
              setFilter(val); 
              setListingsPage(1); 
              setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (val === 'all') next.delete('status');
                else next.set('status', val);
                return next;
              });
            }}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({stats.total || 0})</SelectItem>
              <SelectItem value="active">Active ({stats.active || 0})</SelectItem>
              <SelectItem value="pending_payment">Pending Payment ({stats.pending_payment || 0})</SelectItem>
              <SelectItem value="expired">Expired ({stats.expired || 0})</SelectItem>
              <SelectItem value="sold">Sold ({stats.sold || 0})</SelectItem>
              <SelectItem value="archived">Archived ({stats.archived || 0})</SelectItem>
              <SelectItem value="deleted">Deleted (Soft) ({stats.deleted || 0})</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Selector */}
          <Select
            value={sort}
            onValueChange={(val) => {
              setSort(val);
              setListingsPage(1);
              setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (val === 'newest') next.delete('sort');
                else next.set('sort', val);
                return next;
              });
            }}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="views_desc">Most Viewed</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {(filter !== 'all' || sort !== 'newest' || categoryFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedListings.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Badge className="bg-violet-600 text-white text-xs px-2 py-0.5 font-bold">
              {selectedListings.length} Selected
            </Badge>
            <span className="text-xs text-muted-foreground">Select bulk action:</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs bg-card" onClick={() => handleBulkAction('approve')}>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-card text-red-400" onClick={() => handleBulkAction('reject')}>
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-card" onClick={() => handleBulkAction('feature')}>
              <Star className="w-3.5 h-3.5 mr-1 text-amber-400" /> Feature
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-card text-red-500 hover:bg-red-500/10" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Main Listings Content Area */}
      <div className="space-y-3">
        {/* Loading State Skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((skeletonId) => (
              <div
                key={skeletonId}
                className="bg-card border border-border rounded-xl p-4 animate-pulse flex flex-col sm:flex-row gap-4"
              >
                <div className="w-20 h-20 rounded-lg bg-muted/60 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-muted/70 rounded w-1/3" />
                  <div className="h-5 bg-muted/50 rounded w-1/4" />
                  <div className="h-3 bg-muted/40 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          /* Empty State (Only shown when query returns 0 records) */
          <div className="text-center py-16 px-4 bg-card rounded-2xl border border-border shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No listings found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No listings match your current filters or search query. Try broadening your criteria or reset filters.
            </p>
            {(filter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="mt-4 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          /* Rendered Listing Rows / Cards */
          <div className="space-y-3">
            {listings.map((listing) => {
              const isSoftDeleted = Boolean(listing.is_deleted || listing.status === 'deleted');
              const isSold = listing.status === 'sold';
              const isExpired = Boolean(listing.is_expired || listing.status === 'expired');

              return (
                <div
                  key={listing.id}
                  className={`bg-card border rounded-xl p-4 flex flex-col sm:flex-row gap-4 transition-all hover:border-violet-500/40 shadow-sm ${
                    isSoftDeleted
                      ? 'border-red-500/30 bg-red-500/5'
                      : isSold
                      ? 'border-cyan-500/30 bg-cyan-500/5'
                      : isExpired
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border'
                  }`}
                >
                  {/* Left Selection & Image */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedListings.includes(listing.id)}
                      onCheckedChange={() => toggleSelectListing(listing.id)}
                      className="mt-1"
                    />
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted/80 shrink-0 border border-border">
                      <img
                        src={listing.images?.[0] || 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=300'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=300';
                        }}
                      />
                      {listing.images?.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-[9px] font-mono text-white px-1 py-0.2 rounded">
                          +{listing.images.length - 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header Line */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground text-sm sm:text-base truncate max-w-md">
                            {listing.title}
                          </h3>
                          {listing.created_by_admin && (
                            <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/30 text-[10px] font-semibold">
                              Admin Created (Free)
                            </Badge>
                          )}
                          {listing.featured && (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">
                          ID: <code className="text-zinc-400">{listing.id}</code> &bull; Slug: <span className="text-zinc-400">/{listing.slug}</span>
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {isSoftDeleted ? (
                          <Badge variant="destructive" className="bg-red-600 text-white font-bold text-[10px]">
                            DELETED
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-tight ${statusColors[listing.status] || 'border-border'}`}>
                            {listing.status?.replace('_', ' ')}
                          </Badge>
                        )}

                        {listing.extension_count > 0 && (
                          <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px]">
                            +30d Extended
                          </Badge>
                        )}

                        {listing.free_edit_allowed && !listing.free_edit_used && (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
                            Free Edit Eligible
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price & Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-mono text-base sm:text-lg font-extrabold text-violet-400">
                        {formatPrice(listing.price)}
                      </span>
                      {listing.price_type && (
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                          {listing.price_type}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Condition: <strong className="text-foreground">{listing.condition || 'Used'}</strong>
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-violet-400" />
                        <strong className="text-foreground">{listing.location_district || listing.location || 'Kerala'}</strong>
                      </span>
                    </div>

                    {/* Author & Lifecycle Timestamps */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Seller: <strong className="text-foreground">{listing.seller_name || listing.seller_username || 'Seller'}</strong></span>
                      <span>Category: <strong className="text-foreground">{listing.category_name || 'Gaming'}</strong></span>
                      <span>Published: <strong className="text-foreground">{formatDate(listing.published_at || listing.created_at)}</strong></span>
                      
                      {listing.expires_at && (
                        <span className="flex items-center gap-1">
                          Expires: <strong className={isExpired ? 'text-red-400' : 'text-foreground'}>
                            {formatDate(listing.expires_at)}
                          </strong>
                          {listing.days_remaining !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isExpired 
                                ? 'bg-red-500/20 text-red-300' 
                                : listing.days_remaining <= 7 
                                ? 'bg-amber-500/20 text-amber-300 font-bold' 
                                : 'bg-muted text-zinc-400'
                            }`}>
                              {isExpired ? 'Expired' : `${listing.days_remaining}d left`}
                            </span>
                          )}
                        </span>
                      )}

                      <span className="flex items-center gap-1 font-mono text-cyan-400">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        {(listing.views_count || 0).toLocaleString()} views
                      </span>
                    </div>

                    {/* Soft Delete Audit Trail Details */}
                    {isSoftDeleted && (
                      <div className="text-xs bg-red-500/10 text-red-400 p-2.5 rounded-lg border border-red-500/20 space-y-0.5">
                        <p><strong>Soft-Deleted:</strong> {listing.deleted_at ? new Date(listing.deleted_at).toLocaleString() : 'Archived'} by <strong>{listing.deleted_by || 'admin'}</strong></p>
                        <p><strong>Reason:</strong> {listing.deletion_reason || 'Policy Enforcement'}</p>
                        {listing.previous_status && (
                          <p className="text-muted-foreground"><strong>Previous State:</strong> {listing.previous_status}</p>
                        )}
                      </div>
                    )}

                    {/* Sold Info */}
                    {isSold && !isSoftDeleted && (
                      <div className="text-xs bg-cyan-500/10 text-cyan-400 p-2 rounded-lg border border-cyan-500/20">
                        <p><strong>Completed Transaction:</strong> {listing.sold_at ? new Date(listing.sold_at).toLocaleString() : 'Marked as Sold'}</p>
                      </div>
                    )}

                    {/* Action Buttons Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                      <Link to={`/listing/${listing.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                          <ExternalLink className="w-3.5 h-3.5 mr-1 text-violet-400" /> Public Page
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => handleOpenInspect(listing)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Inspect
                      </Button>

                      {isSoftDeleted || listing.status === 'archived' ? (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          onClick={() => handleRestoreListing(listing.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore Post
                        </Button>
                      ) : null}

                      {listing.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => handleArchiveListing(listing.id)}
                        >
                          Archive
                        </Button>
                      )}

                      {(listing.status === 'pending' || listing.status === 'pending_payment') && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 font-semibold"
                            onClick={() => updateListing(listing.id, { status: 'active' })}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-red-400 hover:bg-red-500/10"
                            onClick={() => updateListing(listing.id, { status: 'rejected' })}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => updateListing(listing.id, { featured: !listing.featured })}
                      >
                        <Star className={`w-3.5 h-3.5 mr-1 ${listing.featured ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                        {listing.featured ? 'Unfeature' : 'Feature'}
                      </Button>

                      {!isSoftDeleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
                          onClick={() => {
                            setDeletingListing(listing);
                            setDeletionReason('');
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Unified Pagination Controls */}
        <PaginationControls
          currentPage={listingsPage}
          totalPages={totalPages}
          totalRecords={totalListings}
          pageSize={20}
          onPageChange={(newPage) => {
            setListingsPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Inspect Listing Dialog */}
      <Dialog open={!!inspectListing} onOpenChange={(open) => !open && setInspectListing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-violet-400" />
                Listing Inspection
              </DialogTitle>
              {inspectListing && (
                <Badge variant="outline" className={`text-xs ${statusColors[inspectListing.status] || ''}`}>
                  {inspectListing.status}
                </Badge>
              )}
            </div>
            <DialogDescription>
              Comprehensive metadata, specifications, seller details, validity timestamps, and audit notes.
            </DialogDescription>
          </DialogHeader>

          {inspectListing && (
            <div className="space-y-4 py-2 text-xs">
              {/* Image Gallery */}
              {inspectListing.images?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {inspectListing.images.map((imgUrl, idx) => (
                    <div key={idx} className="h-24 rounded-lg overflow-hidden bg-muted border border-border">
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Title & Pricing */}
              <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 border border-border">
                <h4 className="text-sm font-bold text-foreground">{inspectListing.title}</h4>
                <p className="text-base font-mono font-black text-violet-400">
                  {formatPrice(inspectListing.price)} <span className="text-xs font-normal text-muted-foreground">({inspectListing.price_type || 'fixed'})</span>
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap">{inspectListing.description}</p>
              </div>

              {/* Key Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-foreground">{inspectListing.category_name || 'N/A'}</span>
                </div>
                <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Condition</span>
                  <span className="font-semibold text-foreground">{inspectListing.condition || 'Used'}</span>
                </div>
                <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Item Type</span>
                  <span className="font-semibold text-foreground uppercase">{inspectListing.item_type || 'physical'}</span>
                </div>
                <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Location</span>
                  <span className="font-semibold text-foreground">{inspectListing.location_district || inspectListing.location || 'Kerala'}</span>
                </div>
                <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Views</span>
                  <span className="font-semibold text-cyan-400 font-mono">{(inspectListing.views_count || 0).toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-muted/20 rounded-lg border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Seller Contact</span>
                  <span className="font-semibold text-foreground font-mono">{inspectListing.contact_phone || 'Hidden'}</span>
                </div>
              </div>

              {/* Specifications List */}
              {inspectListing.specifications?.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-foreground">Hardware Specifications</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {inspectListing.specifications.map((spec, sIdx) => (
                      <div key={sIdx} className="flex justify-between p-2 bg-muted/30 rounded border border-border">
                        <span className="text-muted-foreground">{spec.key}:</span>
                        <span className="font-semibold text-foreground">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validity & Expiry Timestamps */}
              <div className="p-3 bg-violet-500/5 rounded-xl border border-violet-500/20 space-y-1">
                <h5 className="font-bold text-violet-800 dark:text-violet-300">90-Day Validity & Expiry Profile</h5>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Published: <strong className="text-foreground">{formatDate(inspectListing.published_at || inspectListing.created_at)}</strong></div>
                  <div>Expires: <strong className="text-foreground">{formatDate(inspectListing.expires_at)}</strong></div>
                  <div>Extension Count: <strong className="text-foreground">{inspectListing.extension_count || 0} / 1</strong></div>
                  <div>Free Edit Allowed: <strong className="text-foreground">{inspectListing.free_edit_allowed ? 'Yes' : 'No'}</strong></div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center gap-2">
            {inspectListing && (
              <Link to={`/listing/${inspectListing.id}`} target="_blank">
                <Button variant="outline" size="sm" className="text-xs">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Marketplace Page
                </Button>
              </Link>
            )}
            <Button variant="secondary" size="sm" onClick={() => setInspectListing(null)} className="text-xs ml-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Listing Confirmation Dialog */}
      <Dialog open={!!deletingListing} onOpenChange={(open) => !open && setDeletingListing(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Soft-Delete Listing
            </DialogTitle>
            <DialogDescription>
              This listing will be removed from active public search and user dashboards, but complete records, images, payment records, messages, and audit history will be preserved for administration and restoration.
            </DialogDescription>
          </DialogHeader>

          {deletingListing && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs border border-border">
                <p className="font-bold text-foreground truncate">{deletingListing.title}</p>
                <p className="text-muted-foreground">Listing ID: <code className="font-mono text-zinc-300">{deletingListing.id}</code></p>
                <p className="text-muted-foreground">Current Status: <strong className="text-foreground uppercase">{deletingListing.status}</strong></p>
              </div>

              <div>
                <Label htmlFor="del-reason" className="text-xs font-semibold block mb-1.5">
                  Reason for Deletion (Recorded in Audit Log)
                </Label>
                <Input
                  id="del-reason"
                  placeholder="e.g. Policy violation, inappropriate content, counterfeit, scam report"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingListing(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDeleteListing}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Confirm Soft-Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin Chat Viewer & Message Reply Component
function AllChatsManagement() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'flagged'
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesContainerRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  // Deep linking logic
  useEffect(() => {
    const convId = searchParams.get('conversation_id');
    if (convId && conversations.length > 0 && !selectedConv) {
      const convToOpen = conversations.find(c => c.id === convId);
      if (convToOpen) {
        viewConversation(convToOpen);
      }
    }
  }, [searchParams, conversations, selectedConv]);

  // Scroll to bottom of message list on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'flagged' ? '/admin/conversations?has_flagged=true' : '/admin/conversations';
      const response = await api.get(endpoint);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewConversation = async (conv) => {
    setSelectedConv(conv);
    setSearchParams({ conversation_id: conv.id });
    setMessagesLoading(true);
    try {
      const response = await api.get(`/admin/conversations/${conv.id}/messages`);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendAdminReply = async (e) => {
    if (e) e.preventDefault();
    if (!adminReplyText.trim() || !selectedConv) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/admin/conversations/${selectedConv.id}/reply`, {
        text: adminReplyText.trim()
      });
      const newMsg = res.data;
      setMessages(prev => [...prev, newMsg]);
      setAdminReplyText('');
      toast.success('Admin reply sent');

      setConversations(prev => prev.map(c => 
        c.id === selectedConv.id 
          ? { ...c, last_message: newMsg.text, last_message_at: newMsg.created_at, message_count: (c.message_count || 0) + 1 }
          : c
      ));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send admin reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleReviewMessage = async (msgId, status) => {
    setActionLoading(msgId);
    try {
      await api.put(`/admin/flagged-messages/${msgId}/review`, { status });
      toast.success(`Message marked as ${status}`);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status } : m));
    } catch (error) {
      toast.error('Failed to review message');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-all-chats">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">Chat & Support Monitor</h2>
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-[300px]">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">All Chats</TabsTrigger>
            <TabsTrigger value="flagged" className="flex-1 text-xs sm:text-sm text-red-500 data-[state=active]:text-red-600">
              Flagged
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversations List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden h-fit">
          <div className="p-3 border-b border-border bg-muted/50 flex justify-between items-center">
            <p className="font-medium text-sm">Conversations ({conversations.length})</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${selectedConv?.id === conv.id ? 'bg-violet-500/10' : ''}`}
                onClick={() => viewConversation(conv)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {conv.participants_info?.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-1">
                      <Avatar
                        src={p.avatar}
                        name={p.name}
                        size="xs"
                        className="w-6 h-6 border border-border"
                      />
                      <span className="text-sm font-semibold">{p.name}</span>
                      {idx < conv.participants_info.length - 1 && <span className="text-muted-foreground mx-1">↔</span>}
                    </div>
                  ))}
                </div>
                {conv.listing_title && (
                  <p className="text-xs text-muted-foreground mb-1">Re: {conv.listing_title}</p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate flex-1">{conv.last_message || 'No messages'}</p>
                  <div className="flex gap-2 items-center">
                    {conv.has_flagged_messages && (
                       <Badge variant="destructive" className="bg-red-500 text-white rounded-full px-2" title="Contains flagged messages">
                         <AlertTriangle className="w-3 h-3 mr-1" /> Flagged
                       </Badge>
                    )}
                    <Badge variant="outline" className="ml-2">{conv.message_count || 0} msgs</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(conv.last_message_at)}</p>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No conversations found
              </div>
            )}
          </div>
        </div>

        {/* Messages View & Reply Area */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 border-b border-border bg-muted/50 flex justify-between items-center">
            <p className="font-medium text-sm">
              {selectedConv ? `Chat: ${selectedConv.participants_info?.map(p => p.name).join(' & ') || 'Conversation'}` : 'Messages'}
            </p>
            {selectedConv?.listing_title && (
              <Badge variant="outline" className="text-[11px] truncate max-w-[200px]">
                {selectedConv.listing_title}
              </Badge>
            )}
          </div>
          
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : selectedConv ? (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-xl ${msg.is_flagged ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted/50 border border-border/40'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-foreground">{msg.sender_name || 'Participant'}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    {msg.original_text && msg.original_text !== msg.text && (
                      <p className="text-[11px] text-red-500 mt-1">Original: {msg.original_text}</p>
                    )}
                    {msg.attachment_url && (
                      <img src={msg.attachment_url} alt="" className="mt-2 max-w-[200px] rounded-lg border border-border" />
                    )}
                    {msg.is_flagged && (
                      <div className="mt-2.5 pt-2 border-t border-red-500/20 flex items-center justify-between">
                        <Badge variant="outline" className={`text-[10px] ${
                            msg.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            msg.status === 'reviewed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                          Flagged: {msg.status || 'pending'}
                        </Badge>
                        
                        {(!msg.status || msg.status === 'pending') && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-600/20"
                              onClick={() => handleReviewMessage(msg.id, 'reviewed')}
                              disabled={actionLoading === msg.id}
                            >
                              {actionLoading === msg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Reviewed'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleReviewMessage(msg.id, 'dismissed')}
                              disabled={actionLoading === msg.id}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-xs">No messages in this conversation</p>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-violet-500" />
                <p className="text-sm font-semibold">Select a conversation to view and reply</p>
              </div>
            )}
          </div>

          {/* Admin Reply Input Form */}
          {selectedConv && (
            <form onSubmit={handleSendAdminReply} className="p-3 border-t border-border bg-card flex gap-2 items-center">
              <Input
                type="text"
                placeholder="Type an official admin reply..."
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                className="flex-1 text-xs sm:text-sm bg-background"
                disabled={sendingReply}
              />
              <Button
                type="submit"
                size="sm"
                disabled={sendingReply || !adminReplyText.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9 px-3 flex items-center gap-1.5"
              >
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send</span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Reports Management with Listing Removal & Navigation
function ReportsManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedReportForRemoval, setSelectedReportForRemoval] = useState(null);
  const [removalReason, setRemovalReason] = useState('Listing removed due to community violation report');
  const [removing, setRemoving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Admin response modal
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedReportForResponse, setSelectedReportForResponse] = useState(null);
  const [responseAction, setResponseAction] = useState('resolved');
  const [adminResponseText, setAdminResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filter, page]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      params.append('page', page);
      params.append('limit', '20');
      const response = await api.get(`/admin/reports?${params.toString()}`);
      if (Array.isArray(response.data)) {
        setReports(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      } else {
        setReports(response.data.reports || []);
        setTotalCount(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRespondDialog = (report, action = 'resolved') => {
    setSelectedReportForResponse(report);
    setResponseAction(action);
    setAdminResponseText(
      report.admin_response ||
      (action === 'resolved'
        ? 'We investigated this report and took appropriate action to resolve the issue.'
        : action === 'under_review'
        ? 'Our moderation team is currently reviewing the reported details and evidence.'
        : 'After reviewing the reported listing and details, no policy violation was identified.')
    );
    setShowRespondModal(true);
  };

  const handleConfirmResponse = async () => {
    if (!selectedReportForResponse) return;
    setResponding(true);
    try {
      await api.put(`/admin/reports/${selectedReportForResponse.id}/review`, {
        action: responseAction,
        admin_response: adminResponseText
      });
      toast.success(`Report updated to ${responseAction}`);
      setShowRespondModal(false);
      setSelectedReportForResponse(null);
      fetchReports();
    } catch (error) {
      toast.error('Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  const handleQuickReview = async (reportId, action) => {
    setActionLoading(reportId);
    try {
      const defaultResponse =
        action === 'resolved'
          ? 'We reviewed this report and took appropriate moderation action.'
          : 'Report reviewed and dismissed by moderation team.';
      await api.put(`/admin/reports/${reportId}/review`, {
        action: action,
        admin_response: defaultResponse
      });
      toast.success(`Report marked as ${action}`);
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report');
    } finally {
      setActionLoading(null);
    }
  };

  const openRemoveDialog = (report) => {
    setSelectedReportForRemoval(report);
    setRemovalReason(`Listing removed due to report: ${report.reason || 'policy violation'}`);
    setShowRemoveModal(true);
  };

  const handleConfirmRemoveListing = async () => {
    if (!selectedReportForRemoval) return;
    setRemoving(true);
    try {
      await api.post(`/admin/reports/${selectedReportForRemoval.id}/remove-listing`, {
        reason: removalReason
      });
      toast.success('Listing removed and report resolved');
      setShowRemoveModal(false);
      setSelectedReportForRemoval(null);
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove listing');
    } finally {
      setRemoving(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReports.length === 0) {
      toast.error('Select at least one report');
      return;
    }
    
    try {
      await api.post('/admin/reports/bulk', {
        report_ids: selectedReports,
        action: action,
        report_type: 'ad'
      });
      toast.success('Reports updated');
      setSelectedReports([]);
      fetchReports();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-reports">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">Ad Reports</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{selectedReports.length} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('resolve')}>
              <Check className="w-4 h-4 mr-1" /> Resolve All
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('dismiss')}>
              <X className="w-4 h-4 mr-1" /> Dismiss All
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedReports.includes(report.id)}
                onCheckedChange={() => toggleSelectReport(report.id)}
                disabled={report.status !== 'pending' && report.status !== 'under_review'}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">Report #{report.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(report.created_at)} • Reported by <span className="font-semibold text-foreground">{report.reporter_name || 'User'}</span></p>
                  </div>
                  <Badge variant="outline" className={
                    report.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    report.status === 'under_review' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    'bg-gray-500/10 text-gray-500'
                  }>
                    {report.status}
                  </Badge>
                </div>
                
                {report.listing_title && (
                  <p className="text-xs sm:text-sm font-medium text-violet-400 mb-1">
                    Listing: <strong>{report.listing_title}</strong>
                  </p>
                )}

                <p className="text-xs sm:text-sm mb-2"><strong>Reason:</strong> <span className="text-rose-400 font-semibold">{report.reason}</span></p>
                {report.details && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 bg-muted/40 p-2.5 rounded-lg border border-border/50">{report.details}</p>
                )}

                {/* Existing Admin Response display */}
                {report.admin_response && (
                  <div className="mb-3 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-violet-300">Admin Response to User:</p>
                    <p className="text-foreground">"{report.admin_response}"</p>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                  {/* Direct Link to View Listing */}
                  {report.target_type === 'listing' && report.target_id && (
                    <a 
                      href={`/listing/${report.target_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1.5 hover:bg-muted">
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Listing</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Button>
                    </a>
                  )}

                  {/* Direct Action to Remove Listing */}
                  {report.target_type === 'listing' && report.target_id && (report.status === 'pending' || report.status === 'under_review') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5"
                      onClick={() => openRemoveDialog(report)}
                      disabled={removing}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Listing</span>
                    </Button>
                  )}

                  {/* Status & Response Controls */}
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-1"
                    onClick={() => openRespondDialog(report, 'resolved')}
                  >
                    <span>Respond & Resolve</span>
                  </Button>

                  {(report.status === 'pending' || report.status === 'under_review') && (
                    <>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => handleQuickReview(report.id, 'resolved')}
                        disabled={actionLoading === report.id}
                      >
                        {actionLoading === report.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Quick Resolve'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => openRespondDialog(report, 'dismissed')}
                        disabled={actionLoading === report.id}
                      >
                        Dismiss with Note
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Flag className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-40" />
            <p className="text-muted-foreground text-sm font-semibold">No reports found</p>
          </div>
        )}

        {totalCount > 0 && (
          <div className="pt-2">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Admin Response Modal */}
      <Dialog open={showRespondModal} onOpenChange={setShowRespondModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-500" />
              <span>Respond to User Report</span>
            </DialogTitle>
            <DialogDescription>
              Write a user-facing comment explaining the outcome or action taken.
            </DialogDescription>
          </DialogHeader>

          {selectedReportForResponse && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
                <p><strong>Report:</strong> #{selectedReportForResponse.id.slice(0, 8)} • {selectedReportForResponse.reason}</p>
                {selectedReportForResponse.details && (
                  <p className="text-muted-foreground">{selectedReportForResponse.details}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-action-select">Update Status To</Label>
                <Select value={responseAction} onValueChange={setResponseAction}>
                  <SelectTrigger id="admin-action-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resolved">Resolved (Issue addressed)</SelectItem>
                    <SelectItem value="under_review">Under Review (Investigation ongoing)</SelectItem>
                    <SelectItem value="dismissed">Dismissed (No violation found)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-response-input">User-Facing Response Comment *</Label>
                <Textarea
                  id="admin-response-input"
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="Enter response message visible to the reporting user..."
                  rows={3}
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  This note will be visible to the user on their "My Reports" dashboard tab.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRespondModal(false)} disabled={responding}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmResponse}
              disabled={responding || !adminResponseText.trim()}
              className="bg-violet-600 hover:bg-violet-700 font-bold"
            >
              {responding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Destructive Listing Removal */}
      <Dialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Remove Reported Listing?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently unpublish and remove this listing from the marketplace? This will resolve the report and update the listing status to deleted.
            </DialogDescription>
          </DialogHeader>

          {selectedReportForRemoval && (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-muted/50 rounded-lg border border-border text-xs space-y-1">
                <p><strong>Listing:</strong> {selectedReportForRemoval.listing_title || selectedReportForRemoval.target_id}</p>
                <p><strong>Reported Reason:</strong> {selectedReportForRemoval.reason}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="removal-reason" className="text-xs">Moderation Note / Reason</Label>
                <Input
                  id="removal-reason"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  placeholder="Enter reason for removal..."
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRemoveModal(false)} disabled={removing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemoveListing}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 font-bold"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              Confirm Removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Upgraded KYC & Seller Verification Management Component
function KYCManagement() {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog States
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [showReverifyDialog, setShowReverifyDialog] = useState(false);
  const [reverifyReason, setReverifyReason] = useState('');

  // Fetch KYC stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/kyc/stats');
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch KYC stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', page);
      params.append('limit', '20');
      
      const response = await api.get(`/admin/kyc?${params.toString()}`);
      if (Array.isArray(response.data)) {
        setSubmissions(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      } else {
        setSubmissions(response.data.submissions || response.data.items || []);
        setTotalCount(response.data.total || 0);
        setTotalPages(response.data.total_pages || Math.ceil((response.data.total || 0) / 20) || 1);
      }
    } catch (err) {
      console.error('Failed to fetch KYC submissions:', err);
      setError('Unable to load KYC submissions. Please try again.');
      toast.error('Failed to load KYC verification requests');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery, page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  const handleApprove = async (kycId) => {
    setActionLoading(kycId);
    try {
      await api.put(`/admin/kyc/${kycId}/approve`);
      toast.success('Seller verified and KYC approved');
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to approve KYC');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC) return;
    setActionLoading(selectedKYC.id);
    try {
      await api.put(`/admin/kyc/${selectedKYC.id}/reject`, { reason: rejectReason || 'Invalid or unclear documents' });
      toast.success('KYC rejected');
      setShowRejectDialog(false);
      setRejectReason('');
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to reject KYC');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async () => {
    if (!selectedKYC) return;
    setActionLoading(selectedKYC.id);
    try {
      await api.put(`/admin/kyc/${selectedKYC.id}/revoke`, { reason: revokeReason || 'Seller verification revoked by admin' });
      toast.success('Seller verification status revoked');
      setShowRevokeDialog(false);
      setRevokeReason('');
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to revoke verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReverify = async () => {
    if (!selectedKYC) return;
    setActionLoading(selectedKYC.id);
    try {
      await api.put(`/admin/kyc/${selectedKYC.id}/reverify`, { reason: reverifyReason || 'Please upload clear updated documents' });
      toast.success('Re-verification request sent to seller');
      setShowReverifyDialog(false);
      setReverifyReason('');
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to request re-verification');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-semibold"><Check className="w-3 h-3" /> Verified / Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1 font-semibold"><Clock className="w-3 h-3" /> Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30 flex items-center gap-1 font-semibold"><X className="w-3 h-3" /> Rejected</Badge>;
      case 'revoked':
        return <Badge className="bg-rose-600/10 text-rose-400 border-rose-500/30 flex items-center gap-1 font-semibold"><ShieldOff className="w-3 h-3" /> Revoked</Badge>;
      case 'reverification_requested':
        return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 flex items-center gap-1 font-semibold"><RotateCcw className="w-3 h-3" /> Re-verify Requested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div data-testid="admin-kyc" className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Seller Verification & KYC Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Admin-only review, trust verification, and identity compliance management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchSubmissions(); fetchStats(); }} className="h-8 text-xs font-semibold gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Badge variant="outline" className="text-xs font-mono">
            {totalCount} Active Queue Items
          </Badge>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => handleFilterChange('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filter === 'all' ? 'bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30' : 'bg-card border-border hover:border-violet-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Queue</span>
            <ShieldCheck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-foreground mt-1.5">{stats.total || 0}</div>
        </div>

        <div 
          onClick={() => handleFilterChange('pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filter === 'pending' ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30' : 'bg-card border-border hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1.5">{stats.pending || 0}</div>
        </div>

        <div 
          onClick={() => handleFilterChange('approved')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filter === 'approved' ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30' : 'bg-card border-border hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">Verified / Approved</span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1.5">{stats.approved || 0}</div>
        </div>

        <div 
          onClick={() => handleFilterChange('rejected')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filter === 'rejected' ? 'bg-red-500/15 border-red-500/40 ring-1 ring-red-500/30' : 'bg-card border-border hover:border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-400 font-medium">Rejected</span>
            <X className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400 mt-1.5">{stats.rejected || 0}</div>
        </div>

        <div 
          onClick={() => handleFilterChange('revoked')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filter === 'revoked' ? 'bg-rose-500/15 border-rose-500/40 ring-1 ring-rose-500/30' : 'bg-card border-border hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-medium">Revoked</span>
            <ShieldOff className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1.5">{stats.revoked || 0}</div>
        </div>
      </div>

      {/* Compliance & Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>Privacy & Security Compliance:</strong> KYC identity files are strictly restricted to administrators. Document numbers are permanently masked to protect user privacy.
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, doc #, ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-44 text-xs h-9 rounded-xl">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verification Records</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved (Verified)</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>

          {(filter !== 'all' || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Content Area with Loading, Error, Empty & List states */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border">
          <Loader2 className="w-9 h-9 animate-spin text-violet-500 mb-3" />
          <p className="text-sm font-medium text-foreground">Loading verification records...</p>
          <p className="text-xs text-muted-foreground mt-1">Fetching latest KYC documents and status updates</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-6">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
          <h3 className="font-bold text-base text-foreground">Unable to load KYC submissions</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{error}</p>
          <Button size="sm" onClick={fetchSubmissions} className="bg-violet-600 hover:bg-violet-700">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Request
          </Button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-6">
          <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="font-bold text-base text-foreground">No verification submissions</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery || filter !== 'all' 
              ? 'No KYC submissions match your selected filter criteria.' 
              : 'There are no pending seller verification submissions at this time.'}
          </p>
          {(filter !== 'all' || searchQuery) && (
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="mt-4 text-xs font-semibold">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {submissions.map((kyc) => (
            <div key={kyc.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:border-violet-500/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                <div className="flex items-start gap-3">
                  <Avatar name={kyc.user_name || 'User'} className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 font-bold shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base text-foreground">{kyc.user_name || 'Unknown User'}</p>
                      {getStatusBadge(kyc.status)}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{kyc.user_email || 'No email provided'}</p>
                    {kyc.user_id && (
                      <p className="text-[11px] text-muted-foreground/70 font-mono mt-0.5">UID: {kyc.user_id}</p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-muted-foreground font-mono block">
                    Submitted: {formatDate(kyc.created_at)}
                  </span>
                  {kyc.reviewed_at && (
                    <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                      Reviewed: {formatDate(kyc.reviewed_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* Document Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 p-3.5 bg-muted/40 rounded-xl border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Document Type</span>
                  <span className="font-semibold capitalize text-foreground text-xs mt-0.5 block">{kyc.document_type?.replace(/_/g, ' ') || 'ID Document'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Masked ID Number</span>
                  <span className="font-mono font-bold text-foreground text-xs mt-0.5 block">****{kyc.document_number || '****'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Document Attachment</span>
                  {kyc.document_image_url ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewImage(kyc.document_image_url)}
                        className="h-6 px-2 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 text-xs font-semibold gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Document
                      </Button>
                      <a 
                        href={kyc.document_image_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-foreground text-xs"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs italic mt-0.5 block">No document image attached</span>
                  )}
                </div>
              </div>

              {/* Rejection / Revocation Reason */}
              {kyc.rejection_reason && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 mb-3 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <strong>Admin Moderation Note:</strong> {kyc.rejection_reason}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border items-center">
                {kyc.status !== 'approved' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 rounded-lg"
                    onClick={() => handleApprove(kyc.id)}
                    disabled={actionLoading === kyc.id}
                  >
                    {actionLoading === kyc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Approve Verification
                  </Button>
                )}

                {kyc.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300 border-red-500/30 font-semibold text-xs h-8 rounded-lg"
                    onClick={() => {
                      setSelectedKYC(kyc);
                      setShowRejectDialog(true);
                    }}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Reject
                  </Button>
                )}

                {kyc.status === 'approved' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border-rose-500/30 font-semibold text-xs h-8 rounded-lg"
                      onClick={() => {
                        setSelectedKYC(kyc);
                        setShowRevokeDialog(true);
                      }}
                    >
                      <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                      Revoke Verification
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 border-cyan-500/30 font-semibold text-xs h-8 rounded-lg"
                      onClick={() => {
                        setSelectedKYC(kyc);
                        setShowReverifyDialog(true);
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Request Re-verification
                    </Button>
                  </>
                )}

                {(kyc.status === 'rejected' || kyc.status === 'revoked') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 border-cyan-500/30 font-semibold text-xs h-8 rounded-lg"
                    onClick={() => {
                      setSelectedKYC(kyc);
                      setShowReverifyDialog(true);
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Allow Re-submission
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Unified Pagination */}
          <div className="pt-2">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalCount}
              pageSize={20}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Document Inspection Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl rounded-2xl bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileSearch className="w-5 h-5 text-violet-400" />
              Document Full View Inspection
            </DialogTitle>
            <DialogDescription>
              High-resolution administrative inspection for verification compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="p-2 bg-black/40 rounded-xl border border-border flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="KYC Verification Document" 
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            )}
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <a
              href={previewImage || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open full image in new tab
            </a>
            <Button variant="outline" onClick={() => setPreviewImage(null)} className="rounded-xl text-xs">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <X className="w-5 h-5" /> Reject KYC Submission
            </DialogTitle>
            <DialogDescription>
              Provide an explanation for rejecting this user's verification documents.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Document image is blurry, name does not match profile, or expired ID..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 font-bold" 
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-500 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Revoke Seller Verification
            </DialogTitle>
            <DialogDescription>
              This will remove the Verified Seller trust badge from this user's account and all their active listings.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for revoking verification (e.g. Fraudulent behavior, scam report, or terms violation)..."
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>Cancel</Button>
            <Button 
              className="bg-rose-600 hover:bg-rose-700 font-bold" 
              onClick={handleRevoke}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Revoke Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-verify Dialog */}
      <Dialog open={showReverifyDialog} onOpenChange={setShowReverifyDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" /> Request Re-verification
            </DialogTitle>
            <DialogDescription>
              Prompt the seller to re-upload fresh or updated identification documents.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Instructions for seller (e.g. Please upload clear front and back of Aadhaar/Passport)..."
            value={reverifyReason}
            onChange={(e) => setReverifyReason(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReverifyDialog(false)}>Cancel</Button>
            <Button 
              className="bg-cyan-600 hover:bg-cyan-700 font-bold" 
              onClick={handleReverify}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Support Tickets Management Component
function SupportTicketsManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [ticketDecision, setTicketDecision] = useState('NONE');
  const [adminNotes, setAdminNotes] = useState('');
  const [ticketStatus, setTicketStatus] = useState('open');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [actionLoading, setActionLoading] = useState(false);
  const [ticketsPage, setTicketsPage] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterCategory]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const response = await api.get(`/admin/support?${params.toString()}`);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/support/${selectedTicket.id}`, {
        status: ticketStatus,
        priority: ticketPriority,
        decision: ticketDecision !== 'NONE' ? ticketDecision : (ticketStatus === 'resolved' ? 'RESOLVED' : null),
        admin_response: adminResponse.trim() || null,
        admin_notes: adminNotes
      });
      toast.success('Support ticket updated successfully');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update support ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickTicketAction = async (actionType) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/support/${selectedTicket.id}`, {
        action: actionType,
        admin_response: adminResponse.trim() || (
          actionType === 'approve_extension' ? 'Your 30-day listing validity extension request has been approved.' :
          actionType === 'approve_free_edit' ? 'Your 1-time free edit allowance request has been granted. You can now edit your listing details.' :
          'Your request has been reviewed and rejected by the moderation team.'
        ),
        admin_notes: adminNotes.trim()
      });
      toast.success(res.data?.message || 'Ticket action processed successfully');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process action');
    } finally {
      setActionLoading(false);
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status || 'open');
    setTicketPriority(ticket.priority || 'medium');
    setTicketDecision(ticket.decision || (ticket.status === 'resolved' ? 'RESOLVED' : 'NONE'));
    setAdminResponse(ticket.admin_response || '');
    setAdminNotes(ticket.admin_notes || '');
  };

  const filteredTickets = tickets.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticket_number?.toLowerCase().includes(q) ||
      t.user_name?.toLowerCase().includes(q) ||
      t.user_email?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.listing_id?.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent': return <Badge className="bg-red-500 text-white font-bold">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case 'medium': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'open': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Open</Badge>;
      case 'in_progress': return <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">In Progress</Badge>;
      case 'resolved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Resolved</Badge>;
      case 'closed': return <Badge variant="outline" className="text-muted-foreground">Closed</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div data-testid="admin-support-tickets" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Support & Inquiries Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage user requests, validity extensions, free-edit requests, and reports</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportToExcel(tickets, 'ggs_support_tickets')}
            className="text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ticket #, name, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setTicketsPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); setTicketsPage(1); }}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="listing_support">Listing Extension & Edits</SelectItem>
            <SelectItem value="Scam/fraud report">Scam / Fraud</SelectItem>
            <SelectItem value="Fake deal">Fake Deal</SelectItem>
            <SelectItem value="Fake sale">Fake Sale</SelectItem>
            <SelectItem value="Payment issue">Payment Issue</SelectItem>
            <SelectItem value="Listing issue">Listing Issue</SelectItem>
            <SelectItem value="Verification issue">Verification Issue</SelectItem>
            <SelectItem value="Technical issue">Technical Bug</SelectItem>
            <SelectItem value="Other support request">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.slice((ticketsPage - 1) * 20, ticketsPage * 20).map((ticket) => (
          <div key={ticket.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:border-violet-500/40 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-violet-500">{ticket.ticket_number}</span>
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
                <Badge variant="outline" className="text-[11px]">{ticket.category}</Badge>
                {ticket.request_type === 'expiry_extension' && (
                  <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-semibold">
                    30d Extension Request
                  </Badge>
                )}
                {ticket.request_type === 'free_edit' && (
                  <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] font-semibold">
                    Free Edit Request
                  </Badge>
                )}
                {ticket.decision && (
                  <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                    Decision: {ticket.decision}
                  </Badge>
                )}
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {formatDate(ticket.created_at)}
              </span>
            </div>

            <h3 className="font-bold text-base text-foreground mb-1">{ticket.subject}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {ticket.description}
            </p>

            {ticket.admin_response && (
              <div className="my-2 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-violet-300">User-Facing Admin Remark:</p>
                <p className="text-foreground">"{ticket.admin_response}"</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border text-xs text-muted-foreground">
              <div>
                <span>User: </span>
                <strong className="text-foreground">{ticket.user_name}</strong> ({ticket.user_email})
                {ticket.listing_id && (
                  <span className="ml-2">| Ref Listing: <code className="font-mono text-violet-400">{ticket.listing_id}</code></span>
                )}
                {ticket.transaction_id && (
                  <span className="ml-2">| Ref Txn: <code className="font-mono text-cyan-400">{ticket.transaction_id}</code></span>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={() => openTicketModal(ticket)} className="h-8 text-xs font-semibold">
                Manage Ticket
              </Button>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-base text-foreground">No support tickets found</h3>
            <p className="text-xs text-muted-foreground mt-1">There are no tickets matching your filter criteria.</p>
          </div>
        )}

        <PaginationControls
          currentPage={ticketsPage}
          totalPages={Math.ceil(filteredTickets.length / 20) || 1}
          totalRecords={filteredTickets.length}
          pageSize={20}
          onPageChange={setTicketsPage}
        />
      </div>

      {/* Ticket Details & Action Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Ticket {selectedTicket?.ticket_number}</DialogTitle>
              {selectedTicket && getStatusBadge(ticketStatus)}
            </div>
            <DialogDescription>
              Submitted on {formatDate(selectedTicket?.created_at)} by {selectedTicket?.user_name} ({selectedTicket?.user_email})
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-2">
              {/* One-Click Approval Action Banner for Lifecycle Requests */}
              {selectedTicket.request_type === 'expiry_extension' && selectedTicket.status !== 'resolved' && (
                <div className="p-3 bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      30-Day Listing Validity Extension Request
                    </span>
                    <Badge className="bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30 text-[10px] font-semibold">Action Required</Badge>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    User requested 30-day extension for listing <code className="font-mono text-violet-700 dark:text-violet-300">{selectedTicket.listing_id}</code>. Approving adds 30 days to the DB expiry date.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                      disabled={actionLoading}
                      onClick={() => handleQuickTicketAction('approve_extension')}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve +30d Extension
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs h-8"
                      disabled={actionLoading}
                      onClick={() => handleQuickTicketAction('reject_request')}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Reject Extension
                    </Button>
                  </div>
                </div>
              )}

              {selectedTicket.request_type === 'free_edit' && selectedTicket.status !== 'resolved' && (
                <div className="p-3 bg-cyan-500/10 dark:bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                      <Edit className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      One-Time Free Edit Allowance Request
                    </span>
                    <Badge className="bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 text-[10px] font-semibold">Action Required</Badge>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    User requested permission to edit listing <code className="font-mono text-violet-700 dark:text-violet-300">{selectedTicket.listing_id}</code>. Approving unlocks a 1-time free edit.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-8"
                      disabled={actionLoading}
                      onClick={() => handleQuickTicketAction('approve_free_edit')}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Grant One-Time Free Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs h-8"
                      disabled={actionLoading}
                      onClick={() => handleQuickTicketAction('reject_request')}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Reject Request
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Category: </span>
                  <strong className="text-foreground">{selectedTicket.category}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject: </span>
                  <strong className="text-foreground">{selectedTicket.subject}</strong>
                </div>
                {selectedTicket.listing_id && (
                  <div>
                    <span className="text-muted-foreground">Listing ID: </span>
                    <a href={`/listing/${selectedTicket.listing_id}`} target="_blank" rel="noopener noreferrer" className="text-violet-500 font-mono underline">
                      {selectedTicket.listing_id}
                    </a>
                  </div>
                )}
                {selectedTicket.transaction_id && (
                  <div>
                    <span className="text-muted-foreground">Transaction ID: </span>
                    <span className="font-mono text-cyan-400">{selectedTicket.transaction_id}</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">User Description</Label>
                <div className="p-3.5 bg-card border border-border rounded-xl text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedTicket.description}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={ticketStatus} onValueChange={setTicketStatus}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Admin Decision</Label>
                  <Select value={ticketDecision} onValueChange={setTicketDecision}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Decision / Pending</SelectItem>
                      <SelectItem value="RESOLVED">Issue Resolved</SelectItem>
                      <SelectItem value="ACTION_TAKEN">Action Taken</SelectItem>
                      <SelectItem value="INVESTIGATING">Under Investigation</SelectItem>
                      <SelectItem value="NO_ACTION">No Action Required</SelectItem>
                      <SelectItem value="DUPLICATE">Duplicate / Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={ticketPriority} onValueChange={setTicketPriority}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* User-Facing Admin Remark/Response */}
              <div className="space-y-1.5 p-3.5 bg-violet-500/10 border border-violet-500/25 rounded-xl">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-violet-400" />
                    User-Facing Admin Remark / Response
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Visible to user on their dashboard</span>
                </div>
                <Textarea
                  placeholder="e.g. We have investigated the issue and resolved the payment gateway conflict. Please try again..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={2}
                  className="rounded-lg bg-card/80 text-xs"
                />
              </div>

              {/* Internal Moderation Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">Internal Moderation Notes</Label>
                  <span className="text-[10px] text-amber-400 font-mono">🔒 Admin-only (never visible to users)</span>
                </div>
                <Textarea
                  placeholder="Private internal notes on actions taken, debug details, or moderator communications..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700 font-bold" 
              onClick={handleUpdateTicket}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// Payments Management with Search, Filters & PDF Invoicing
function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, searchQuery, page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', page);
      params.append('limit', '20');
      const response = await api.get(`/admin/payments?${params.toString()}`);
      if (Array.isArray(response.data)) {
        setPayments(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      } else {
        setPayments(response.data.payments || []);
        setTotalCount(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadInvoice = async (paymentId) => {
    try {
      setDownloadingId(paymentId);
      const response = await api.get(`/payments/${paymentId}/invoice`);
      const invoice = response.data;
      generateInvoicePdf(invoice);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (payment.id && payment.id.toLowerCase().includes(q)) ||
      (payment.transaction_id && payment.transaction_id.toLowerCase().includes(q)) ||
      (payment.invoice_number && payment.invoice_number.toLowerCase().includes(q)) ||
      (payment.user_name && payment.user_name.toLowerCase().includes(q)) ||
      (payment.user_email && payment.user_email.toLowerCase().includes(q)) ||
      (payment.ad_title && payment.ad_title.toLowerCase().includes(q))
    );
  });

  return (
    <div data-testid="admin-payments" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Payments & Invoicing</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Authoritative listing service fees, tax invoice generation, and revenue records</p>
        </div>
        <ExportButton type="payments" label="Export Payments" />
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoice #, transaction ID, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 rounded-xl text-xs">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Statuses</SelectItem>
            <SelectItem value="completed">Completed (Paid)</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3.5 font-semibold">Invoice / Txn ID</th>
                  <th className="text-left p-3.5 font-semibold">Customer</th>
                  <th className="text-left p-3.5 font-semibold">Listing / Service</th>
                  <th className="text-left p-3.5 font-semibold">Amount (INR)</th>
                  <th className="text-left p-3.5 font-semibold">Status</th>
                  <th className="text-left p-3.5 font-semibold">Date</th>
                  <th className="text-right p-3.5 font-semibold">Receipt / Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-xs text-violet-400">{payment.invoice_number || `GGS-INV-${payment.id.slice(0, 8).toUpperCase()}`}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{payment.transaction_id || payment.id.slice(0, 12)}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-medium text-foreground text-xs">{payment.user_name || 'Customer'}</p>
                      <p className="text-[11px] text-muted-foreground">{payment.user_email || `User: ${payment.user_id.slice(0, 8)}`}</p>
                    </td>

                    <td className="p-3.5 max-w-[200px]">
                      <p className="font-medium text-xs text-foreground truncate">{payment.ad_title || 'Listing Service Fee'}</p>
                      <p className="text-[11px] text-muted-foreground">{payment.payment_method ? payment.payment_method.toUpperCase() : 'UPI / Card'}</p>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-bold text-emerald-500">₹{Number(payment.amount).toFixed(2)}</span>
                      <span className="block text-[10px] text-muted-foreground">(Base ₹{payment.base_amount || '8.47'} + 18% GST)</span>
                    </td>

                    <td className="p-3.5">
                      <Badge variant="outline" className={
                        payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }>
                        {payment.status?.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(payment.created_at)}
                    </td>

                    <td className="p-3.5 text-right">
                      {payment.status === 'completed' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold"
                          onClick={() => downloadInvoice(payment.id)}
                          disabled={downloadingId === payment.id}
                        >
                          {downloadingId === payment.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-violet-500" />
                          ) : (
                            <Receipt className="w-3.5 h-3.5 mr-1 text-violet-500" />
                          )}
                          Invoice PDF
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">N/A (Pending)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredPayments.length === 0 && (
          <div className="text-center py-16">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-base text-foreground">No payments found</h3>
            <p className="text-xs text-muted-foreground mt-1">There are no payment records matching your filter criteria.</p>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="pt-2">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={20}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// Categories Management with Edit Support
function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', image_url: '', icon: '', subcategories: [] });
  const [saveLoading, setSaveLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setIsCreating(false);
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      icon: category.icon || '',
      subcategories: category.subcategories ? [...category.subcategories] : []
    });
  };

  const handleCreateClick = () => {
    setEditingCategory(null);
    setIsCreating(true);
    setEditForm({ 
      name: '', 
      slug: '', 
      description: '', 
      image_url: '', 
      icon: '', 
      subcategories: [] 
    });
  };

  const addSubcategory = () => {
    setEditForm(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, { id: Date.now().toString(), name: '', slug: '' }]
    }));
  };

  const updateSubcategory = (index, field, value) => {
    setEditForm(prev => {
      const newSubcats = [...prev.subcategories];
      newSubcats[index] = { ...newSubcats[index], [field]: value };
      if (field === 'name' && !newSubcats[index].slug) {
        newSubcats[index].slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return { ...prev, subcategories: newSubcats };
    });
  };

  const removeSubcategory = (index) => {
    setEditForm(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'category');
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`;
      setEditForm(prev => ({ ...prev, image_url: imageUrl }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleSave = async () => {
    if (!editForm.name) {
      toast.error('Name is required');
      return;
    }
    setSaveLoading(true);
    try {
      // Auto-generate slug if missing
      const baseSlug = editForm.slug || editForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = {
        name: editForm.name,
        slug: baseSlug,
        description: editForm.description,
        image_url: editForm.image_url,
        icon: editForm.icon,
        subcategories: editForm.subcategories.filter(s => s.name.trim() !== '')
      };

      if (isCreating) {
        await api.post('/admin/categories', payload);
        toast.success('Category created successfully');
      } else {
        await api.put(`/admin/categories/${editingCategory.id}`, {
          ...editingCategory,
          ...payload
        });
        toast.success('Category updated successfully');
      }
      
      setEditingCategory(null);
      setIsCreating(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save category');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Categories</h2>
        <Button onClick={handleCreateClick} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" /> Create Category
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-card border border-border rounded-xl p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3 mb-1">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} className="w-10 h-10 object-cover rounded" />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <h3 className="font-bold">{category.name}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)}>
                <Edit className="w-4 h-4 text-violet-500" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{category.description}</p>
            <p className="text-xs text-muted-foreground">{category.subcategories?.length || 0} subcategories</p>
          </div>
        ))}
      </div>

      <Dialog open={!!editingCategory || isCreating} onOpenChange={(open) => {
        if (!open) { setEditingCategory(null); setIsCreating(false); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Create New Category' : `Edit Category: ${editingCategory?.name}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="flex items-center gap-4">
                {editForm.image_url ? (
                  <img src={editForm.image_url} alt="Category" className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Image
                </Button>
                {editForm.image_url && (
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setEditForm(prev => ({ ...prev, image_url: '' }))}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Lucide Icon Name (optional)</Label>
              <Input
                value={editForm.icon}
                onChange={(e) => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="e.g., FolderOpen, Monitor, MonitorPlay"
              />
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Subcategories</h3>
                  <p className="text-sm text-muted-foreground">Manage nested categories</p>
                </div>
                <Button variant="outline" size="sm" onClick={addSubcategory}>
                  <Plus className="w-4 h-4 mr-1" /> Add Subcategory
                </Button>
              </div>
              
              <div className="space-y-3">
                {editForm.subcategories.map((subcat, index) => (
                  <div key={index} className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg border border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          placeholder="Subcategory Name"
                          value={subcat.name}
                          onChange={(e) => updateSubcategory(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">URL Slug</Label>
                        <Input
                          placeholder="subcategory-slug"
                          value={subcat.slug}
                          onChange={(e) => updateSubcategory(index, 'slug', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mt-5 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => removeSubcategory(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {editForm.subcategories.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                    No subcategories added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingCategory(null); setIsCreating(false); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveLoading} className="bg-violet-600 hover:bg-violet-700">
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Ensure Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Pages Management with Create & Edit Support
function PagesManagement() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ slug: '', title: '', content: '' });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await api.get('/pages');
      setPages(response.data);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (page) => {
    setEditingPage(page);
    setIsCreating(false);
    setEditForm({
      slug: page.slug,
      title: page.title,
      content: page.content || ''
    });
  };

  const handleCreateClick = () => {
    setEditingPage(null);
    setIsCreating(true);
    setEditForm({ slug: '', title: '', content: '' });
  };

  const handleSave = async () => {
    if (!editForm.slug || !editForm.title || !editForm.content) {
      toast.error('All fields are required');
      return;
    }
    setSaveLoading(true);
    try {
      if (isCreating) {
        await api.post('/admin/pages', editForm);
        toast.success('Page created successfully');
      } else {
        await api.put(`/admin/pages/${editingPage.id}`, editForm);
        toast.success('Page updated successfully');
      }
      setEditingPage(null);
      setIsCreating(false);
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save page');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (pageId) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await api.delete(`/admin/pages/${pageId}`);
      toast.success('Page deleted successfully');
      fetchPages();
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Static Pages</h2>
        <Button onClick={handleCreateClick} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" /> Create Page
        </Button>
      </div>
      <div className="space-y-3">
        {pages.map((page) => (
          <div key={page.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">{page.title}</h3>
              <p className="text-sm text-muted-foreground">/{page.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/page/${page.slug}`} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => handleEditClick(page)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDelete(page.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {pages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-xl">
            No static pages yet. Create one!
          </div>
        )}
      </div>

      <Dialog open={!!editingPage || isCreating} onOpenChange={(open) => {
        if (!open) { setEditingPage(null); setIsCreating(false); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Create New Page' : `Edit Page: ${editingPage?.title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => {
                  const title = e.target.value;
                  if (isCreating) {
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    setEditForm(prev => ({ ...prev, title, slug }));
                  } else {
                    setEditForm(prev => ({ ...prev, title }));
                  }
                }}
                placeholder="e.g., About Us, Privacy Policy"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL path)</Label>
              <Input
                value={editForm.slug}
                onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., about, privacy"
              />
            </div>
            <div className="space-y-2">
              <Label>Content (Markdown or HTML)</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">You can use Markdown or HTML tags to format your content.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingPage(null); setIsCreating(false); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveLoading} className="bg-violet-600 hover:bg-violet-700">
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Moderation & Filter Management Component
function ModerationManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'dictionary' ? 'dictionary' : 'records');
  
  // Records Filters
  const initialStatus = searchParams.get('status') || (searchParams.get('type') === 'auto-blocked' ? 'pending' : 'all');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [recordsPage, setRecordsPage] = useState(1);

  // Dictionary Management State
  const [terms, setTerms] = useState([]);
  const [termsSummary, setTermsSummary] = useState(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termSearch, setTermSearch] = useState('');
  const [termLanguage, setTermLanguage] = useState('all');
  const [termCategory, setTermCategory] = useState('all');
  const [termSeverity, setTermSeverity] = useState('all');
  const [termStatus, setTermStatus] = useState('all');
  const [termsPage, setTermsPage] = useState(1);
  
  // Modals for Dictionary CRUD
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [termForm, setTermForm] = useState({
    term: '',
    language: 'english',
    category: 'profanity',
    severity: 'HIGH',
    enabled: true,
    variants: '',
    transliterations: ''
  });
  const [importJsonText, setImportJsonText] = useState('');
  const [savingTerm, setSavingTerm] = useState(false);

  // Sync state if URL query params change
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlType = searchParams.get('type');
    const urlTab = searchParams.get('tab');

    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
      setRecordsPage(1);
    } else if (urlType === 'auto-blocked' && statusFilter !== 'pending') {
      setStatusFilter('pending');
      setRecordsPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchModerationRecords();
  }, [statusFilter, severityFilter, typeFilter]);

  useEffect(() => {
    if (activeTab === 'dictionary') {
      fetchDictionaryTerms();
    }
  }, [activeTab, termSearch, termLanguage, termCategory, termSeverity, termStatus]);

  const fetchModerationRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (typeFilter !== 'all') params.append('content_type', typeFilter);

      const [recordsRes, statsRes] = await Promise.all([
        api.get(`/admin/moderation/records?${params.toString()}`),
        api.get('/admin/moderation/stats')
      ]);

      setRecords(recordsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch moderation data:', error);
      toast.error('Failed to load moderation records');
    } finally {
      setLoading(false);
    }
  };

  const fetchDictionaryTerms = async () => {
    setTermsLoading(true);
    try {
      const params = new URLSearchParams();
      if (termSearch) params.append('search', termSearch);
      if (termLanguage !== 'all') params.append('language', termLanguage);
      if (termCategory !== 'all') params.append('category', termCategory);
      if (termSeverity !== 'all') params.append('severity', termSeverity);
      if (termStatus !== 'all') params.append('enabled', termStatus === 'enabled');

      const res = await api.get(`/admin/moderation/terms?${params.toString()}`);
      setTerms(res.data.terms || []);
      setTermsSummary(res.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch dictionary terms:', error);
      toast.error('Failed to load moderation terms');
    } finally {
      setTermsLoading(false);
    }
  };

  const handleReviewAction = async (recordId, action) => {
    setActionLoading(recordId);
    try {
      await api.put(`/admin/moderation/records/${recordId}/review`, {
        action,
        admin_notes: adminNotes
      });
      toast.success(`Moderation record marked as ${action}`);
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord(null);
      }
      fetchModerationRecords();
    } catch (error) {
      toast.error('Failed to update moderation record');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTerm = async () => {
    if (!termForm.term || !termForm.term.trim()) {
      toast.error('Term word is required');
      return;
    }
    setSavingTerm(true);
    try {
      await api.post('/admin/moderation/terms', {
        term: termForm.term.trim().toLowerCase(),
        language: termForm.language,
        category: termForm.category,
        severity: termForm.severity,
        enabled: termForm.enabled,
        variants: termForm.variants ? termForm.variants.split(',').map(v => v.trim()).filter(Boolean) : [],
        transliterations: termForm.transliterations ? termForm.transliterations.split(',').map(t => t.trim()).filter(Boolean) : []
      });
      toast.success('Moderation term added successfully');
      setShowAddModal(false);
      setTermForm({
        term: '',
        language: 'english',
        category: 'profanity',
        severity: 'HIGH',
        enabled: true,
        variants: '',
        transliterations: ''
      });
      fetchDictionaryTerms();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add moderation term');
    } finally {
      setSavingTerm(false);
    }
  };

  const handleUpdateTerm = async () => {
    if (!editingTerm) return;
    setSavingTerm(true);
    try {
      await api.put(`/admin/moderation/terms/${editingTerm.id}`, {
        term: termForm.term.trim().toLowerCase(),
        language: termForm.language,
        category: termForm.category,
        severity: termForm.severity,
        enabled: termForm.enabled,
        variants: termForm.variants ? termForm.variants.split(',').map(v => v.trim()).filter(Boolean) : [],
        transliterations: termForm.transliterations ? termForm.transliterations.split(',').map(t => t.trim()).filter(Boolean) : []
      });
      toast.success('Moderation term updated');
      setShowEditModal(false);
      setEditingTerm(null);
      fetchDictionaryTerms();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update term');
    } finally {
      setSavingTerm(false);
    }
  };

  const handleToggleTerm = async (termId) => {
    try {
      const res = await api.patch(`/admin/moderation/terms/${termId}/toggle`);
      toast.success(`Term ${res.data.term?.enabled ? 'enabled' : 'disabled'}`);
      setTerms(prev => prev.map(t => t.id === termId ? { ...t, enabled: res.data.term?.enabled } : t));
    } catch (error) {
      toast.error('Failed to toggle term');
    }
  };

  const handleDeleteTerm = async (termId, termName) => {
    if (!window.confirm(`Are you sure you want to delete term "${termName}"?`)) return;
    try {
      await api.delete(`/admin/moderation/terms/${termId}`);
      toast.success(`Deleted term "${termName}"`);
      setTerms(prev => prev.filter(t => t.id !== termId));
    } catch (error) {
      toast.error('Failed to delete term');
    }
  };

  const handleImportTerms = async () => {
    if (!importJsonText || !importJsonText.trim()) {
      toast.error('JSON content is required');
      return;
    }
    setSavingTerm(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(importJsonText);
      } catch (pErr) {
        throw new Error('Invalid JSON format. Please provide an array of term objects.');
      }
      if (!Array.isArray(parsed)) {
        throw new Error('Import data must be a JSON array of term objects.');
      }
      const res = await api.post('/admin/moderation/terms/import', { terms: parsed });
      toast.success(`Imported ${res.data.count} moderation terms`);
      setShowImportModal(false);
      setImportJsonText('');
      fetchDictionaryTerms();
    } catch (error) {
      toast.error(error.message || error.response?.data?.detail || 'Import failed');
    } finally {
      setSavingTerm(false);
    }
  };

  const handleExportTerms = async () => {
    try {
      const res = await api.get('/admin/moderation/terms/export');
      exportToExcel(res.data, 'moderation_terms_export');
      toast.success('Terms exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">MEDIUM</Badge>;
      case 'LOW':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">LOW</Badge>;
      default:
        return <Badge variant="outline">{severity || 'UNKNOWN'}</Badge>;
    }
  };

  const getStatusBadge = (status, actionTaken) => {
    if (status === 'pending') {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
          {actionTaken === 'AUTO_BLOCKED' ? 'Auto-Blocked (Pending)' : 'Pending Review'}
        </Badge>
      );
    }
    if (status === 'approved') {
      return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Approved / Safe</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-500/15 text-red-500 border-red-500/30">Violation Confirmed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.original_text && r.original_text.toLowerCase().includes(q)) ||
      (r.user_name && r.user_name.toLowerCase().includes(q)) ||
      (r.user_email && r.user_email.toLowerCase().includes(q)) ||
      (r.content_type && r.content_type.toLowerCase().includes(q)) ||
      (r.matched_terms && r.matched_terms.some(m => m.term && m.term.toLowerCase().includes(q)))
    );
  });

  const paginatedRecords = filteredRecords.slice((recordsPage - 1) * 20, recordsPage * 20);
  const totalRecordsPages = Math.ceil(filteredRecords.length / 20) || 1;

  const paginatedTerms = terms.slice((termsPage - 1) * 20, termsPage * 20);
  const totalTermsPages = Math.ceil(terms.length / 20) || 1;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden" data-testid="admin-moderation">
      {/* Stats Header with Interactive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Auto-Blocked Items"
          value={stats?.auto_blocked || 0}
          subtitle={`${stats?.pending || 0} pending admin review`}
          icon={Ban}
          color="bg-red-500"
          onClick={() => {
            setActiveTab('records');
            setStatusFilter('pending');
            setRecordsPage(1);
            setSearchParams({ status: 'pending' });
          }}
          isActive={activeTab === 'records' && statusFilter === 'pending'}
          ariaLabel="Filter to Auto-Blocked Items pending review"
        />
        <StatsCard
          title="Total Mod Events"
          value={stats?.total || 0}
          subtitle={`${stats?.approved || 0} approved, ${stats?.rejected || 0} confirmed`}
          icon={ShieldAlert}
          color="bg-violet-600"
          onClick={() => {
            setActiveTab('records');
            setStatusFilter('all');
            setSeverityFilter('all');
            setTypeFilter('all');
            setRecordsPage(1);
            setSearchParams({ status: 'all' });
          }}
          isActive={activeTab === 'records' && statusFilter === 'all'}
          ariaLabel="Show all moderation records"
        />
        <StatsCard
          title="Active Dictionary Terms"
          value={termsSummary?.total || stats?.total_seed_terms || 154}
          subtitle="English, Malayalam & Manglish"
          icon={FileText}
          color="bg-cyan-500"
          onClick={() => {
            setActiveTab('dictionary');
            setTermStatus('all');
            setTermsPage(1);
            setSearchParams({ tab: 'dictionary' });
          }}
          isActive={activeTab === 'dictionary'}
          ariaLabel="View Active Multilingual Dictionary Terms"
        />
        <StatsCard
          title="Dismissed / False Positives"
          value={stats?.dismissed || 0}
          subtitle="Reviewed and approved as safe"
          icon={Check}
          color="bg-emerald-500"
          onClick={() => {
            setActiveTab('records');
            setStatusFilter('approved');
            setRecordsPage(1);
            setSearchParams({ status: 'approved' });
          }}
          isActive={activeTab === 'records' && statusFilter === 'approved'}
          ariaLabel="Filter to Dismissed and False Positive records"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'records' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('records')}
            className={activeTab === 'records' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Flagged & Blocked Records ({filteredRecords.length})
          </Button>
          <Button
            variant={activeTab === 'dictionary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('dictionary')}
            className={activeTab === 'dictionary' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Multilingual Seed Dictionary ({termsSummary?.total || terms.length})
          </Button>
        </div>

        {activeTab === 'dictionary' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportTerms}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV/JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> Import JSON
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setTermForm({
                  term: '',
                  language: 'english',
                  category: 'profanity',
                  severity: 'HIGH',
                  enabled: true,
                  variants: '',
                  transliterations: ''
                });
                setShowAddModal(true);
              }}
              className="bg-violet-600 hover:bg-violet-700 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add New Term
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'records' ? (
        <div className="space-y-4">
          {/* Controls and Filters */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search text, user, term..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Violation</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32 text-xs">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue placeholder="Field Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="full_name">Full Name</SelectItem>
                  <SelectItem value="post_title">Post Title</SelectItem>
                  <SelectItem value="post_description">Post Description</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="search">Search Query</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500/60" />
                <p className="font-bold text-lg text-foreground">No Moderation Flags Found</p>
                <p className="text-sm mt-1">All user submitted content is currently clear of prohibited language.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="p-4">Type & Severity</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Original Submitted Text</th>
                      <th className="p-4">Matched Terms</th>
                      <th className="p-4">Status & Action</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="space-y-1.5">
                            <Badge variant="outline" className="font-mono text-[10px] uppercase">
                              {rec.content_type?.replace('_', ' ')}
                            </Badge>
                            <div>{getSeverityBadge(rec.severity)}</div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-foreground">{rec.user_name || 'Anonymous User'}</div>
                          <div className="text-xs text-muted-foreground">{rec.user_email || 'N/A'}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{formatDate(rec.created_at)}</div>
                        </td>

                        <td className="p-4 max-w-xs">
                          <div className="bg-muted/40 p-2 rounded-lg border border-border/50 text-xs font-mono break-words">
                            <p className="line-clamp-2 text-foreground">{rec.original_text}</p>
                          </div>
                          {rec.filtered_text && rec.filtered_text !== rec.original_text && (
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">
                              Masked: <span className="text-violet-400">{rec.filtered_text}</span>
                            </p>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {rec.matched_terms?.map((m, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                                {m.term} <span className="opacity-70 text-[9px]">({m.category || m.language})</span>
                              </Badge>
                            ))}
                          </div>
                          {rec.language && (
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                              Lang: {rec.language} ({Math.round((rec.confidence || 0.9) * 100)}% conf)
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {getStatusBadge(rec.status, rec.action_taken)}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(rec);
                                setAdminNotes(rec.admin_notes || '');
                              }}
                              className="text-xs h-8"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                            </Button>
                            {rec.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReviewAction(rec.id, 'approved')}
                                  disabled={actionLoading === rec.id}
                                  className="h-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                  title="Approve / False Positive"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReviewAction(rec.id, 'rejected')}
                                  disabled={actionLoading === rec.id}
                                  className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  title="Confirm Violation"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredRecords.length > 0 && (
              <div className="p-4 border-t border-border">
                <PaginationControls
                  currentPage={recordsPage}
                  totalPages={totalRecordsPages}
                  totalItems={filteredRecords.length}
                  itemsPerPage={20}
                  onPageChange={setRecordsPage}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Dictionary View */
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search terms, variants..."
                value={termSearch}
                onChange={(e) => {
                  setTermSearch(e.target.value);
                  setTermsPage(1);
                }}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={termLanguage} onValueChange={(val) => { setTermLanguage(val); setTermsPage(1); }}>
                <SelectTrigger className="w-44 text-xs">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="english">English ({termsSummary?.english || 0})</SelectItem>
                  <SelectItem value="malayalam">Malayalam ({termsSummary?.malayalam || 0})</SelectItem>
                  <SelectItem value="malayalam_transliteration">Manglish ({termsSummary?.malayalam_transliteration || 0})</SelectItem>
                  <SelectItem value="obfuscated">Obfuscated ({termsSummary?.obfuscated || 0})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={termCategory} onValueChange={(val) => { setTermCategory(val); setTermsPage(1); }}>
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="profanity">Profanity</SelectItem>
                  <SelectItem value="scam">Scam / Fraud</SelectItem>
                  <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  <SelectItem value="prohibited_items">Prohibited</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={termSeverity} onValueChange={(val) => { setTermSeverity(val); setTermsPage(1); }}>
                <SelectTrigger className="w-28 text-xs">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={termStatus} onValueChange={(val) => { setTermStatus(val); setTermsPage(1); }}>
                <SelectTrigger className="w-28 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={() => {
                  setEditingTerm(null);
                  setTermForm({
                    term: '',
                    language: 'english',
                    category: 'profanity',
                    severity: 'HIGH',
                    enabled: true,
                    variants: '',
                    transliterations: ''
                  });
                  setShowAddModal(true);
                }}
                className="bg-violet-600 hover:bg-violet-700 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Term
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {termsLoading ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : terms.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="font-bold text-lg text-foreground">No Moderation Terms Found</p>
                <p className="text-sm mt-1">Try adjusting your filters or click "Add New Term" to register one.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="p-4">Term & Language</th>
                      <th className="p-4">Category & Severity</th>
                      <th className="p-4">Variants / Aliases</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedTerms.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold font-mono text-foreground text-sm">{t.term}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Language: <span className="capitalize">{t.language?.replace('_', ' ')}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[11px] capitalize">
                              {t.category?.replace('_', ' ')}
                            </Badge>
                            <div>{getSeverityBadge(t.severity)}</div>
                          </div>
                        </td>

                        <td className="p-4 max-w-xs">
                          {t.variants && t.variants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {t.variants.map((v, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None (uses phonetics)</span>
                          )}
                        </td>

                        <td className="p-4">
                          <Button
                            size="sm"
                            variant={t.enabled ? 'outline' : 'secondary'}
                            onClick={() => handleToggleTerm(t.id)}
                            className={`text-xs h-7 px-2.5 font-bold ${
                              t.enabled
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {t.enabled ? 'Active' : 'Disabled'}
                          </Button>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTerm(t);
                                setTermForm({
                                  term: t.term,
                                  language: t.language,
                                  category: t.category,
                                  severity: t.severity,
                                  enabled: t.enabled,
                                  variants: (t.variants || []).join(', '),
                                  transliterations: (t.transliterations || []).join(', ')
                                });
                                setShowEditModal(true);
                              }}
                              className="h-8 text-xs"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTerm(t.id, t.term)}
                              className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {terms.length > 0 && (
              <div className="p-4 border-t border-border">
                <PaginationControls
                  currentPage={termsPage}
                  totalPages={totalTermsPages}
                  totalItems={terms.length}
                  itemsPerPage={20}
                  onPageChange={setTermsPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Term Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Add Moderation Term</DialogTitle>
            <DialogDescription>
              Register a prohibited or sensitive keyword with immediate zero-deployment filter activation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <Label>Keyword / Term (Lowercased)</Label>
              <Input
                value={termForm.term}
                onChange={(e) => setTermForm(prev => ({ ...prev, term: e.target.value }))}
                placeholder="e.g. inappropriate_word"
                className="mt-1 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Language Group</Label>
                <Select value={termForm.language} onValueChange={(val) => setTermForm(prev => ({ ...prev, language: val }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="malayalam">Malayalam Script</SelectItem>
                    <SelectItem value="malayalam_transliteration">Manglish / Translit</SelectItem>
                    <SelectItem value="obfuscated">Obfuscated / Leet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={termForm.category} onValueChange={(val) => setTermForm(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profanity">Profanity</SelectItem>
                    <SelectItem value="slur">Slur</SelectItem>
                    <SelectItem value="sexual">Sexual</SelectItem>
                    <SelectItem value="insult">Insult</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Severity Level</Label>
              <Select value={termForm.severity} onValueChange={(val) => setTermForm(prev => ({ ...prev, severity: val }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical (Strict Auto-Block)</SelectItem>
                  <SelectItem value="HIGH">High (Auto-Block & Flag)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (Mask / Filter)</SelectItem>
                  <SelectItem value="LOW">Low (Log only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Variants / Obfuscated spellings (comma separated)</Label>
              <Input
                value={termForm.variants}
                onChange={(e) => setTermForm(prev => ({ ...prev, variants: e.target.value }))}
                placeholder="e.g. f*ck, fvk, f_u_c_k"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleCreateTerm} disabled={savingTerm} className="bg-violet-600 hover:bg-violet-700">
              {savingTerm ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Term Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Edit Moderation Term</DialogTitle>
            <DialogDescription>
              Update keyword configuration and live filter severity rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <Label>Keyword / Term</Label>
              <Input
                value={termForm.term}
                onChange={(e) => setTermForm(prev => ({ ...prev, term: e.target.value }))}
                className="mt-1 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Language Group</Label>
                <Select value={termForm.language} onValueChange={(val) => setTermForm(prev => ({ ...prev, language: val }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="malayalam">Malayalam Script</SelectItem>
                    <SelectItem value="malayalam_transliteration">Manglish / Translit</SelectItem>
                    <SelectItem value="obfuscated">Obfuscated / Leet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={termForm.category} onValueChange={(val) => setTermForm(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profanity">Profanity</SelectItem>
                    <SelectItem value="slur">Slur</SelectItem>
                    <SelectItem value="sexual">Sexual</SelectItem>
                    <SelectItem value="insult">Insult</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Severity Level</Label>
              <Select value={termForm.severity} onValueChange={(val) => setTermForm(prev => ({ ...prev, severity: val }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical (Strict Auto-Block)</SelectItem>
                  <SelectItem value="HIGH">High (Auto-Block & Flag)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (Mask / Filter)</SelectItem>
                  <SelectItem value="LOW">Low (Log only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Variants (comma separated)</Label>
              <Input
                value={termForm.variants}
                onChange={(e) => setTermForm(prev => ({ ...prev, variants: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdateTerm} disabled={savingTerm} className="bg-violet-600 hover:bg-violet-700">
              {savingTerm ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Update Term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Terms Dialog */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Import Moderation Terms</DialogTitle>
            <DialogDescription>
              Paste a JSON array containing term objects (term, language, category, severity, variants).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={'[\n  {\n    "term": "badword",\n    "language": "english",\n    "category": "profanity",\n    "severity": "HIGH"\n  }\n]'}
              rows={10}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button onClick={handleImportTerms} disabled={savingTerm} className="bg-violet-600 hover:bg-violet-700">
              {savingTerm ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Import & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspect Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => { if (!open) setSelectedRecord(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-violet-500" />
              Moderation Inspection: {selectedRecord?.content_type?.replace('_', ' ').toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Logged on {formatDate(selectedRecord?.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-muted/40 p-3 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground block">Severity Level</span>
                  <div className="mt-1">{getSeverityBadge(selectedRecord.severity)}</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground block">Action Status</span>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status, selectedRecord.action_taken)}</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground block">Language & Conf.</span>
                  <span className="font-semibold text-xs mt-1 block">
                    {selectedRecord.language} ({Math.round((selectedRecord.confidence || 0.9) * 100)}%)
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase text-muted-foreground">Original Submitted Text</Label>
                <div className="bg-muted/60 p-3.5 rounded-lg border border-border text-sm font-mono break-all mt-1">
                  {selectedRecord.original_text}
                </div>
              </div>

              {selectedRecord.normalized_text && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Normalized Detection Representation</Label>
                  <div className="bg-muted/30 p-2.5 rounded-lg border border-border text-xs font-mono break-all mt-1 text-muted-foreground">
                    {selectedRecord.normalized_text}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs uppercase text-muted-foreground">Detected Prohibited Terms</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {selectedRecord.matched_terms?.map((m, idx) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-md px-2.5 py-1 text-xs">
                      <span className="font-bold text-red-400">{m.term}</span>
                      <span className="text-muted-foreground ml-1.5 text-[11px]">[{m.category} / {m.severity}]</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase text-muted-foreground">Internal Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add administrative notes regarding this violation or false positive..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSelectedRecord(null)}>Close</Button>
            <Button
              variant="outline"
              onClick={() => handleReviewAction(selectedRecord.id, 'dismissed')}
              className="text-muted-foreground"
            >
              Dismiss
            </Button>
            <Button
              onClick={() => handleReviewAction(selectedRecord.id, 'approved')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 mr-1.5" /> Approve / False Positive
            </Button>
            <Button
              onClick={() => handleReviewAction(selectedRecord.id, 'rejected')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Ban className="w-4 h-4 mr-1.5" /> Confirm Violation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Upgraded Audit Logs Component
function AuditLogsManagement() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, listingAudits: 0, userAudits: 0, modAudits: 0, reportAudits: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Inspection Modal States
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Fetch Audit Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/audit-logs/stats');
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (entityFilter !== 'all') params.append('entity_type', entityFilter);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', page);
      params.append('limit', '20');

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      const fetchedLogs = res.data.logs || res.data.items || [];
      const totalCount = res.data.total || 0;
      setLogs(fetchedLogs);
      setTotal(totalCount);
      setTotalPages(res.data.total_pages || Math.ceil(totalCount / 20) || 1);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Unable to load administrative audit logs. Please try again.');
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [entityFilter, actionFilter, searchQuery, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleEntityChange = (val) => {
    setEntityFilter(val);
    setPage(1);
  };

  const handleActionChange = (val) => {
    setActionFilter(val);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setEntityFilter('all');
    setActionFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  const copyLogToClipboard = (log) => {
    try {
      const jsonStr = JSON.stringify(log, null, 2);
      navigator.clipboard.writeText(jsonStr);
      setCopiedJson(true);
      toast.success('Audit record JSON copied to clipboard');
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      toast.error('Failed to copy JSON');
    }
  };

  const getActionBadge = (action = '') => {
    const act = String(action).toUpperCase();
    if (act.includes('DELETED') || act.includes('SUSPENDED') || act.includes('BANNED') || act.includes('REJECTED')) {
      return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 font-semibold">{action}</Badge>;
    }
    if (act.includes('RESTORED') || act.includes('APPROVED') || act.includes('VERIFIED')) {
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">{action}</Badge>;
    }
    if (act.includes('CREATED') || act.includes('ADDED')) {
      return <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 font-semibold">{action}</Badge>;
    }
    if (act.includes('SOLD') || act.includes('UPGRADED') || act.includes('EXTENDED')) {
      return <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 font-semibold">{action}</Badge>;
    }
    if (act.includes('EDITED') || act.includes('UPDATED')) {
      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold">{action}</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  const formatJson = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return val;
      }
    }
    return JSON.stringify(val, null, 2);
  };

  return (
    <div className="space-y-6 w-full max-w-full" data-testid="admin-audit-logs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Platform Audit History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Immutable administrative history of all listing modifications, user suspensions, sales, trust reviews, and platform alterations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchLogs(); fetchStats(); }} className="h-8 text-xs font-semibold gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Badge variant="outline" className="text-xs font-mono">
            {total} Total Records
          </Badge>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => { handleEntityChange('all'); handleActionChange('all'); }}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            entityFilter === 'all' && actionFilter === 'all' ? 'bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30' : 'bg-card border-border hover:border-violet-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Audits</span>
            <History className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-foreground mt-1.5">{stats.total || total}</div>
        </div>

        <div 
          onClick={() => handleEntityChange('listing')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            entityFilter === 'listing' ? 'bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-500/30' : 'bg-card border-border hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-400 font-medium">Listings Audits</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1.5">{stats.listingAudits || 0}</div>
        </div>

        <div 
          onClick={() => handleEntityChange('user')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            entityFilter === 'user' ? 'bg-cyan-500/15 border-cyan-500/40 ring-1 ring-cyan-500/30' : 'bg-card border-border hover:border-cyan-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-400 font-medium">User Changes</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 mt-1.5">{stats.userAudits || 0}</div>
        </div>

        <div 
          onClick={() => handleEntityChange('moderation_term')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            entityFilter === 'moderation_term' ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30' : 'bg-card border-border hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Policy Rules</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1.5">{stats.modAudits || 0}</div>
        </div>

        <div 
          onClick={() => handleEntityChange('report')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            entityFilter === 'report' ? 'bg-rose-500/15 border-rose-500/40 ring-1 ring-rose-500/30' : 'bg-card border-border hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-medium">Report Actions</span>
            <Flag className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1.5">{stats.reportAudits || 0}</div>
        </div>
      </div>

      {/* Controls & Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search action, actor, entity ID, reason..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={entityFilter} onValueChange={handleEntityChange}>
            <SelectTrigger className="w-40 text-xs h-9 rounded-xl">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="listing">Listings</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="moderation_term">Moderation Terms</SelectItem>
              <SelectItem value="conversation">Conversations</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="kyc">KYC / Verification</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={handleActionChange}>
            <SelectTrigger className="w-48 text-xs h-9 rounded-xl">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="POST_CREATED">POST_CREATED</SelectItem>
              <SelectItem value="POST_EDITED">POST_EDITED</SelectItem>
              <SelectItem value="POST_DELETED">POST_DELETED</SelectItem>
              <SelectItem value="POST_RESTORED">POST_RESTORED</SelectItem>
              <SelectItem value="POST_ARCHIVED">POST_ARCHIVED</SelectItem>
              <SelectItem value="LISTING_SOLD">LISTING_SOLD</SelectItem>
              <SelectItem value="USER_SUSPENDED">USER_SUSPENDED</SelectItem>
              <SelectItem value="USER_UNSUSPENDED">USER_UNSUSPENDED</SelectItem>
              <SelectItem value="KYC_APPROVED">KYC_APPROVED</SelectItem>
              <SelectItem value="KYC_REJECTED">KYC_REJECTED</SelectItem>
              <SelectItem value="KYC_REVOKED">KYC_REVOKED</SelectItem>
              <SelectItem value="MODERATION_TERM_ADDED">MODERATION_TERM_ADDED</SelectItem>
              <SelectItem value="MODERATION_TERM_UPDATED">MODERATION_TERM_UPDATED</SelectItem>
              <SelectItem value="MODERATION_TERM_DELETED">MODERATION_TERM_DELETED</SelectItem>
            </SelectContent>
          </Select>

          {(entityFilter !== 'all' || actionFilter !== 'all' || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Logs Table / Content Area */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <Loader2 className="w-9 h-9 animate-spin text-violet-500 mb-3" />
            <p className="text-sm font-medium text-foreground">Loading audit records...</p>
            <p className="text-xs text-muted-foreground mt-1">Retrieving immutable administrative log trail</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="font-bold text-lg text-foreground">Unable to Load Audit Logs</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{error}</p>
            <Button size="sm" onClick={fetchLogs} className="bg-violet-600 hover:bg-violet-700">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Request
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-bold text-base text-foreground">No Audit Records Found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery || entityFilter !== 'all' || actionFilter !== 'all'
                ? 'No records match your selected filter criteria.'
                : 'Actions performed on listings, accounts, and moderation terms will be recorded here.'}
            </p>
            {(entityFilter !== 'all' || actionFilter !== 'all' || searchQuery) && (
              <Button size="sm" variant="outline" onClick={handleResetFilters} className="mt-4 text-xs font-semibold">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3.5 bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
              <div className="col-span-2">Date & Time</div>
              <div className="col-span-2">Actor / Initiator</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-2">Entity Target</div>
              <div className="col-span-3">Reason / Details</div>
              <div className="col-span-1 text-right">Inspect</div>
            </div>

            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="p-4 sm:px-5 sm:py-4 hover:bg-muted/20 transition-colors">
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-3 items-start">
                    {/* Timestamp */}
                    <div className="col-span-2 text-xs">
                      <span className="font-semibold text-foreground block">
                        {new Date(log.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Actor */}
                    <div className="col-span-2 text-xs">
                      <div className="font-semibold text-foreground truncate" title={log.admin_email || log.user_email || 'System'}>
                        {log.admin_email || log.user_email || 'System / Platform'}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {log.admin_id ? `Admin #${log.admin_id.slice(-6)}` : (log.user_id ? `User #${log.user_id.slice(-6)}` : 'Automated')}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-2">
                      {getActionBadge(log.action)}
                    </div>

                    {/* Entity */}
                    <div className="col-span-2 text-xs">
                      <span className="font-semibold capitalize text-foreground block">{log.entity_type}</span>
                      <span className="font-mono text-[11px] text-muted-foreground/80 block mt-0.5 truncate" title={log.entity_id}>
                        ID: {log.entity_id ? log.entity_id.slice(-10) : 'N/A'}
                      </span>
                    </div>

                    {/* Reason / Details with Multi-line Formatting */}
                    <div className="col-span-3 text-xs pr-2">
                      <p className="text-foreground font-medium leading-relaxed break-words">
                        {log.reason || 'Administrative action performed.'}
                      </p>

                      {log.new_state && (
                        <div className="mt-2 p-2 rounded-lg bg-black/40 border border-border/60 font-mono text-[11px] text-violet-300 overflow-x-auto max-h-32">
                          <span className="text-muted-foreground text-[10px] block font-sans font-semibold mb-0.5">State Change:</span>
                          <pre className="whitespace-pre-wrap font-mono leading-tight">{formatJson(log.new_state)}</pre>
                        </div>
                      )}
                    </div>

                    {/* Inspect Button */}
                    <div className="col-span-1 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 px-2.5 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 text-xs font-semibold gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Button>
                    </div>
                  </div>

                  {/* Mobile & Tablet Card Layout */}
                  <div className="md:hidden space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-bold text-foreground capitalize">
                          {log.entity_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                        {new Date(log.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Actor:</span> {log.admin_email || log.user_email || 'System'}
                      {log.entity_id && <span className="ml-2 font-mono text-[11px]">({log.entity_id.slice(-8)})</span>}
                    </div>

                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {log.reason || 'Administrative action recorded.'}
                    </p>

                    {log.new_state && (
                      <div className="p-2 rounded-lg bg-black/40 border border-border/60 font-mono text-[11px] text-violet-300 overflow-x-auto max-h-24">
                        <pre className="whitespace-pre-wrap font-mono leading-tight">{formatJson(log.new_state)}</pre>
                      </div>
                    )}

                    <div className="pt-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 text-xs font-semibold text-violet-400 border-violet-500/30 gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Full Record
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="pt-2">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalRecords={total}
            pageSize={20}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Full Audit Record Inspection Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl rounded-2xl bg-card border border-border">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <FileSearch className="w-5 h-5 text-violet-400" />
                Audit Record Details
              </DialogTitle>
              {selectedLog && getActionBadge(selectedLog.action)}
            </div>
            <DialogDescription>
              Complete cryptographic audit trail information and full modification diff payload.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Record Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Audit Record ID</span>
                  <span className="font-mono font-bold text-foreground text-xs mt-0.5 block truncate" title={selectedLog.id}>
                    {selectedLog.id}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Timestamp</span>
                  <span className="font-semibold text-foreground text-xs mt-0.5 block">
                    {new Date(selectedLog.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Actor Identity</span>
                  <span className="font-semibold text-foreground text-xs mt-0.5 block truncate" title={selectedLog.admin_email || selectedLog.user_email || 'System'}>
                    {selectedLog.admin_email || selectedLog.user_email || 'System'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Entity Type</span>
                  <span className="font-semibold capitalize text-foreground text-xs mt-0.5 block">
                    {selectedLog.entity_type}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Entity ID</span>
                  <span className="font-mono text-foreground text-xs mt-0.5 block truncate" title={selectedLog.entity_id}>
                    {selectedLog.entity_id || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Actor Role/ID</span>
                  <span className="font-mono text-foreground text-xs mt-0.5 block truncate">
                    {selectedLog.admin_id ? `Admin: ${selectedLog.admin_id}` : (selectedLog.user_id ? `User: ${selectedLog.user_id}` : 'Platform')}
                  </span>
                </div>
              </div>

              {/* Reason / Admin Memo */}
              <div className="p-3.5 bg-card border border-border rounded-xl">
                <span className="text-xs text-muted-foreground font-semibold block mb-1">Action Reason / Memo:</span>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {selectedLog.reason || 'Standard administrative operation performed.'}
                </p>
              </div>

              {/* State Diff / JSON Payloads */}
              {selectedLog.previous_state && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> Previous State (Before Change):
                  </span>
                  <div className="p-3 rounded-xl bg-black/60 border border-border font-mono text-xs text-amber-300/90 max-h-48 overflow-auto">
                    <pre className="whitespace-pre-wrap font-mono leading-relaxed">{formatJson(selectedLog.previous_state)}</pre>
                  </div>
                </div>
              )}

              {selectedLog.new_state && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> New / Applied State:
                  </span>
                  <div className="p-3 rounded-xl bg-black/60 border border-border font-mono text-xs text-violet-300 max-h-56 overflow-auto">
                    <pre className="whitespace-pre-wrap font-mono leading-relaxed">{formatJson(selectedLog.new_state)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-border">
            {selectedLog && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyLogToClipboard(selectedLog)}
                className="text-xs font-semibold gap-1.5"
              >
                {copiedJson ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Copied Record!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Complete JSON
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedLog(null)} className="rounded-xl text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Blog Management Component
function BlogManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    category: 'Announcements',
    cover_image: '',
    tags: '',
    content: '',
    author_name: '',
    status: 'published',
    seo_title: '',
    seo_description: ''
  });

  const categories = [
    'Announcements',
    'Seller Guides',
    'Buyer Guides',
    'Safety Guides',
    'Scam Awareness',
    'Technical Guides',
    'Console Guides',
    'PC Building',
    'Community'
  ];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blog/posts?limit=100');
      setPosts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: !selectedPost ? generateSlug(val) : prev.slug,
      seo_title: !selectedPost || !prev.seo_title ? val : prev.seo_title
    }));
  };

  const handleOpenCreate = () => {
    setSelectedPost(null);
    setActiveTab('edit');
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      category: 'Announcements',
      cover_image: '',
      tags: '',
      content: '',
      author_name: 'GGS Editorial Team',
      status: 'published',
      seo_title: '',
      seo_description: ''
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (post) => {
    setSelectedPost(post);
    setActiveTab('edit');
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      category: post.category || 'Announcements',
      cover_image: post.cover_image || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      content: post.content || '',
      author_name: post.author_name || 'GGS Editorial Team',
      status: post.status || 'published',
      seo_title: post.seo_title || post.title || '',
      seo_description: post.seo_description || post.excerpt || ''
    });
    setIsEditOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
  };

  const handleOpenDelete = (post) => {
    setSelectedPost(post);
    setIsDeleteOpen(true);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      toast.error('Please fill in title, slug, and content');
      return;
    }
    setSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await api.post('/admin/blog/posts', {
        ...formData,
        tags: tagsArray
      });
      toast.success('Blog post created & saved successfully');
      handleCloseDialog();
      fetchPosts();
    } catch (error) {
      console.error('Create blog post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create blog post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      toast.error('Please fill in title, slug, and content');
      return;
    }
    setSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await api.put(`/admin/blog/posts/${selectedPost.id || selectedPost.slug}`, {
        ...formData,
        tags: tagsArray
      });
      toast.success('Blog post changes saved successfully');
      handleCloseDialog();
      fetchPosts();
    } catch (error) {
      console.error('Update blog post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update blog post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/blog/posts/${selectedPost.id || selectedPost.slug}`);
      toast.success('Blog post deleted successfully');
      setIsDeleteOpen(false);
      fetchPosts();
    } catch (error) {
      console.error('Delete blog post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete blog post');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      !searchQuery.trim() ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || post.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (post.status || 'published') === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden" data-testid="admin-blog-management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold">Blog & Article Management</h2>
          <p className="text-xs text-muted-foreground">
            Create, edit, manage, and publish guides, announcements, and fraud prevention articles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Blog Post
          </Button>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts by title, slug, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-bold text-lg text-foreground">No Blog Posts Found</p>
            <p className="text-sm mt-1">Create your first blog post using the button above.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-4">Post / Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Views</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPosts.map((post) => (
                  <tr key={post.id || post.slug} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {post.cover_image && (
                          <img
                            src={post.cover_image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0 border border-border"
                          />
                        )}
                        <div className="min-w-0 max-w-sm">
                          <p className="font-bold text-foreground text-xs sm:text-sm line-clamp-1">{post.title}</p>
                          <p className="font-mono text-[11px] text-muted-foreground truncate">/blog/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                        {post.category}
                      </Badge>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {(post.status || 'published') === 'published' ? (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Published
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs text-muted-foreground">
                      {post.author_name || 'GGS Team'}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs font-mono text-muted-foreground">
                      {post.views_count || 0}
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(post.updated_at || post.created_at || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={post.category === 'Scam Awareness' || post.tags?.includes('Safety') ? `/blog/safety/${post.slug}` : `/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="View Public Post">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(post)}
                          className="h-8 w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                          title="Edit Blog Post"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(post)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle>{isCreateOpen ? 'Create New Blog Post' : `Edit: ${selectedPost?.title || 'Blog Post'}`}</DialogTitle>
                <DialogDescription>
                  {isCreateOpen ? 'Publish a new announcement, buying guide, or safety article.' : 'Update blog content, SEO tags, category, and metadata.'}
                </DialogDescription>
              </div>
              <div className="flex bg-muted rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${activeTab === 'edit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Edit Form
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${activeTab === 'preview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Live Preview
                </button>
              </div>
            </div>
          </DialogHeader>

          {activeTab === 'edit' ? (
            <form onSubmit={isCreateOpen ? handleCreatePost : handleUpdatePost} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Post Title *</Label>
                <Input
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. How to Check a Used GPU Before Buying"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">URL Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g. how-to-check-used-gpu"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Publish Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft (Hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Author Name</Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                    placeholder="e.g. GGS Safety & Hardware Team"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="GPU, Hardware, Safety, Tips"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cover Image URL</Label>
                <Input
                  value={formData.cover_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Short Excerpt / Summary</Label>
                <Input
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A brief 1-2 sentence preview for search and cards..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Content (Markdown Supported) *</Label>
                  <span className="text-[10px] text-muted-foreground">Supports # Headings, lists, bold, and code</span>
                </div>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="# Article Title&#10;&#10;Write your article here..."
                  rows={12}
                  className="font-mono text-xs"
                  required
                />
              </div>

              {/* SEO Section */}
              <div className="pt-2 border-t border-border/60">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Search Engine Optimization (SEO)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SEO Meta Title</Label>
                    <Input
                      value={formData.seo_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="Custom page title for Google & SEO"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">SEO Meta Description</Label>
                    <Input
                      value={formData.seo_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                      placeholder="Meta description for search snippets"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {isCreateOpen ? 'Publish Post' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="py-4 space-y-6">
              <div className="p-4 bg-muted/40 border border-border rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs">{formData.category}</Badge>
                  <span className="text-xs text-muted-foreground">• By {formData.author_name || 'GGS Team'}</span>
                  <span className="text-xs text-muted-foreground">• {formData.status}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{formData.title || 'Untitled Article'}</h2>
                {formData.excerpt && <p className="text-sm text-muted-foreground italic mb-4">{formData.excerpt}</p>}
                {formData.cover_image && (
                  <img
                    src={formData.cover_image}
                    alt=""
                    className="w-full max-h-60 object-cover rounded-lg mb-4 border border-border"
                  />
                )}
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {formData.content || 'No content written yet.'}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveTab('edit')}>
                  Back to Editor
                </Button>
                <Button
                  onClick={isCreateOpen ? handleCreatePost : handleUpdatePost}
                  disabled={submitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {isCreateOpen ? 'Publish Post' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{selectedPost?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main Admin Dashboard
export default function AdminDashboard() {
  const location = useLocation();
  const currentPath = location.pathname.split('/admin')[1] || '';
  const [badgeCounts, setBadgeCounts] = useState({
    moderation: 0,
    support_tickets: 0,
    reports: 0,
    kyc: 0,
    listings: 0,
    users: 0
  });

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const response = await api.get('/admin/badge-counts');
      setBadgeCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch badge counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [fetchBadgeCounts, location.pathname]);

  const navItems = [
    { path: '', label: 'Overview', icon: LayoutDashboard },
    { path: '/moderation', label: 'Moderation & Filter', icon: ShieldAlert, badgeKey: 'moderation' },
    { path: '/audit-logs', label: 'Audit History', icon: RotateCcw },
    { path: '/users', label: 'Users', icon: Users, badgeKey: 'users' },
    { path: '/listings', label: 'Listings', icon: Package, badgeKey: 'listings' },
    { path: '/kyc', label: 'KYC & Verification', icon: ShieldCheck, badgeKey: 'kyc' },
    { path: '/support-tickets', label: 'Support Tickets', icon: HelpCircle, badgeKey: 'support_tickets' },
    { path: '/reports', label: 'Ad Reports', icon: Flag, badgeKey: 'reports' },
    { path: '/all-chats', label: 'All Chats', icon: MessageCircle },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/categories', label: 'Categories', icon: FolderOpen },
    { path: '/pages', label: 'Pages & Policies', icon: FileText },
    { path: '/blog', label: 'Blog & Articles', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen py-8" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">Admin Control Center</h1>
              <p className="text-xs text-muted-foreground">Manage moderation, audit history, users, verification, listings, support, blog, and payments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/marketplace">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                View Marketplace
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-2 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-visible">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                const count = item.badgeKey ? (badgeCounts[item.badgeKey] || 0) : 0;
                return (
                  <Link
                    key={item.path}
                    to={`/admin${item.path}`}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                      isActive
                        ? 'bg-violet-600 text-white font-bold'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`nav-${item.path.replace('/', '') || 'overview'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium text-sm truncate">{item.label}</span>
                    </div>
                    {count > 0 && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white text-violet-700 shadow-sm'
                            : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        }`}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="moderation" element={<ModerationManagement />} />
              <Route path="audit-logs" element={<AuditLogsManagement />} />
              <Route path="users" element={<UsersManagement onUserUpdated={fetchBadgeCounts} />} />
              <Route path="listings" element={<ListingsManagement />} />
              <Route path="kyc" element={<KYCManagement />} />
              <Route path="support-tickets" element={<SupportTicketsManagement />} />
              <Route path="reports" element={<ReportsManagement />} />
              <Route path="all-chats" element={<AllChatsManagement />} />
              <Route path="payments" element={<PaymentsManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="pages" element={<PagesManagement />} />
              <Route path="blog" element={<BlogManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}


