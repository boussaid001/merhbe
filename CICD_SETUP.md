# CI/CD Setup Instructions

This document explains how to set up the CI/CD pipeline for automatic deployment to your VPS.

## GitHub Secrets Setup

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Name: `SSH_PRIVATE_KEY`
6. Value: Copy and paste the entire content of the `github-deploy-key` file, including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines
7. Click "Add secret"

## How It Works

When you push to the `main` branch, the GitHub Actions workflow will:

1. Check out your code
2. Set up SSH with the private key from GitHub secrets
3. Connect to your VPS (4.178.188.9)
4. Pull the latest code from the main branch
5. Install dependencies and build the frontend
6. Restart the backend server using PM2
7. Restart Nginx

## Testing the Pipeline

After setting up the GitHub secret, make a small change to your code, commit it, and push to the main branch. The GitHub Actions workflow should automatically deploy your changes to the VPS.

## Troubleshooting

If the deployment fails:

1. Check the GitHub Actions logs for error messages
2. Verify that the SSH key is correctly set up
3. Ensure the amine user has the necessary permissions on the VPS
4. Check if the repository URL in the VPS is correctly configured

## Manual Deployment

If you need to deploy manually, you can run these commands:

```bash
ssh amine@4.178.188.9 'cd ~/website && git pull origin main'
ssh amine@4.178.188.9 'cd ~/website/video-chat-app && npm install --legacy-peer-deps && npm run build'
ssh amine@4.178.188.9 'cd ~/website/backend && npm install'
ssh amine@4.178.188.9 'pm2 restart backend || cd ~/website/backend && pm2 start npm --name "backend" -- run dev'
ssh amine@4.178.188.9 'sudo systemctl restart nginx'
``` 