import { useState } from "react";
import { Users, AlertTriangle, BarChart3, Settings, CheckCircle, XCircle, Clock, DollarSign, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireRole } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";

export default function AdminPanel() {
  const auth = useRequireRole("admin");
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();

  // Fetch admin data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!auth.user,
    staleTime: 2 * 60 * 1000,
  });

  const { data: pendingArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ["/api/admin/pending-artists"],
    enabled: !!auth.user,
    staleTime: 30 * 1000,
  });

  const { data: contentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/content-reports"],
    enabled: !!auth.user,
    staleTime: 30 * 1000,
  });

  // Artist verification mutation
  const verifyArtistMutation = useMutation({
    mutationFn: async ({ artistId, approved, reason }: { artistId: string; approved: boolean; reason?: string }) => {
      const response = await fetch(`/api/admin/verify-artist/${artistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ruc_auth_token')}`
        },
        body: JSON.stringify({ approved, reason })
      });
      if (!response.ok) throw new Error('Failed to verify artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-artists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Success",
        description: "Artist verification updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update artist verification",
        variant: "destructive"
      });
    }
  });

  if (auth.isLoading || statsLoading) {
    return (
      <div className="min-h-screen pt-16">
        <Loading size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  if (!auth.user) {
    return null;
  }

  return (
    <div className="min-h-screen pt-16 pb-24">
      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage platform operations and content</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" data-testid="dashboard-tab">Dashboard</TabsTrigger>
            <TabsTrigger value="artists" data-testid="artists-tab">Artists</TabsTrigger>
            <TabsTrigger value="content" data-testid="content-tab">Content</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.pendingArtists || 0}</div>
                  <p className="text-xs text-muted-foreground">Artist applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Content Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.contentReports || 0}</div>
                  <p className="text-xs text-muted-foreground">Requiring review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.activeUsers?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">+5.2% this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{dashboardStats?.platformRevenue?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover-glow" onClick={() => setActiveTab("artists")}>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <Users className="w-12 h-12 text-warning mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Review Artists</h3>
                  <p className="text-sm text-muted-foreground">Approve or reject artist applications</p>
                  {pendingArtists && pendingArtists.length > 0 && (
                    <Badge className="mt-2" variant="secondary">
                      {pendingArtists.length} pending
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover-glow" onClick={() => setActiveTab("content")}>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Moderate Content</h3>
                  <p className="text-sm text-muted-foreground">Review reported content and take action</p>
                  {contentReports && contentReports.length > 0 && (
                    <Badge className="mt-2" variant="destructive">
                      {contentReports.length} reports
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover-glow" onClick={() => setActiveTab("analytics")}>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Platform Analytics</h3>
                  <p className="text-sm text-muted-foreground">View detailed platform metrics</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists">
            <Card>
              <CardHeader>
                <CardTitle>Pending Artist Applications</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and approve artist applications to allow them to publish content
                </p>
              </CardHeader>
              <CardContent>
                {artistsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-6 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pendingArtists && pendingArtists.length > 0 ? (
                  <div className="space-y-4">
                    {pendingArtists.map((artist: any, index: number) => (
                      <div 
                        key={artist._id} 
                        className="p-6 border rounded-lg"
                        data-testid={`pending-artist-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.userId || 'artist'}`} />
                              <AvatarFallback>{artist.user?.name?.charAt(0) || 'A'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{artist.user?.name || 'Unknown Artist'}</h3>
                              <p className="text-sm text-muted-foreground">{artist.user?.email}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Applied on {new Date(artist.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-success border-success hover:bg-success hover:text-white"
                              onClick={() => verifyArtistMutation.mutate({ 
                                artistId: artist._id, 
                                approved: true 
                              })}
                              disabled={verifyArtistMutation.isPending}
                              data-testid="approve-artist"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                              onClick={() => verifyArtistMutation.mutate({ 
                                artistId: artist._id, 
                                approved: false,
                                reason: "Application needs more information"
                              })}
                              disabled={verifyArtistMutation.isPending}
                              data-testid="reject-artist"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending artist applications at the moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review reported content and take appropriate action
                </p>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-6 border rounded-lg">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : contentReports && contentReports.length > 0 ? (
                  <div className="space-y-4">
                    {contentReports.map((report: any, index: number) => (
                      <div 
                        key={report._id} 
                        className="p-6 border rounded-lg"
                        data-testid={`content-report-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Reported Content</h3>
                            <p className="text-sm text-muted-foreground">
                              {report.type} • Reported {report.reportCount} time(s)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last report: {new Date(report.lastReported).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive">
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reports to review</h3>
                    <p className="text-muted-foreground">All content is clean! No reported content at the moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.totalUsers?.toLocaleString() || 0}</div>
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Fans</span>
                        <span>{dashboardStats?.totalFans?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Artists</span>
                        <span>{dashboardStats?.totalArtists?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Verified Artists</span>
                        <span>{dashboardStats?.verifiedArtists?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Content Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Songs</span>
                        <span className="font-medium">{dashboardStats?.totalSongs?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Streams</span>
                        <span className="font-medium">{dashboardStats?.totalStreams?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Events Created</span>
                        <span className="font-medium">{dashboardStats?.totalEvents?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Merch Items</span>
                        <span className="font-medium">{dashboardStats?.totalMerch?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Premium Subscriptions</span>
                        <span className="font-medium">₹{dashboardStats?.premiumRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Artist Subscriptions</span>
                        <span className="font-medium">₹{dashboardStats?.artistSubRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Merch Sales</span>
                        <span className="font-medium">₹{dashboardStats?.merchRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Event Tickets</span>
                        <span className="font-medium">₹{dashboardStats?.ticketRevenue?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">System Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Database</span>
                          <Badge variant="default" className="bg-success">Online</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Storage</span>
                          <Badge variant="default" className="bg-success">Online</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Payment Gateway</span>
                          <Badge variant="default" className="bg-success">Online</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Email Service</span>
                          <Badge variant="default" className="bg-success">Online</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Recent Activity</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• New user registration: +25 today</p>
                        <p>• Songs uploaded: 12 today</p>
                        <p>• Events created: 3 today</p>
                        <p>• Support tickets: 2 pending</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
