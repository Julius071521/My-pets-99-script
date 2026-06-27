# ApexBoost - Premium Social Media Marketing (SMM) Boosting Panel

ApexBoost is a premium, high-fidelity, and feature-rich full-stack SMM boosting website designed with modern aesthetics (neon gradients, glassmorphism, responsive grids, custom dark/light theme, and dynamic micro-animations). 

It acts as a secure intermediary dashboard that connects your clients to a server-side **provider API (v2)** without exposing private credentials directly inside the browser.

---

## Key Features

1. **Aesthetic Masterclass Frontend:** 
   - Google Fonts ("Outfit" for premium titles, "Inter" for UI body typography).
   - Fluid dashboard layout utilizing CSS Variables for seamless **Dark Mode / Light Mode** transitions.
   - Glassmorphic panels, animated glowing borders, hover scales, and responsive design fitting mobile, tablet, and desktop screens.
2. **Dual-Mode Express Backend Proxy:**
   - **Explicit Demo Mode:** When `DEMO_MODE=true`, the application can operate in an offline sandbox for UI testing.
   - **Live Provider Mode:** Securely forwards commands (`services`, `add`, `status`, `refill`, `refill_status`, `balance`) through the server-only provider configuration.
3. **Interactive Tools:**
   - **Dynamic Cost Calculator:** Calculates transaction charges in real-time as users type order quantities, checking limits and highlight errors if their account balance is too low.
   - **Developer API Panel:** Houses developer-friendly tabs displaying preformatted integration code blocks (cURL, Node.js fetch, Python requests) so others can resell *your* panel!
   - **LocalStorage Order Memory:** Saved orders persist locally in the client browser, maintaining full historic context.

---

## Technical Project Directory Structure

```
smm-boosting-website/
├── public/                 # Static Frontend Files
│   ├── index.html          # Main SPA Markup & Layout structure
│   ├── style.css           # Custom visual theme styling variables & rules
│   └── app.js              # State engine, view routing, calculations, API syncs
├── .env.example            # Sample configuration parameters
├── package.json            # Node project definitions & script triggers
├── server.js               # Node Express Proxy & Mock Engine core script
└── README.md               # User manual and deployment instructions
```

---

## Quick Start Guide

To run this application locally, ensure you have **Node.js (version 18.0.0 or higher)** installed, then follow these simple steps:

### 1. Configure the Active Workspace
Open a terminal in your workspace and navigate to the project directory:
```bash
cd smm-boosting-website
```

### 2. Install Project Dependencies
Run npm install inside the project directory:
```bash
npm install
```
This automatically installs:
- `express` (routing server)
- `cors` (cross-origin resource sharing utilities)
- `dotenv` (environment variables manager)

### 3. Setup Credentials (Optional - For Live Mode)
Create a `.env` file by duplicating the template:
```bash
cp .env.example .env
```
Open the newly created `.env` file and insert your provider credentials:
```env
PORT=3000
PUBLIC_SITE_URL=https://apexsmmboosting.com
PUBLIC_API_BASE_URL=https://apexsmmboosting.com/api/v2
PROVIDER_API_URL=https://your-provider.example/api/v2
PROVIDER_API_KEY=your_provider_secret_key_here
```
*Note: Production should use a real provider configuration. Enable demo mode only intentionally with `DEMO_MODE=true`.*

### 4. Boot Up the Server
Launch the local web server:
```bash
npm run dev
```

The terminal will print confirmation details. In production, the public API base URL is:
👉 **[https://apexsmmboosting.com/api/v2](https://apexsmmboosting.com/api/v2)**

---

## Developer Guide - Testing API Actions
When ApexBoost is running, developers can test SMM actions using standard API tools:

### Place a Mock/Live Order via cURL
```bash
curl -X POST https://apexsmmboosting.com/api/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "service": 101,
    "url": "https://instagram.com/p/creative_post",
    "quantity": 500,
    "mode": "demo"
  }'
```

### Check Balances via cURL
```bash
curl -X POST https://apexsmmboosting.com/api/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "balance",
    "mode": "demo"
  }'
```
