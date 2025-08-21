# Rise Up Creators - Music Platform

## Project Overview
Rise Up Creators (RUC) is a comprehensive Web2 music platform combining:
- Spotify-like streaming (artist uploads only)
- Patreon-like subscriptions & gated content
- Bandcamp-like merchandise sales
- Eventbrite-like event ticketing
- Personalized home feeds
- Ad monetization with premium ad-free tier
- Complete admin tooling & analytics

## Tech Stack
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Node.js + Express
- Database: MongoDB Atlas (Mongoose)
- Payments: Razorpay
- Media: Cloudinary
- Email: SMTP
- Auth: JWT + Session cookies

## User Roles
- **Fan**: Stream, follow, subscribe, buy merch/tickets, playlists
- **Artist**: All fan features + upload music, create events/merch/blogs, analytics
- **Admin**: Verify artists, moderate content, manage ads, transactions

## Design Theme
Dark theme with red gradient accents (#FF3C2A → #7A0C0C), balanced with subtle grays and proper contrast. Background video animations for dynamic feel.

## Key Features Implemented
- Authentication (email/password + Google OAuth)
- Music streaming with persistent player
- Artist/fan subscriptions with gated content
- Merchandise store with cart/checkout
- Event ticketing with QR codes
- Admin panel with full management
- Analytics tracking
- Ad system with targeting
- Email notifications
- Trending algorithms
- Personalized recommendations

## Database Models
Complete MongoDB schemas for User, ArtistProfile, Song, Merch, Event, Order, Subscription, Ads, Analytics with proper relationships.

## Recent Changes
- Initial project setup with comprehensive specification implementation
- Date: Current session