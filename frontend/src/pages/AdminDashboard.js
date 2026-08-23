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
  Send
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

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Overview Component
function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <h2 className="text-xl font-bold mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats?.total_users || 0}
            subtitle={`${stats?.banned_users || 0} banned, ${stats?.verified_users || 0} verified`}
            icon={Users}
            color="bg-violet-600"
          />
          <StatsCard
            title="Total Listings"
            value={stats?.total_listings || 0}
            subtitle={`${stats?.active_listings || 0} active`}
            icon={Package}
            color="bg-cyan-500"
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${stats?.total_revenue || 0}`}
            subtitle={`${stats?.total_payments || 0} payments`}
            icon={CreditCard}
            color="bg-emerald-500"
          />
          <StatsCard
            title="Pending Actions"
            value={(stats?.pending_reports || 0) + (stats?.pending_chat_reports || 0) + (stats?.pending_kyc || 0)}
            subtitle={`${stats?.pending_kyc || 0} KYC, ${stats?.pending_reports || 0} reports`}
            icon={AlertTriangle}
            color="bg-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-bold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Listings</span>
              <span className="font-mono font-bold">{stats?.pending_listings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending KYC</span>
              <span className="font-mono font-bold">{stats?.pending_kyc || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Reports</span>
              <span className="font-mono font-bold">{stats?.pending_reports || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chat Reports</span>
              <span className="font-mono font-bold">{stats?.pending_chat_reports || 0}</span>
            </div>
          </div>
        </div>
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
function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [filter, setFilter] = useState('all');

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

  const handleBan = async (userId) => {
    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/ban`);
      toast.success('User banned');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to ban user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (userId) => {
    setActionLoading(userId);
    try {
      await api.post(`/admin/users/${userId}/unban`);
      toast.success('User unbanned');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unban user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user and all their data?')) return;
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
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
      : `Are you sure you want to ${action} ${selectedUsers.length} users?`;
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const response = await api.post('/admin/users/bulk', {
        user_ids: selectedUsers,
        action: action,
        role: action === 'change_role' ? newRole : undefined
      });
      toast.success(`${response.data.success} users updated`);
      setSelectedUsers([]);
      fetchUsers();
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
    if (filter === 'all') return users;
    if (filter === 'banned') return users.filter(u => u.is_suspended);
    if (filter === 'verified') return users.filter(u => u.is_seller_verified);
    if (filter === 'admin') return users.filter(u => u.role === 'admin');
    if (filter === 'seller') return users.filter(u => u.role === 'seller');
    return users;
  };

  const formatDate = (dateString) => {
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

  return (
    <div data-testid="admin-users">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="seller">Sellers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{selectedUsers.length} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('ban')}>
              <Ban className="w-4 h-4 mr-1" /> Ban
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('unban')}>
              <UserCheck className="w-4 h-4 mr-1" /> Unban
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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 w-10">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Joined</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border">
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
                        className="w-10 h-10 border border-border"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email || user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge 
                      variant="outline" 
                      className={
                        user.role === 'admin' ? 'bg-violet-500/10 text-violet-500' :
                        user.role === 'seller' ? 'bg-cyan-500/10 text-cyan-500' : ''
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {user.is_seller_verified && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500">Verified</Badge>
                      )}
                      {user.is_suspended && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500">Banned</Badge>
                      )}
                      {!user.is_seller_verified && !user.is_suspended && (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fetchUserDetails(user)}
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4 text-violet-500" />
                      </Button>
                      
                      {user.role !== 'admin' && (
                        <>
                          {!user.is_seller_verified && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerify(user.id)}
                              disabled={actionLoading === user.id}
                              title="Verify User"
                            >
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </Button>
                          )}
                          {user.is_suspended ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnban(user.id)}
                              disabled={actionLoading === user.id}
                              title="Unban User"
                            >
                              <UserCheck className="w-4 h-4 text-emerald-500" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleBan(user.id)}
                              disabled={actionLoading === user.id}
                              title="Ban User"
                            >
                              <Ban className="w-4 h-4 text-amber-500" />
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
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(user.id)}
                            disabled={actionLoading === user.id}
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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
      </div>

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
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar
                  src={userDetail?.avatar}
                  name={userDetail?.name}
                  size="4xl"
                  className="w-32 h-32 rounded-2xl border border-border text-5xl"
                />
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</Label>
                      <p className="font-bold text-lg">{userDetail?.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Username</Label>
                      <p className="font-mono text-violet-500 font-bold">@{userDetail?.username}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email Address</Label>
                      <p>{userDetail?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</Label>
                      <p>{userDetail?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
                      <p>{userDetail?.location || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account Status</Label>
                      <div className="flex gap-2 items-center">
                        <Badge variant={userDetail?.role === 'admin' ? 'default' : 'outline'}>{userDetail?.role}</Badge>
                        {userDetail?.is_suspended && <Badge variant="destructive">Suspended</Badge>}
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
                             <div className="w-8 h-8 rounded bg-muted overflow-hidden">
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
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
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
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedListings, setSelectedListings] = useState([]);
  const [deletingListing, setDeletingListing] = useState(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/admin/listings${params}`);
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateListing = async (listingId, data) => {
    try {
      await api.put(`/admin/listings/${listingId}`, data);
      fetchListings();
      toast.success('Listing updated');
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
      toast.success(`${response.data.success} listings updated`);
      setSelectedListings([]);
      fetchListings();
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    pending_payment: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    sold: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    archived: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    deleted: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  const handleRestoreListing = async (listingId) => {
    try {
      const res = await api.post(`/admin/listings/${listingId}/restore`);
      const restoredStatus = res.data?.listing?.status || 'active';
      toast.success(`Listing restored to "${restoredStatus}" status`);
      fetchListings();
    } catch (err) {
      toast.error('Failed to restore listing');
    }
  };

  const handleArchiveListing = async (listingId) => {
    try {
      await api.post(`/admin/listings/${listingId}/archive`);
      toast.success('Listing archived');
      fetchListings();
    } catch (err) {
      toast.error('Failed to archive listing');
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
    <div data-testid="admin-listings">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">Listing Management</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="deleted">Deleted (Soft-Deleted)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedListings.length > 0 && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{selectedListings.length} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')}>
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('feature')}>
              <Star className="w-4 h-4 mr-1" /> Feature
            </Button>
            <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className={`bg-card border rounded-xl p-4 flex flex-col sm:flex-row gap-4 ${
              listing.is_deleted ? 'border-red-500/30 bg-red-500/5' : (listing.status === 'sold' ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-border')
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedListings.includes(listing.id)}
                onCheckedChange={() => toggleSelectListing(listing.id)}
              />
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={listing.images?.[0] || 'https://images.unsplash.com/photo-1617507171089-6cb9aa5add36?w=200'}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h3 className="font-bold truncate text-base">{listing.title}</h3>
                  {listing.created_by_admin && (
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[11px] font-semibold">
                      Admin Created (Free)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {listing.is_deleted && (
                    <Badge variant="destructive" className="bg-red-500 text-white">DELETED</Badge>
                  )}
                  <Badge variant="outline" className={statusColors[listing.status]}>
                    {listing.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <p className="font-mono text-lg font-bold text-violet-500 mb-1">
                {formatPrice(listing.price)}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Author: <span className="font-medium text-foreground">{listing.seller_name || 'Seller'}</span> • {listing.category_name}
              </p>

              {listing.is_deleted && (
                <div className="text-xs bg-red-500/10 text-red-400 p-2.5 rounded-lg mb-2 border border-red-500/20">
                  <p><strong>Soft-Deleted:</strong> {listing.deleted_at ? new Date(listing.deleted_at).toLocaleString() : 'N/A'}</p>
                  <p><strong>Reason:</strong> {listing.deletion_reason || 'user_deleted'}</p>
                  {listing.previous_status && (
                    <p className="text-muted-foreground mt-0.5"><strong>Previous State:</strong> {listing.previous_status}</p>
                  )}
                </div>
              )}

              {listing.status === 'sold' && !listing.is_deleted && (
                <div className="text-xs bg-cyan-500/10 text-cyan-400 p-2 rounded-md mb-2">
                  <p><strong>Sold on:</strong> {listing.sold_at ? new Date(listing.sold_at).toLocaleString() : 'Completed'}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Link to={`/listing/${listing.id}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Link>

                {listing.is_deleted || listing.status === 'archived' ? (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleRestoreListing(listing.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore Post
                  </Button>
                ) : null}

                {listing.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleArchiveListing(listing.id)}
                  >
                    Archive
                  </Button>
                )}

                {(listing.status === 'pending' || listing.status === 'pending_payment') && (
                  <>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => updateListing(listing.id, { status: 'active' })}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500"
                      onClick={() => updateListing(listing.id, { status: 'rejected' })}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateListing(listing.id, { featured: !listing.featured })}
                >
                  <Star className={`w-4 h-4 mr-1 ${listing.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                  {listing.featured ? 'Unfeature' : 'Feature'}
                </Button>
                {!listing.is_deleted && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    onClick={() => {
                      setDeletingListing(listing);
                      setDeletionReason('');
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No listings found</p>
          </div>
        )}
      </div>

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
              <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs">
                <p className="font-bold text-foreground truncate">{deletingListing.title}</p>
                <p className="text-muted-foreground">Listing ID: <code className="font-mono">{deletingListing.id}</code></p>
                <p className="text-muted-foreground">Current Status: <strong className="text-foreground">{deletingListing.status}</strong></p>
              </div>

              <div>
                <Label htmlFor="del-reason" className="text-xs font-semibold block mb-1.5">
                  Reason for Deletion (Audit Trail)
                </Label>
                <Input
                  id="del-reason"
                  placeholder="e.g. Violation of marketplace policy, inappropriate content, scam report"
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

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/admin/reports${params}`);
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId, action) => {
    setActionLoading(reportId);
    try {
      await api.put(`/admin/reports/${reportId}?status=${action}`);
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
                disabled={report.status !== 'pending'}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">Report #{report.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(report.created_at)} • Reported by <span className="font-semibold text-foreground">{report.reporter_name || 'User'}</span></p>
                  </div>
                  <Badge variant="outline" className={
                    report.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
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
                  {report.target_type === 'listing' && report.target_id && report.status === 'pending' && (
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

                  {report.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => handleReview(report.id, 'resolved')}
                        disabled={actionLoading === report.id}
                      >
                        {actionLoading === report.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Mark Resolved'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleReview(report.id, 'dismissed')}
                        disabled={actionLoading === report.id}
                      >
                        Dismiss
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
      </div>

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Dialog States
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [showReverifyDialog, setShowReverifyDialog] = useState(false);
  const [reverifyReason, setReverifyReason] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/admin/kyc${params}`);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycId) => {
    setActionLoading(kycId);
    try {
      await api.put(`/admin/kyc/${kycId}/approve`);
      toast.success('Seller verified and KYC approved');
      fetchSubmissions();
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
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Verified / Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      case 'revoked':
        return <Badge className="bg-rose-600/10 text-rose-500 border-rose-500/30">Revoked</Badge>;
      case 'reverification_requested':
        return <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">Re-verify Requested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    <div data-testid="admin-kyc" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Seller Verification & KYC Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Admin-only review and approval of seller trust verification</p>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] rounded-xl">
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
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
        <strong>Privacy & Security Compliance:</strong> KYC identity files are strictly restricted to administrators. Document numbers are permanently masked to protect user privacy.
      </div>

      <div className="space-y-4">
        {submissions.map((kyc) => (
          <div key={kyc.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base text-foreground">{kyc.user_name || 'Unknown User'}</p>
                  {getStatusBadge(kyc.status)}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{kyc.user_email || 'No email provided'}</p>
              </div>

              <span className="text-xs text-muted-foreground shrink-0 font-mono">
                Submitted: {formatDate(kyc.created_at)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-muted/40 rounded-lg text-xs">
              <div>
                <span className="text-muted-foreground block">Document Type:</span>
                <span className="font-semibold capitalize text-foreground">{kyc.document_type?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Masked ID Number:</span>
                <span className="font-mono font-bold text-foreground">****{kyc.document_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Document Attachment:</span>
                {kyc.document_image_url ? (
                  <a 
                    href={kyc.document_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-violet-500 hover:underline font-semibold flex items-center gap-1 mt-0.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Uploaded ID
                  </a>
                ) : (
                  <span className="text-muted-foreground">No image attached</span>
                )}
              </div>
            </div>

            {/* Rejection / Revocation Reason */}
            {kyc.rejection_reason && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400 mb-3">
                <strong>Admin Moderation Note:</strong> {kyc.rejection_reason}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {kyc.status !== 'approved' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs h-8"
                  onClick={() => handleApprove(kyc.id)}
                  disabled={actionLoading === kyc.id}
                >
                  {actionLoading === kyc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Approve Verification
                </Button>
              )}

              {kyc.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:bg-red-500/10 font-semibold text-xs h-8"
                  onClick={() => {
                    setSelectedKYC(kyc);
                    setShowRejectDialog(true);
                  }}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
              )}

              {kyc.status === 'approved' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-500 hover:bg-rose-500/10 border-rose-500/30 font-semibold text-xs h-8"
                    onClick={() => {
                      setSelectedKYC(kyc);
                      setShowRevokeDialog(true);
                    }}
                  >
                    <ShieldOff className="w-3.5 h-3.5 mr-1" />
                    Revoke Verification
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-cyan-500 hover:bg-cyan-500/10 font-semibold text-xs h-8"
                    onClick={() => {
                      setSelectedKYC(kyc);
                      setShowReverifyDialog(true);
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Request Re-verification
                  </Button>
                </>
              )}

              {(kyc.status === 'rejected' || kyc.status === 'revoked') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-cyan-500 hover:bg-cyan-500/10 font-semibold text-xs h-8"
                  onClick={() => {
                    setSelectedKYC(kyc);
                    setShowReverifyDialog(true);
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Allow Re-submission
                </Button>
              )}
            </div>
          </div>
        ))}

        {submissions.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-base text-foreground">No verification submissions</h3>
            <p className="text-xs text-muted-foreground mt-1">There are no seller KYC requests matching the selected filter.</p>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
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
            <DialogTitle>Request Re-verification</DialogTitle>
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
  const [adminNotes, setAdminNotes] = useState('');
  const [ticketStatus, setTicketStatus] = useState('open');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [actionLoading, setActionLoading] = useState(false);

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
        admin_notes: adminNotes
      });
      toast.success('Support ticket updated');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update support ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status || 'open');
    setTicketPriority(ticket.priority || 'medium');
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
          <p className="text-xs text-muted-foreground mt-0.5">Manage user requests, fake deal reports, and technical inquiries</p>
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

        <Select value={filterStatus} onValueChange={setFilterStatus}>
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

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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
        {filteredTickets.map((ticket) => (
          <div key={ticket.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:border-violet-500/40 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-violet-500">{ticket.ticket_number}</span>
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
                <Badge variant="outline" className="text-[11px]">{ticket.category}</Badge>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {formatDate(ticket.created_at)}
              </span>
            </div>

            <h3 className="font-bold text-base text-foreground mb-1">{ticket.subject}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {ticket.description}
            </p>

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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-1.5">
                <Label>Internal Moderation Notes</Label>
                <Textarea
                  placeholder="Notes on actions taken, resolution details, or user communications..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="rounded-xl"
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

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/admin/payments${params}`);
      setPayments(response.data);
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
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'dictionary'
  
  // Records Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Dictionary Management State
  const [terms, setTerms] = useState([]);
  const [termsSummary, setTermsSummary] = useState(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termSearch, setTermSearch] = useState('');
  const [termLanguage, setTermLanguage] = useState('all');
  const [termCategory, setTermCategory] = useState('all');
  const [termSeverity, setTermSeverity] = useState('all');
  const [termStatus, setTermStatus] = useState('all');
  
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

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden" data-testid="admin-moderation">
      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Auto-Blocked Items"
          value={stats?.auto_blocked || 0}
          subtitle={`${stats?.pending || 0} pending admin review`}
          icon={Ban}
          color="bg-red-500"
        />
        <StatsCard
          title="Total Mod Events"
          value={stats?.total || 0}
          subtitle={`${stats?.approved || 0} approved, ${stats?.rejected || 0} confirmed`}
          icon={ShieldAlert}
          color="bg-violet-600"
        />
        <StatsCard
          title="Active Dictionary Terms"
          value={termsSummary?.total || stats?.total_seed_terms || 154}
          subtitle="English, Malayalam & Manglish"
          icon={FileText}
          color="bg-cyan-500"
        />
        <StatsCard
          title="Dismissed / False Positives"
          value={stats?.dismissed || 0}
          subtitle="Reviewed by admin"
          icon={Check}
          color="bg-emerald-500"
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
                    {filteredRecords.map((rec) => (
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
                onChange={(e) => setTermSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={termLanguage} onValueChange={setTermLanguage}>
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

              <Select value={termCategory} onValueChange={setTermCategory}>
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="profanity">Profanity</SelectItem>
                  <SelectItem value="slur">Slur</SelectItem>
                  <SelectItem value="sexual">Sexual</SelectItem>
                  <SelectItem value="insult">Insult</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="hate_speech">Hate Speech</SelectItem>
                </SelectContent>
              </Select>

              <Select value={termSeverity} onValueChange={setTermSeverity}>
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

              <Select value={termStatus} onValueChange={setTermStatus}>
                <SelectTrigger className="w-32 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="enabled">Enabled Only</SelectItem>
                  <SelectItem value="disabled">Disabled Only</SelectItem>
                </SelectContent>
              </Select>
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
                    {terms.map((t) => (
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

// Audit Logs Component
function AuditLogsManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter, searchQuery]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityFilter !== 'all') params.append('entity_type', entityFilter);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '100');

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (action.includes('DELETED')) {
      return <Badge variant="destructive" className="bg-red-500 text-white">{action}</Badge>;
    }
    if (action.includes('RESTORED') || action.includes('APPROVED')) {
      return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">{action}</Badge>;
    }
    if (action.includes('CREATED') || action.includes('ADDED')) {
      return <Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">{action}</Badge>;
    }
    if (action.includes('SOLD')) {
      return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">{action}</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden" data-testid="admin-audit-logs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold">Platform Audit History</h2>
          <p className="text-xs text-muted-foreground">Immutable administrative history of all listing modifications, soft-deletes, restorations, sales, and dictionary alterations.</p>
        </div>
        <Badge variant="outline" className="text-xs self-start sm:self-auto font-mono">
          {total} Total Audit Records
        </Badge>
      </div>

      {/* Controls & Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by action, email, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="listing">Listings</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="moderation_term">Moderation Terms</SelectItem>
              <SelectItem value="conversation">Conversations</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-44 text-xs">
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
              <SelectItem value="MODERATION_TERM_ADDED">MODERATION_TERM_ADDED</SelectItem>
              <SelectItem value="MODERATION_TERM_UPDATED">MODERATION_TERM_UPDATED</SelectItem>
              <SelectItem value="MODERATION_TERM_DELETED">MODERATION_TERM_DELETED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-bold text-lg text-foreground">No Audit Records Found</p>
            <p className="text-sm mt-1">Actions performed on listings, accounts, and moderation terms will be recorded here.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="p-4">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-foreground capitalize">{log.entity_type}</div>
                      <div className="font-mono text-[11px] text-muted-foreground truncate max-w-[150px]">{log.entity_id}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-xs font-semibold text-foreground">
                        {log.admin_email || log.user_email || 'System / Platform'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {log.admin_id ? `Admin (${log.admin_id.slice(0, 8)})` : (log.user_id ? `User (${log.user_id.slice(0, 8)})` : 'Automated')}
                      </div>
                    </td>

                    <td className="p-4 max-w-sm">
                      <p className="text-xs text-foreground font-medium">{log.reason || 'Standard operation'}</p>
                      {log.new_state && (
                        <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                          New: {typeof log.new_state === 'object' ? JSON.stringify(log.new_state).substring(0, 80) : String(log.new_state)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Admin Dashboard
export default function AdminDashboard() {
  const location = useLocation();
  const currentPath = location.pathname.split('/admin')[1] || '';

  const navItems = [
    { path: '', label: 'Overview', icon: LayoutDashboard },
    { path: '/moderation', label: 'Moderation & Filter', icon: ShieldAlert },
    { path: '/audit-logs', label: 'Audit History', icon: RotateCcw },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/listings', label: 'Listings', icon: Package },
    { path: '/kyc', label: 'KYC & Verification', icon: ShieldCheck },
    { path: '/support-tickets', label: 'Support Tickets', icon: HelpCircle },
    { path: '/reports', label: 'Ad Reports', icon: Flag },
    { path: '/all-chats', label: 'All Chats', icon: MessageCircle },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/categories', label: 'Categories', icon: FolderOpen },
    { path: '/pages', label: 'Pages & Policies', icon: FileText },
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
              <p className="text-xs text-muted-foreground">Manage moderation, audit history, users, verification, listings, support, and payments</p>
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
                return (
                  <Link
                    key={item.path}
                    to={`/admin${item.path}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                      isActive
                        ? 'bg-violet-600 text-white font-bold'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`nav-${item.path.replace('/', '') || 'overview'}`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
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
              <Route path="users" element={<UsersManagement />} />
              <Route path="listings" element={<ListingsManagement />} />
              <Route path="kyc" element={<KYCManagement />} />
              <Route path="support-tickets" element={<SupportTicketsManagement />} />
              <Route path="reports" element={<ReportsManagement />} />
              <Route path="all-chats" element={<AllChatsManagement />} />
              <Route path="payments" element={<PaymentsManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="pages" element={<PagesManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

