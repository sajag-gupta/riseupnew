
import { storage } from "../storage";
import { InsertAnalytics } from "@shared/schema";

export class AnalyticsService {
  // Track song play
  static async trackSongPlay(userId: string, songId: string, context: string = "player") {
    try {
      await storage.logAnalytics({
        userId,
        songId,
        action: "play",
        context: context as any,
        metadata: {
          timestamp: new Date().toISOString(),
          sessionId: `session_${userId}_${Date.now()}`
        }
      });

      // Update song play count
      const song = await storage.getSong(songId);
      if (song) {
        await storage.updateSong(songId, {
          plays: song.plays + 1,
          uniqueListeners: song.uniqueListeners + 1
        });

        // Update artist stats
        const artist = await storage.getArtistByUserId(song.artistId);
        if (artist && artist.artist) {
          await storage.updateUser(song.artistId, {
            artist: {
              ...artist.artist,
              totalPlays: artist.artist.totalPlays + 1
            }
          });
        }
      }
    } catch (error) {
      console.error("Error tracking song play:", error);
    }
  }

  // Track song like/unlike
  static async trackSongLike(userId: string, songId: string, isLiked: boolean, context: string = "player") {
    try {
      await storage.logAnalytics({
        userId,
        songId,
        action: "like",
        context: context as any,
        metadata: {
          liked: isLiked,
          timestamp: new Date().toISOString()
        }
      });

      // Update song likes count
      const song = await storage.getSong(songId);
      if (song) {
        await storage.updateSong(songId, {
          likes: isLiked ? song.likes + 1 : Math.max(0, song.likes - 1)
        });

        // Update artist stats
        const artist = await storage.getArtistByUserId(song.artistId);
        if (artist && artist.artist) {
          await storage.updateUser(song.artistId, {
            artist: {
              ...artist.artist,
              totalLikes: isLiked ? artist.artist.totalLikes + 1 : Math.max(0, artist.artist.totalLikes - 1)
            }
          });
        }
      }
    } catch (error) {
      console.error("Error tracking song like:", error);
    }
  }

  // Track artist follow/unfollow
  static async trackArtistFollow(userId: string, artistId: string, isFollowing: boolean, context: string = "profile") {
    try {
      await storage.logAnalytics({
        userId,
        artistId,
        action: isFollowing ? "follow" : "unfollow",
        context: context as any,
        metadata: {
          following: isFollowing,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error tracking artist follow:", error);
    }
  }

  // Track purchase
  static async trackPurchase(userId: string, orderId: string, amount: number, type: string, context: string = "cart") {
    try {
      await storage.logAnalytics({
        userId,
        action: "purchase",
        context: context as any,
        value: amount,
        metadata: {
          orderId,
          type,
          amount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error tracking purchase:", error);
    }
  }

  // Track search
  static async trackSearch(userId: string, query: string, results: number, context: string = "discover") {
    try {
      await storage.logAnalytics({
        userId,
        action: "search",
        context: context as any,
        value: results,
        metadata: {
          query,
          resultsCount: results,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error tracking search:", error);
    }
  }

  // Track page view
  static async trackPageView(userId: string, page: string, metadata: any = {}) {
    try {
      await storage.logAnalytics({
        userId,
        action: "view",
        context: "home",
        metadata: {
          page,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error tracking page view:", error);
    }
  }

  // Get user analytics
  static async getUserAnalytics(userId: string, days: number = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const analytics = await storage.db.collection("analytics").find({
        userId,
        timestamp: { $gte: startDate }
      }).toArray();

      const plays = analytics.filter(a => a.action === "play").length;
      const likes = analytics.filter(a => a.action === "like").length;
      const searches = analytics.filter(a => a.action === "search").length;
      const follows = analytics.filter(a => a.action === "follow").length;

      return {
        totalPlays: plays,
        totalLikes: likes,
        totalSearches: searches,
        totalFollows: follows,
        totalActions: analytics.length
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      return null;
    }
  }

  // Get artist analytics
  static async getArtistAnalytics(artistId: string, days: number = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const analytics = await storage.db.collection("analytics").find({
        artistId,
        timestamp: { $gte: startDate }
      }).toArray();

      const plays = analytics.filter(a => a.action === "play").length;
      const likes = analytics.filter(a => a.action === "like").length;
      const follows = analytics.filter(a => a.action === "follow").length;
      const views = analytics.filter(a => a.action === "view").length;

      return {
        totalPlays: plays,
        totalLikes: likes,
        totalFollows: follows,
        totalViews: views,
        totalInteractions: analytics.length
      };
    } catch (error) {
      console.error("Error getting artist analytics:", error);
      return null;
    }
  }
}

export default AnalyticsService;
