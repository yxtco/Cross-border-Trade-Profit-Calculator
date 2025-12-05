# Orange Cloud Deployment Guide

This guide explains how to deploy the Cross-Border Trade Profit Calculator application using Orange Cloud services.

## Project Structure

```
.
├── deploy/
├── img/
│   ├── zh/
│   └── en/
├── pages/
├── worker/
├── ORANGE_CLOUD_DEPLOYMENT.md
├── README.md
└── README_EN.md
```

## Prerequisites

1. Orange Cloud account
2. Fixer API Key from https://apilayer.com/marketplace/fixer-api
3. Basic understanding of cloud deployment concepts
4. Node.js (version 14 or higher)
5. Git (optional, for version control)

## Deployment Steps

### 1. Frontend Deployment

1. Navigate to the `pages` directory in your project
2. Package all files in this directory for deployment
3. Upload the packaged files to your Orange Cloud static hosting service
4. Configure your domain settings in the Orange Cloud dashboard
5. Ensure the `img` directory and its subdirectories (`zh` and `en`) are included in the deployment for image assets

### 2. Backend Deployment

1. Navigate to the `worker` directory in your project
2. Update the `wrangler.toml` file with your Fixer API Key:
   ```toml
   [vars]
   FIXER_API_KEY = "your_actual_api_key_here"
   ```
3. Deploy the Worker using the Orange Cloud CLI or dashboard:
   ```bash
   orange-cloud deploy
   ```
4. Note the deployed Worker URL for use in the frontend configuration

### 3. KV Storage Setup

1. Create a new KV namespace in your Orange Cloud dashboard
2. Update the `wrangler.toml` file with your KV namespace ID:
   ```toml
   [[kv_namespaces]]
   binding = "PROFIT_CALC_KV"
   id = "your_kv_namespace_id_here"
   ```
3. Configure the KV bindings in your Worker settings

### 4. Frontend Configuration

1. Update the `WORKER_URL` constant in `pages/script.js` with your deployed Worker URL:
   ```javascript
   const CONFIG = {
       WORKER_URL: "https://your-worker-url.orange-cloud.com",
       // ... other configuration
   };
   ```
2. Redeploy the frontend with the updated configuration

## Image Resources

The application includes image resources for both Chinese and English interfaces:

- Chinese images: Located in the `img/zh/` directory
- English images: Located in the `img/en/` directory

Ensure both directories are deployed with your application for proper display of screenshots and visual aids.

## Environment Variables

The following environment variables need to be configured:

- `FIXER_API_KEY`: Your Fixer API key for exchange rate data
- `API_KEY`: Fixed API key for authenticating KV operations (default provided)

## Monitoring and Maintenance

1. Monitor your Worker logs through the Orange Cloud dashboard
2. Check KV storage usage and performance metrics
3. Update the Fixer API key when it expires
4. Review and optimize resource usage periodically

## Troubleshooting

### Common Issues

1. **Exchange Rate Not Updating**
   - Verify your Fixer API key is correct and active
   - Check Worker logs for API call errors
   - Ensure the scheduled task is properly configured

2. **KV Storage Not Working**
   - Confirm KV namespace ID is correct
   - Check Worker permissions for KV access
   - Verify billing status for KV usage

3. **Frontend Not Loading**
   - Check static file deployment status
   - Verify Worker URL configuration in frontend
   - Confirm CORS settings are properly configured

### Support

For assistance with Orange Cloud deployment, contact:
- Orange Cloud Support: support@orange-cloud.com
- Documentation: https://docs.orange-cloud.com/deployment