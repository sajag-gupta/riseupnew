import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Share,
  Clock,
  Music,
} from "lucide-react";
import { Link } from "wouter";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  onInterested?: () => void;
  onShare?: () => void;
  className?: string;
}

export function EventCard({
  event,
  onInterested,
  onShare,
  className = "",
}: EventCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTicketPrice = () => {
    if (!event.ticketTypes || event.ticketTypes.length === 0) {
      return "Free";
    }
    const minPrice = Math.min(...event.ticketTypes.map(t => t.price));
    return minPrice === 0 ? "Free" : `$${minPrice}`;
  };

  return (
    <Card
      className={`card-hover bg-card border-border overflow-hidden ${className}`}
      data-testid="event-card"
    >
      <CardContent className="p-0">
        {/* Event Banner */}
        <div className="relative">
          <Avatar className="w-full h-48 rounded-none">
            <AvatarImage
              src={event.media?.bannerImage || ""}
              alt={event.title}
              className="object-cover"
            />
            <AvatarFallback className="rounded-none bg-muted">
              <Music className="w-12 h-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-primary/90 rounded-lg px-3 py-2 text-white">
            <div className="text-sm font-semibold" data-testid="event-date">
              {formatDate(event.dateTime)}
            </div>
            <div className="text-xs" data-testid="event-time">
              {formatTime(event.dateTime)}
            </div>
          </div>

          {/* Online Badge */}
          {event.isOnline && (
            <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
              Online Event
            </Badge>
          )}
        </div>

        {/* Event Details */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Link href={`/events/${event.id}`}>
                <h3
                  className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary transition-colors"
                  data-testid="event-title"
                >
                  {event.title}
                </h3>
              </Link>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span data-testid="event-venue">
                    {event.venue.name}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span data-testid="event-datetime">
                    {formatDate(event.dateTime)} at {formatTime(event.dateTime)}
                  </span>
                </div>

                {event.venue.capacity && (
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span data-testid="event-capacity">
                      {event.venue.capacity} capacity
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-primary" data-testid="event-price">
                {getTicketPrice()}
              </div>
              {event.analytics?.ticketsSold && event.venue.capacity && (
                <div className="text-xs text-muted-foreground">
                  {event.analytics.ticketsSold} / {event.venue.capacity} sold
                </div>
              )}
            </div>
          </div>

          {/* Event Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid="event-description">
              {event.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link href={`/events/${event.id}`}>
              <Button className="flex-1 btn-primary" data-testid="buy-ticket-button">
                Buy Ticket
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onInterested}
              className="text-muted-foreground hover:text-primary border border-border hover:border-primary"
              data-testid="interested-button"
            >
              <Heart className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-muted-foreground hover:text-primary border border-border hover:border-primary"
              data-testid="share-event-button"
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>

          {/* Event Stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              {event.analytics?.viewCount && (
                <span data-testid="event-views">
                  {event.analytics.viewCount.toLocaleString()} views
                </span>
              )}
              {event.analytics?.interestedCount && (
                <span data-testid="event-interested">
                  {event.analytics.interestedCount.toLocaleString()} interested
                </span>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              <span data-testid="event-status">
                {event.status === 'published' ? 'Live' : event.status}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
