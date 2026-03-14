# Linky 📱✨

Linky is a highly optimized, immersive, TikTok-style infinite scrolling video feed built with Next.js and React. It serves personalized, short-form video content fetched dynamically via third-party APIs, focusing heavily on delivering a native-app-like experience directly in the mobile web browser.

## 🎯 Project Goals

The primary goals of this project are to solve the common UX and performance hurdles associated with web-based video feeds:
1. **Buttery-Smooth Scrolling:** Achieve native-level swipe performance by decoupling heavy DOM updates from React state using `requestAnimationFrame`.
2. **Aggressive Memory Management:** Prevent browser crashes on low-end mobile devices by dynamically mounting and unmounting video `src` attributes based on their proximity to the viewport.
3. **Graceful Autoplay Handling:** Circumvent strict mobile browser autoplay policies natively, falling back to a clean "Tap to Play" UI without throwing unhandled exceptions or `NotSupportedError`s.
4. **Smart Content Curation:** Deliver high-quality feeds by utilizing a custom ranking algorithm that weighs view-to-like ratios rather than just fetching random chronological content.

## 🚀 Key Features

* **Dynamic Onboarding:** Users start by selecting their gender, which dynamically generates a 3x3 grid of the top trending "vibes" (tags) for them to choose from.
* **Infinite Vertical Feed:** Seamless snap-scrolling video feed with automatic pagination and fetching.
* **Insta-Style Video Player:** Automatically detects non-9:16 aspect ratios (like horizontal or square videos/pics) and renders a blurred, scaled-up background layer behind the media to keep the UI immersive.
* **Global Mute State:** Unmuting one video unmutes the entire feed, matching expected user behavior.
* **Double-Tap to Like:** Native-feeling double-tap interactions with a popping heart animation.
* **Smart Caching:** Bypasses aggressive Next.js App Router caching (`force-dynamic`, `no-store`) to guarantee users get a fresh feed of videos every time they change their tags.

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router, API Routes)
* **Library:** [React](https://react.dev/) (Strict reliance on Hooks and DOM Refs)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Data Source:** RedGIFs v2 API (authenticated dynamically via temporary tokens)

## 🧠 Architecture Highlights

### The Video Player (`VideoPlayer.tsx`)
Unlike traditional web players, Linky does not use the `IntersectionObserver` to directly force `.play()` or `.pause()`. Instead, the parent `FeedClient` tracks scroll position and passes an `isActive` and `shouldLoad` prop down. 
* `shouldLoad`: Ensures only the video you are watching, plus the 2 videos above and below it, have a `src` attribute. The rest are completely purged from RAM.
* `isActive`: Guarantees that the video element is perfectly synced with the scroll snap, completely eliminating race conditions.

### The Custom Fetcher (`customFetch.ts`)
* **Tag Forcing:** Ensures that when a user selects a specific tag (e.g., "model"), that tag is forcibly shifted to index `0` of the video's tag array so it always renders first in the UI, even if the API buried it.
* **Quality Scoring:** Instead of just trusting the API's `trending` sort, we run a custom logarithmic math function (`calculateQualityScore`) against the views and likes to rank the fetched batch before it hits the UI.

## 💻 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/linky.git](https://github.com/yourusername/linky.git)
   cd linky
Install dependencies:

Bash
npm install
Start the development server:

Bash
npm run dev
Open http://localhost:3000 in your browser. Use the mobile inspector in Chrome DevTools for the best experience.

📂 Project Structure
Plaintext
linky/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tags/route.ts      # Generates dynamic onboarding tags
│   │   │   └── videos/route.ts    # Fetches infinite feed batches
│   │   ├── layout.tsx
│   │   └── page.tsx               # Entry point
│   ├── components/
│   │   ├── AppShell.tsx           # Manages state between Onboarding and Feed
│   │   ├── OnboardingScreen.tsx   # Initial user setup
│   │   ├── FeedClient.tsx         # Virtualized scroll container
│   │   └── VideoPlayer.tsx        # Memory-safe HTML5 video component
│   └── lib/
│       └── customFetch.ts         # Core logic, API wrappers, and ranking math
└── public/
