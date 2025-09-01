
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Package, Truck, CheckCircle, Clock, Download, MapPin, Calendar, CreditCard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/use-auth";
import Loading from "@/components/common/loading";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  _id: string;
  merchId?: string;
  eventId?: string;
  qty: number;
  unitPrice: number;
  title?: string;
  name?: string;
  imageUrl?: string;
}

interface Order {
  _id: string;
  type: "MERCH" | "TICKET" | "MIXED";
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "SHIPPED" | "DELIVERED";
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
  qrTicketUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function OrderTracking() {
  const auth = useRequireAuth();
  const [location] = useLocation();
  const orderId = location.split('/')[2]; // Extract order ID from URL

  const { data: order, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ruc_auth_token')}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json();
    },
    enabled: !!orderId && !!auth.user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500";
      case "PAID": return "bg-blue-500";
      case "SHIPPED": return "bg-orange-500";
      case "DELIVERED": return "bg-green-500";
      case "REFUNDED": return "bg-gray-500";
      case "FAILED": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusSteps = (status: string, type: string) => {
    if (type === "TICKET") {
      return [
        { name: "Order Placed", status: "completed", icon: Clock },
        { name: "Payment Confirmed", status: status === "PAID" ? "completed" : "pending", icon: CreditCard },
        { name: "Tickets Generated", status: status === "PAID" ? "completed" : "pending", icon: CheckCircle },
      ];
    } else {
      return [
        { name: "Order Placed", status: "completed", icon: Clock },
        { name: "Payment Confirmed", status: ["PAID", "SHIPPED", "DELIVERED"].includes(status) ? "completed" : "pending", icon: CreditCard },
        { name: "Processing", status: ["SHIPPED", "DELIVERED"].includes(status) ? "completed" : "pending", icon: Package },
        { name: "Shipped", status: ["SHIPPED", "DELIVERED"].includes(status) ? "completed" : "pending", icon: Truck },
        { name: "Delivered", status: status === "DELIVERED" ? "completed" : "pending", icon: CheckCircle },
      ];
    }
  };

  const handleDownloadTicket = () => {
    if (order?.qrTicketUrl) {
      window.open(order.qrTicketUrl, '_blank');
    } else {
      toast({
        title: "Ticket not available",
        description: "Your ticket will be available after payment confirmation",
        variant: "destructive"
      });
    }
  };

  if (!auth.user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16">
        <Loading size="lg" text="Loading order details..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-16 pb-24">
        <div className="container-custom py-8">
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order not found</h3>
              <p className="text-muted-foreground">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(order.status, order.type);

  return (
    <div className="min-h-screen pt-16 pb-24">
      <div className="container-custom py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Tracking</h1>
          <p className="text-muted-foreground">Track your order and view details</p>
        </div>

        {/* Order Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Order #{order._id.slice(-8)}</CardTitle>
                <p className="text-muted-foreground">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Order Type</h3>
                <p className="text-muted-foreground">{order.type}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Total Amount</h3>
                <p className="text-lg font-bold text-primary">₹{order.totalAmount}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <p className="text-muted-foreground">{order.items.length} item(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.status === "completed";
                const isLast = index === statusSteps.length - 1;

                return (
                  <div key={step.name} className="flex items-center mb-6 last:mb-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.name}
                      </h4>
                    </div>
                    {!isLast && (
                      <div className={`absolute left-5 w-0.5 h-6 ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      } mt-10`} style={{ top: `${index * 80 + 40}px` }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Tracking Information</h4>
                <p className="text-sm text-muted-foreground mb-1">Tracking Number: {order.trackingNumber}</p>
                {order.estimatedDelivery && (
                  <p className="text-sm text-muted-foreground">
                    Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Ticket Download */}
            {order.type === "TICKET" && order.status === "PAID" && (
              <div className="mt-6">
                <Button onClick={handleDownloadTicket} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <img 
                    src={item.imageUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100"}
                    alt={item.title || item.name || "Item"}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.title || item.name}</h4>
                    <p className="text-sm text-muted-foreground">Quantity: {item.qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.unitPrice * item.qty}</p>
                    <p className="text-sm text-muted-foreground">₹{item.unitPrice} each</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-semibold">{order.shippingAddress.name}</p>
                <p className="text-muted-foreground">{order.shippingAddress.address}</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
                <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
