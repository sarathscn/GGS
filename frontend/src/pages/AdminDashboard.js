import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../lib/api';
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
  MoreVertical,
  ExternalLink,
  FileSpreadsheet,
  Receipt,
  AlertTriangle,
  Plus
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
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold">{user.name?.charAt(0)}</span>
                        )}
                      </div>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="listings">Listings ({userListings.length})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({userPayments.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="p-4 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                  {userDetail?.avatar ? (
                    <img src={userDetail.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold">{userDetail?.name?.charAt(0)}</span>
                  )}
                </div>
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
      toast.error('Failed to update listing');
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
    deleted: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
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
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
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
            className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4"
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
                <h3 className="font-bold truncate">{listing.title}</h3>
                <Badge variant="outline" className={statusColors[listing.status]}>
                  {listing.status?.replace('_', ' ')}
                </Badge>
              </div>
              <p className="font-mono text-lg font-bold text-violet-500 mb-1">
                {formatPrice(listing.price)}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                By {listing.seller_name} • {listing.category_name}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to={`/listing/${listing.id}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Link>
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
                {listing.status !== 'deleted' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    onClick={() => updateListing(listing.id, { status: 'deleted' })}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                ) : (
                  <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                    Deleted Post
                  </Badge>
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
    </div>
  );
}

// Admin Chat Viewer Component
function AllChatsManagement() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'flagged'

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
    
    // Update URL to match selected conv for shareability
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
        <h2 className="text-xl font-bold">Chat Monitor</h2>
        <Tabs value={filter} onValueChange={setFilter} className="w-[300px]">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All Chats</TabsTrigger>
            <TabsTrigger value="flagged" className="flex-1 text-red-500 data-[state=active]:text-red-600">
              Flagged
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversations List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden h-fit">
          <div className="p-3 border-b border-border bg-muted/50 flex justify-between items-center">
            <p className="font-medium">Conversations ({conversations.length})</p>
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
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {p.avatar ? (
                          <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{p.name?.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-sm">{p.name}</span>
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
                    <Badge variant="outline" className="ml-2">{conv.message_count} msgs</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(conv.last_message_at)}</p>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No conversations found
              </div>
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/50">
            <p className="font-medium">Messages</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : selectedConv ? (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${msg.is_flagged ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{msg.sender_name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="text-sm">{msg.text}</p>
                    {msg.original_text && msg.original_text !== msg.text && (
                      <p className="text-xs text-red-500 mt-1">Original: {msg.original_text}</p>
                    )}
                    {msg.attachment_url && (
                      <img src={msg.attachment_url} alt="" className="mt-2 max-w-[200px] rounded" />
                    )}
                    {msg.is_flagged && (
                      <div className="mt-3">
                        <Badge variant="outline" className={`mb-2 ${
                            msg.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                            msg.status === 'reviewed' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                          Flagged: {msg.status || 'pending'}
                        </Badge>
                        
                        {(!msg.status || msg.status === 'pending') && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-600/20"
                              onClick={() => handleReviewMessage(msg.id, 'reviewed')}
                              disabled={actionLoading === msg.id}
                            >
                              {actionLoading === msg.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Mark Reviewed'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
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
                  <p className="text-center text-muted-foreground py-8">No messages in this conversation</p>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Reports Management with Navigation
function ReportsManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const navigate = useNavigate();

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
      toast.success('Report updated');
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report');
    } finally {
      setActionLoading(null);
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
                    <p className="font-medium">Report #{report.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(report.created_at)}</p>
                  </div>
                  <Badge variant="outline" className={
                    report.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                    report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-gray-500/10 text-gray-500'
                  }>
                    {report.status}
                  </Badge>
                </div>
                <p className="text-sm mb-2"><strong>Reason:</strong> {report.reason}</p>
                {report.details && (
                  <p className="text-sm text-muted-foreground mb-3">{report.details}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/listing/${report.target_id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Listing
                    </Button>
                  </Link>
                  {report.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleReview(report.id, 'resolved')}
                        disabled={actionLoading === report.id}
                      >
                        {actionLoading === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Mark Resolved'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
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
            <Flag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// KYC Management Component
function KYCManagement() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState(null);

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
      toast.success('KYC approved');
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
      await api.put(`/admin/kyc/${selectedKYC.id}/reject?reason=${encodeURIComponent(rejectReason)}`);
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

  return (
    <div data-testid="admin-kyc">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">KYC Verification</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 text-sm">
        <strong>Privacy Notice:</strong> KYC documents are confidential. Only last 4 digits of document numbers are displayed.
      </div>

      <div className="space-y-4">
        {submissions.map((kyc) => (
          <div key={kyc.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium">{kyc.user_name || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">{kyc.user_email}</p>
              </div>
              <Badge variant="outline" className={
                kyc.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                kyc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                'bg-red-500/10 text-red-500'
              }>
                {kyc.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className="text-muted-foreground">Document Type:</span>
                <p className="font-medium capitalize">{kyc.document_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Document Number:</span>
                <p className="font-mono">****{kyc.document_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <p>{formatDate(kyc.created_at)}</p>
              </div>
            </div>
            {kyc.document_image_url && (
              <div className="mb-3">
                <a href={kyc.document_image_url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline text-sm flex items-center gap-1">
                  <Eye className="w-4 h-4" /> View Document
                </a>
              </div>
            )}
            {kyc.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleApprove(kyc.id)}
                  disabled={actionLoading === kyc.id}
                >
                  {actionLoading === kyc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500"
                  onClick={() => {
                    setSelectedKYC(kyc);
                    setShowRejectDialog(true);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
            {kyc.rejection_reason && (
              <p className="text-sm text-red-500 mt-2">
                <strong>Rejection Reason:</strong> {kyc.rejection_reason}
              </p>
            )}
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No KYC submissions found</p>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this KYC submission.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleReject}
              disabled={!rejectReason || actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// Payments Management with Invoice
function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/admin/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
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
      const response = await api.get(`/payments/${paymentId}/invoice`);
      const invoice = response.data;
      
      const doc = new jsPDF();
      
      // Add Letterhead
      doc.setFontSize(22);
      doc.setTextColor(139, 92, 246); // Violet-500
      doc.setFont("helvetica", "bold");
      doc.text("GAME GEAR SWAP", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Kerala's Trusted Gaming Marketplace", 105, 26, { align: "center" });
      doc.text(invoice.company_address || "Kerala, India", 105, 32, { align: "center" });
      doc.text(`Email: ${invoice.company_email} | GSTIN: ${invoice.company_gstin}`, 105, 38, { align: "center" });
      
      // Divider
      doc.setDrawColor(200);
      doc.line(14, 45, 196, 45);
      
      // Invoice Details
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("TAX INVOICE", 14, 55);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice No: ${invoice.invoice_number}`, 14, 65);
      doc.text(`Date: ${formatDate(invoice.invoice_date)}`, 14, 71);
      doc.text(`Transaction ID: ${invoice.transaction_id}`, 14, 77);
      
      // Billed To
      const billedToY = 65;
      doc.setFont("helvetica", "bold");
      doc.text("BILLED TO:", 120, billedToY);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.user_name || 'N/A', 120, billedToY + 6);
      if (invoice.user_email) doc.text(invoice.user_email, 120, billedToY + 12);
      if (invoice.user_phone) doc.text(invoice.user_phone, 120, billedToY + 18);
      
      // Table
      doc.autoTable({
        startY: 90,
        head: [['Description', 'Amount']],
        body: [
          [`Ad Title: ${invoice.ad_title}\nAd ID: ${invoice.ad_id}`, `Rs. ${invoice.base_amount}`],
          [`GST (${invoice.gst_rate}%)`, `Rs. ${invoice.gst_amount}`],
        ],
        foot: [['Total Amount', `Rs. ${invoice.total_amount}`]],
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] }
      });
      
      const finalY = doc.lastAutoTable.finalY || 130;
      doc.setFont("helvetica", "normal");
      doc.text(`Payment Method: ${invoice.payment_method}`, 14, finalY + 10);
      doc.text(`Status: ${invoice.payment_status}`, 14, finalY + 16);
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`© ${invoice.copyright}`, 105, 280, { align: "center" });

      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
      
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
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
    <div data-testid="admin-payments">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Payments</h2>
        <ExportButton type="payments" label="Export Payments" />
      </div>
      
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Payment ID</th>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-border">
                  <td className="p-4 font-mono text-sm">{payment.id.slice(0, 8)}...</td>
                  <td className="p-4 text-sm">{payment.user_id.slice(0, 8)}...</td>
                  <td className="p-4 font-mono font-bold text-emerald-500">₹{payment.amount}</td>
                  <td className="p-4">
                    <Badge variant="outline" className={
                      payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-amber-500/10 text-amber-500'
                    }>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{formatDate(payment.created_at)}</td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadInvoice(payment.id)}
                    >
                      <Receipt className="w-4 h-4 mr-1" />
                      Invoice
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No payments found</p>
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

// Main Admin Dashboard
export default function AdminDashboard() {
  const location = useLocation();
  const currentPath = location.pathname.split('/admin')[1] || '';

  const navItems = [
    { path: '', label: 'Overview', icon: LayoutDashboard },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/listings', label: 'Listings', icon: Package },
    { path: '/kyc', label: 'KYC Verify', icon: Shield },
    { path: '/reports', label: 'Ad Reports', icon: Flag },
    { path: '/all-chats', label: 'All Chats', icon: MessageCircle },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/categories', label: 'Categories', icon: FolderOpen },
    { path: '/pages', label: 'Pages', icon: FileText },
  ];

  return (
    <div className="min-h-screen py-8" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage GGS Platform</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={`/admin${item.path}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`nav-${item.path.replace('/', '') || 'overview'}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="listings" element={<ListingsManagement />} />
              <Route path="kyc" element={<KYCManagement />} />
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
