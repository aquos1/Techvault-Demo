# Statsig E-commerce Demo

A minimal e-commerce demo site built with Next.js 14 and designed for A/B testing with Statsig. This demo showcases CTA button variants and comprehensive event logging for "Predicted vs Actual" analysis.

## Features

- **A/B Testing**: CTA button variants (X: "Add to Cart" vs Y: "Try It Now")
- **Event Logging**: page_view, add_to_cart, checkout_start, purchase
- **Synthetic Traffic**: Automated traffic generation for testing
- **Statsig Ready**: Designed for easy Statsig integration
- **Responsive Design**: Mobile-first with Tailwind CSS

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create `.env.local` file:

```env
NEXT_PUBLIC_STATSIG_CLIENT_KEY=statsig-client-***
NEXT_PUBLIC_STATSIG_TIER=development
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the demo.

## Statsig Configuration

### 1. Create Experiment

In your Statsig dashboard, create an experiment with:

- **Key**: `cta_button_test`
- **Variants**: 
  - `X`: Standard "Add to Cart" button
  - `Y`: "Try It Now" with follow-up panel

### 2. Event Schema

The demo logs these events:

| Event Name | Value | Metadata |
|------------|-------|----------|
| `page_view` | page name | `{ page, product_id?, user_id, country, device }` |
| `add_to_cart` | price | `{ product_id, product_name, price, variant, user_id, country, device }` |
| `checkout_start` | total | `{ total, item_count, items[], user_id, country, device }` |
| `purchase` | total | `{ order_id, total, item_count, items[], user_id, country, device }` |
| `action_click` | action | `{ action, location, product_id?, variant?, user_id, country, device }` |

## Traffic Generator

Generate synthetic traffic for testing:

### 1. Setup Environment

Create `.env.traffic.local` file:

```env
STATSIG_SERVER_SECRET=statsig-server-***
TRAFFIC_BASE_URL=http://localhost:3000
```

### 2. Run Traffic Generator

```bash
# Generate 100 users with 5 actions each
npm run traffic -- --users=100 --actions=5

# Generate 300 users with 8 actions each
npm run traffic -- --users=300 --actions=8
```

The script will:
- Create synthetic users with realistic geo distribution
- Simulate user journeys (browse → add to cart → checkout → purchase)
- Match client-side experiment assignment
- Log events with variant metadata for analysis

## Project Structure

```
statsig-demo/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx               # Home page (product grid)
│   │   ├── product/[id]/page.tsx   # Product detail page
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── Header.tsx              # Navigation with cart
│   │   ├── ProductCard.tsx         # Product display
│   │   ├── VariantCTA.tsx          # A/B tested CTA button
│   │   └── CartDrawer.tsx          # Shopping cart sidebar
│   ├── lib/
│   │   ├── statsigClient.ts        # Statsig client wrapper
│   │   └── analytics.ts            # Event logging helpers
│   └── data/
│       └── products.json           # Product catalog
├── scripts/
│   └── generateTraffic.ts          # Synthetic traffic generator
└── README.md
```

## A/B Testing Implementation

### Variant X: Standard CTA
- Single "Add to Cart" button
- Primary blue styling
- Direct add to cart action

### Variant Y: Enhanced CTA
- "Try It Now" primary button (larger, green)
- Follow-up panel with pitch text
- Secondary "Add to Cart" button appears after click

### Experiment Assignment
- Consistent per user (based on user ID hash)
- Graceful fallback to variant X on errors
- Anonymous user IDs (no persistence)

## Event Tracking

### Page Views
- **Home**: Logged on homepage load
- **Product**: Logged on product detail pages with product_id

### User Actions
- **CTA Clicks**: Tracked with variant and location metadata
- **Add to Cart**: Includes product details and variant
- **Checkout**: Includes cart contents and totals
- **Purchase**: Includes order details and final totals

### Metadata Consistency
All events include:
- `user_id`: Anonymous identifier
- `country`: Geographic location
- `device`: web/mobile_web
- `variant`: A/B test assignment
- `timestamp`: Event timing

## Forge Agent Integration

This demo is designed to work seamlessly with the Forge agent for "Predicted vs Actual" analysis:

1. **Event Emission**: The demo emits all necessary events with proper metadata
2. **Experiment Assignment**: Consistent variant assignment per user
3. **Traffic Generation**: Synthetic traffic matches real user behavior
4. **API Ready**: Statsig API integration ready for Forge agent consumption

The Forge app will create experiments via the Statsig API and read results for comparison with predictions. This demo only emits events and consumes experiments on the client side, providing a complete testing environment.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run traffic` - Generate synthetic traffic

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **A/B Testing**: Statsig (client + server SDKs)
- **Traffic Generation**: Node.js with tsx

## Security Notes

- Server secrets are never exposed to client bundles
- Environment variables properly scoped (NEXT_PUBLIC_* for client)
- Traffic generator uses separate environment file
- Anonymous user tracking (no PII)

## Troubleshooting

### Common Issues

1. **Statsig not loading**: Check client key in `.env.local`
2. **Events not logging**: Verify Statsig initialization
3. **Traffic generator fails**: Check server secret in `.env.traffic.local`
4. **Build errors**: Ensure all dependencies installed with `npm install`

### Error Handling

The demo includes graceful error handling:
- Falls back to variant X if experiment fails
- Continues operation if Statsig is unavailable
- Logs errors to console for debugging
- Maintains functionality without external dependencies
