import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Music, 
  DollarSign, 
  Calendar,
  ShoppingBag,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Crown,
  Flag,
  TrendingUp,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch admin data
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users", searchQuery],
  });

  const { data: pendingArtists = [] } = useQuery({
    queryKey: ["/api/admin/artists/pending"],
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/admin/reports"],
  });

  const { data: revenue } = useQuery({
    queryKey: ["/api/admin/revenue"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-ruc-text-muted">You need administrator privileges to access this panel.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-ruc-red" />
            Admin Panel
          </h1>
          <p className="text-ruc-text-muted">
            Manage platform users, content, and monitor system performance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</p>
                </div>
                <Users className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats?.totalRevenue?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Pending Reports</p>
                  <p className="text-2xl font-bold">{reports.filter((r: any) => r.status === 'pending').length}</p>
                </div>
                <Flag className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Active Artists</p>
                  <p className="text-2xl font-bold">{stats?.activeArtists?.toLocaleString() || 0}</p>
                </div>
                <Music className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-ruc-surface">
            <TabsTrigger value="overview" className="data-[state=active]:bg-ruc-red" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-ruc-red" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="artists" className="data-[state=active]:bg-ruc-red" data-testid="tab-artists">
              <Crown className="w-4 h-4 mr-2" />
              Artist Verification
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-ruc-red" data-testid="tab-content">
              <Music className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-ruc-red" data-testid="tab-reports">
              <Flag className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-ruc-red" data-testid="tab-revenue">
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-ruc-red" data-testid="tab-analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-ruc-surface border-ruc-border">
                <CardHeader>
                  <CardTitle>Platform Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-ruc-text-muted">New Users (24h)</span>
                      <span className="font-bold text-ruc-success">+{analytics?.newUsers24h || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ruc-text-muted">Songs Uploaded (24h)</span>
                      <span className="font-bold text-ruc-red">+{analytics?.songsUploaded24h || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ruc-text-muted">Revenue (24h)</span>
                      <span className="font-bold text-ruc-success">+${analytics?.revenue24h || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ruc-text-muted">Active Sessions</span>
                      <span className="font-bold">{analytics?.activeSessions || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-ruc-surface border-ruc-border">
                <CardHeader>
                  <CardTitle>Recent Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.recentActions?.map((action: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-ruc-surface-2 rounded-lg">
                        <Activity className="w-4 h-4 text-ruc-red" />
                        <div className="flex-1">
                          <p className="text-sm">{action.description}</p>
                          <p className="text-xs text-ruc-text-muted">{action.timeAgo}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-ruc-text-muted text-center py-8">No recent actions</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ruc-text-low w-4 h-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-ruc-surface-2 border-ruc-border"
                        data-testid="user-search-input"
                      />
                    </div>
                    <Button variant="outline" className="border-ruc-border" data-testid="export-users">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <UserRow key={user.id} user={user} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Artist Verification Tab */}
          <TabsContent value="artists">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <CardTitle>Artist Verification Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingArtists.length > 0 ? (
                  <div className="space-y-4">
                    {pendingArtists.map((artist: any) => (
                      <ArtistVerificationRow key={artist.id} artist={artist} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Crown className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No pending verifications</h3>
                    <p className="text-ruc-text-muted">All artist verification requests have been processed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="space-y-6">
              <Card className="bg-ruc-surface border-ruc-border">
                <CardHeader>
                  <CardTitle>Content Moderation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ruc-red mb-2">
                        {stats?.flaggedContent || 0}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Flagged Content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ruc-success mb-2">
                        {stats?.approvedContent || 0}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Approved Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ruc-danger mb-2">
                        {stats?.removedContent || 0}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Removed Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report: any) => (
                      <ReportRow key={report.id} report={report} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Flag className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No reports to review</h3>
                    <p className="text-ruc-text-muted">All reports have been processed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ruc-red mb-2">
                      ${revenue?.total?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-ruc-text-muted">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ruc-success mb-2">
                      ${revenue?.subscriptions?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-ruc-text-muted">Subscriptions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ruc-orange mb-2">
                      ${revenue?.merchandise?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-ruc-text-muted">Merchandise</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ruc-info mb-2">
                      ${revenue?.events?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-ruc-text-muted">Event Tickets</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ruc-red mb-2">
                        {analytics?.userGrowth || "+0%"}
                      </div>
                      <div className="text-sm text-ruc-text-muted">User Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ruc-success mb-2">
                        {analytics?.revenueGrowth || "+0%"}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Revenue Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ruc-orange mb-2">
                        {analytics?.contentGrowth || "+0%"}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Content Growth</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// User Row Component
function UserRow({ user }: { user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/admin/users/${user.id}/suspend`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User suspended",
        description: "The user has been suspended successfully.",
      });
    },
  });

  return (
    <div className="flex items-center justify-between p-4 bg-ruc-surface-2 rounded-lg" data-testid={`user-row-${user.id}`}>
      <div className="flex items-center space-x-4">
        <img
          src={user.avatar || "/placeholder-user.jpg"}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h4 className="font-semibold">{user.name}</h4>
          <p className="text-sm text-ruc-text-muted">{user.email}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge 
              variant={user.role === 'admin' ? 'default' : 'secondary'}
              className={user.role === 'admin' ? 'bg-ruc-red' : ''}
            >
              {user.role}
            </Badge>
            {user.isVerified && (
              <Badge className="bg-ruc-success text-white">Verified</Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" data-testid={`view-user-${user.id}`}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" data-testid={`edit-user-${user.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => suspendMutation.mutate()}
          className="text-ruc-danger"
          data-testid={`suspend-user-${user.id}`}
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Artist Verification Row Component
function ArtistVerificationRow({ artist }: { artist: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async (status: 'approved' | 'rejected') => {
      await apiRequest("POST", `/api/admin/artists/${artist.id}/verify`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artists/pending"] });
      toast({
        title: "Verification updated",
        description: "Artist verification status has been updated.",
      });
    },
  });

  return (
    <div className="p-4 bg-ruc-surface-2 rounded-lg" data-testid={`artist-verification-${artist.id}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={artist.user?.avatar || "/placeholder-artist.jpg"}
            alt={artist.user?.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold">{artist.user?.name}</h4>
            <p className="text-sm text-ruc-text-muted">{artist.user?.email}</p>
            <p className="text-xs text-ruc-text-low">
              Applied: {new Date(artist.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className="bg-ruc-success hover:bg-ruc-success/80"
            onClick={() => verifyMutation.mutate('approved')}
            disabled={verifyMutation.isPending}
            data-testid={`approve-artist-${artist.id}`}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => verifyMutation.mutate('rejected')}
            disabled={verifyMutation.isPending}
            data-testid={`reject-artist-${artist.id}`}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      </div>
      
      {artist.bio && (
        <div className="mb-3">
          <h5 className="font-medium text-sm mb-1">Bio:</h5>
          <p className="text-sm text-ruc-text-muted">{artist.bio}</p>
        </div>
      )}
      
      {artist.genres && artist.genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {artist.genres.map((genre: string) => (
            <Badge key={genre} variant="secondary" className="bg-ruc-surface">
              {genre}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Report Row Component
function ReportRow({ report }: { report: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resolveReportMutation = useMutation({
    mutationFn: async (action: 'dismiss' | 'remove' | 'warn') => {
      await apiRequest("POST", `/api/admin/reports/${report.id}/resolve`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Report resolved",
        description: "The report has been processed successfully.",
      });
    },
  });

  return (
    <div className="p-4 bg-ruc-surface-2 rounded-lg" data-testid={`report-${report.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold mb-1">
            {report.contentType} Report: {report.reason}
          </h4>
          <p className="text-sm text-ruc-text-muted mb-2">{report.description}</p>
          <div className="flex items-center space-x-4 text-xs text-ruc-text-low">
            <span>Reported by: {report.reporter?.name}</span>
            <span>Date: {new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <Badge 
          variant={report.status === 'pending' ? 'destructive' : 'secondary'}
          className={report.status === 'pending' ? 'bg-ruc-warning text-ruc-black' : ''}
        >
          {report.status}
        </Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => resolveReportMutation.mutate('dismiss')}
          disabled={resolveReportMutation.isPending}
          className="border-ruc-border"
          data-testid={`dismiss-report-${report.id}`}
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          className="bg-ruc-warning text-ruc-black hover:bg-ruc-warning/80"
          onClick={() => resolveReportMutation.mutate('warn')}
          disabled={resolveReportMutation.isPending}
          data-testid={`warn-report-${report.id}`}
        >
          Warn User
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => resolveReportMutation.mutate('remove')}
          disabled={resolveReportMutation.isPending}
          data-testid={`remove-content-${report.id}`}
        >
          Remove Content
        </Button>
      </div>
    </div>
  );
}
