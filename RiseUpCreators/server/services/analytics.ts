import { storage } from '../storage';
import type { InsertAnalytics } from '@shared/schema';

export interface AnalyticsEvent {
  userId?: string;
  sessionId?: string;
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: any;
  page?: string;
  userAgent?: string;
  deviceType?: string;
  location?: any;
  referrer?: string;
}

export class AnalyticsService {
  async track(event: AnalyticsEvent): Promise<void> {
    try {
      const analyticsData: InsertAnalytics = {
        userId: event.userId,
        sessionId: event.sessionId,
        eventType: event.action,
        eventData: {
          action: event.action,
          category: event.category,
          label: event.label,
          value: event.value,
          metadata: event.metadata,
        },
        context: {
          page: event.page || '',
          userAgent: event.userAgent,
          deviceType: event.deviceType,
          location: event.location,
          referrer: event.referrer,
        },
      };

      await storage.trackEvent(analyticsData);
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  async trackPlay(songId: string, userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'play',
      category: 'music',
      label: songId,
      metadata: { songId },
    });
  }

  async trackLike(songId: string, userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'like',
      category: 'engagement',
      label: songId,
      metadata: { songId },
    });
  }

  async trackFollow(artistId: string, userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'follow',
      category: 'social',
      label: artistId,
      metadata: { artistId },
    });
  }

  async trackSubscribe(artistId: string, tier: string, userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'subscribe',
      category: 'monetization',
      label: artistId,
      metadata: { artistId, tier },
    });
  }

  async trackPurchase(orderId: string, totalAmount: number, userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'purchase',
      category: 'monetization',
      label: orderId,
      value: totalAmount,
      metadata: { orderId, totalAmount },
    });
  }

  async trackSearch(query: string, resultsCount: number, userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'search',
      category: 'discovery',
      label: query,
      value: resultsCount,
      metadata: { query, resultsCount },
    });
  }

  async trackPageView(page: string, userId?: string, sessionId?: string, metadata?: any): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'page_view',
      category: 'navigation',
      label: page,
      metadata: { page, ...metadata },
    });
  }

  async trackSignup(role: string, userId?: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'signup',
      category: 'auth',
      label: role,
      metadata: { role },
    });
  }

  async trackLogin(userId: string, sessionId?: string): Promise<void> {
    await this.track({
      userId,
      sessionId,
      action: 'login',
      category: 'auth',
      metadata: { userId },
    });
  }

  async getPlayStats(songId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const analytics = await storage.getAnalytics({
      eventType: 'play',
      startDate,
      endDate,
    });

    return analytics.filter(a => a.eventData.metadata?.songId === songId);
  }

  async getUserEngagement(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const analytics = await storage.getAnalytics({
      userId,
      startDate,
      endDate,
    });

    const engagement = {
      totalActions: analytics.length,
      playCount: 0,
      likeCount: 0,
      followCount: 0,
      subscriptionCount: 0,
      purchaseCount: 0,
      searchCount: 0,
    };

    analytics.forEach(event => {
      switch (event.eventType) {
        case 'play':
          engagement.playCount++;
          break;
        case 'like':
          engagement.likeCount++;
          break;
        case 'follow':
          engagement.followCount++;
          break;
        case 'subscribe':
          engagement.subscriptionCount++;
          break;
        case 'purchase':
          engagement.purchaseCount++;
          break;
        case 'search':
          engagement.searchCount++;
          break;
      }
    });

    return engagement;
  }

  async getPopularContent(type: 'songs' | 'artists', limit = 10, startDate?: Date, endDate?: Date): Promise<any[]> {
    const analytics = await storage.getAnalytics({
      eventType: type === 'songs' ? 'play' : 'follow',
      startDate,
      endDate,
    });

    const contentCounts = new Map();

    analytics.forEach(event => {
      const contentId = type === 'songs' 
        ? event.eventData.metadata?.songId 
        : event.eventData.metadata?.artistId;
      
      if (contentId) {
        contentCounts.set(contentId, (contentCounts.get(contentId) || 0) + 1);
      }
    });

    return Array.from(contentCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({ id, count }));
  }

  async getDashboardStats(userId?: string, isArtist = false): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (isArtist) {
      // Get artist-specific stats
      const analytics = await storage.getAnalytics({
        startDate: thirtyDaysAgo,
        endDate: now,
      });

      // Filter analytics for content owned by this artist
      // This would require additional metadata to link plays to artist ownership
      return {
        totalPlays: analytics.filter(a => a.eventType === 'play').length,
        totalLikes: analytics.filter(a => a.eventType === 'like').length,
        totalFollows: analytics.filter(a => a.eventType === 'follow').length,
        totalSubscriptions: analytics.filter(a => a.eventType === 'subscribe').length,
        weeklyGrowth: {
          plays: analytics.filter(a => 
            a.eventType === 'play' && 
            new Date(a.timestamp!) >= sevenDaysAgo
          ).length,
          follows: analytics.filter(a => 
            a.eventType === 'follow' && 
            new Date(a.timestamp!) >= sevenDaysAgo
          ).length,
        },
      };
    } else {
      // Get fan-specific stats
      const analytics = await storage.getAnalytics({
        userId,
        startDate: thirtyDaysAgo,
        endDate: now,
      });

      return {
        totalPlays: analytics.filter(a => a.eventType === 'play').length,
        totalLikes: analytics.filter(a => a.eventType === 'like').length,
        totalFollows: analytics.filter(a => a.eventType === 'follow').length,
        totalPurchases: analytics.filter(a => a.eventType === 'purchase').length,
        weeklyActivity: analytics.filter(a => new Date(a.timestamp!) >= sevenDaysAgo).length,
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
