# Cross-Border Trade Profit Calculator

A comprehensive web application for calculating profits in cross-border e-commerce, featuring real-time exchange rates, cost calculations, and data persistence.

![Profit Calculator Screenshot](img/en/calculator.png)

## Features

- Real-time USD/CNY exchange rate fetching
- Comprehensive cost calculation including shipping, warehousing, and platform fees
- Data persistence with local storage and Cloudflare KV
- Responsive design for desktop and mobile devices
- Export functionality to Excel and PDF formats
- Data sharing capabilities

## Architecture

The application consists of two main components:

1. **Frontend**: Static HTML/CSS/JavaScript application hosted on Cloudflare Pages
2. **Backend**: Cloudflare Worker handling API proxy and KV storage

## Prerequisites

1. Cloudflare account: https://dash.cloudflare.com/
2. Fixer API Key: https://apilayer.com/marketplace/fixer-api
3. Node.js and Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login # Login to your Cloudflare account
   ```

## Deployment

### Cloudflare Deployment

1. Update `worker/wrangler.toml` with your `FIXER_API_KEY`
2. The project is configured with KV namespace binding. Modify the ID in `worker/wrangler.toml` if needed
3. Run the deployment script:
   - Windows: Double-click `deploy.bat`
   - Mac/Linux: Execute `./deploy.sh` in terminal
4. After deployment, update `WORKER_URL` in `pages/script.js` with your Worker domain
5. Deploy the `pages` directory to Cloudflare Pages or any static hosting service

### Orange Cloud Deployment

To deploy using Orange Cloud services:

1. Package the frontend files from the `pages` directory
2. Configure the backend Worker in the Orange Cloud dashboard
3. Set up the KV storage namespace for data persistence
4. Update API endpoints in the frontend configuration

## Local Development

```bash
# Run local Python application
python main.py

# Run Cloudflare Worker locally
cd worker
wrangler dev

# Or use npm scripts
npm run dev
```

## Testing KV Functionality

After running the Worker in local development mode, you can test KV functionality with the provided test script:

```bash
node test_kv.js
```

## Screenshots

![Input Form](img/en/input.png)
*Input form with various cost parameters*

![Results Display](img/en/results.png)
*Detailed profit calculation results*

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.