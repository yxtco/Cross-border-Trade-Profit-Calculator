# Cross-Border Trade Profit Calculator

A comprehensive web application for calculating profits in cross-border e-commerce, featuring real-time exchange rates, cost calculations, and data persistence.

## Features

- Real-time USD/CNY exchange rate fetching
- Comprehensive cost calculation including shipping, warehousing, and platform fees
- Data persistence with local storage and Cloudflare KV
- Responsive design for desktop and mobile devices
- Export functionality to Excel and PDF formats
- Data sharing capabilities

## Interface Preview

Below are screenshots of our application interface:

<div align="center">
  <figure>
    <img src="img/zh/ScreenShot_2025-12-05_102122_219.png" alt="Profit Calculation Interface Example 1" width="45%" />
    <figcaption>Profit Calculation Interface Example 1</figcaption>
  </figure>
  
  <figure>
    <img src="img/zh/ScreenShot_2025-12-05_102154_108.png" alt="Profit Calculation Interface Example 2" width="45%" />
    <figcaption>Profit Calculation Interface Example 2</figcaption>
  </figure>
</div>

## Project Structure

```
.
├── deploy/
├── img/
│   ├── zh/  (Chinese interface screenshots)
│   └── en/  (English interface screenshots)
├── pages/  (Frontend pages)
├── worker/  (Backend Worker)
├── ORANGE_CLOUD_DEPLOYMENT.md  (Orange Cloud deployment guide)
├── DEPLOYMENT_INSTRUCTIONS.md  (Detailed deployment instructions)
├── README.md  (Main documentation in Chinese and English)
└── README_EN.md  (This document)
```

## Architecture

The application consists of two main components:

1. **Frontend**: Static HTML/CSS/JavaScript application
2. **Backend**: Cloudflare Worker handling API proxy and KV storage

## Quick Start

### Prerequisites

1. Cloudflare account: https://dash.cloudflare.com/
2. Fixer API Key: https://apilayer.com/marketplace/fixer-api
3. Node.js and Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login # Login to your Cloudflare account
   ```

### Local Development

```bash
# Run Cloudflare Worker locally
cd worker
wrangler dev

# Or use npm scripts
npm run dev
```

## Deploy to Orange Cloud

Please refer to [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) for detailed deployment instructions in Chinese and English.

## Testing KV Functionality

After running the Worker in local development mode, you can test KV functionality with the provided test script:

```bash
node test_kv.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.