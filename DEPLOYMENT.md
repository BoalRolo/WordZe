# WordZe Deployment Guide

This guide will help you deploy WordZe to GitHub and set up GitHub Pages hosting.

## Prerequisites

- GitHub account
- Git installed on your machine
- Node.js and npm installed
- Firebase project set up

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository `WordZe` (or any name you prefer)
5. Make it **Public** (required for free GitHub Pages)
6. Don't initialize with README (we already have one)
7. Click "Create repository"

## Step 2: Push Your Code to GitHub

Run these commands in your project directory:

```bash
# Add all files to git
git add .

# Commit your changes
git commit -m "Initial commit: WordZe vocabulary trainer"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/WordZe.git

# Push to GitHub
git push -u origin main
```

## Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. The deployment workflow will automatically trigger

## Step 4: Set Up Environment Variables (Important!)

Since your `.env` file is in `.gitignore`, you need to set up environment variables in GitHub:

1. Go to your repository **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret** for each environment variable:

```
VITE_FIREBASE_API_KEY = your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN = your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = your_project_id
VITE_FIREBASE_STORAGE_BUCKET = your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
VITE_FIREBASE_APP_ID = your_app_id
```

## Step 5: Update Firebase Configuration

You need to add your GitHub Pages domain to Firebase Auth:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your GitHub Pages domain: `YOUR_USERNAME.github.io`

## Step 6: Monitor Deployment

1. Go to **Actions** tab in your GitHub repository
2. You should see the "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (usually takes 2-3 minutes)
4. Once complete, your site will be available at:
   `https://YOUR_USERNAME.github.io/WordZe/`

## Step 7: Test Your Deployment

1. Visit your GitHub Pages URL
2. Test user registration and login
3. Verify all features work correctly
4. Check that Firebase connection is working

## Troubleshooting

### Build Fails
- Check the **Actions** tab for error details
- Ensure all environment variables are set correctly
- Verify your Firebase configuration

### Authentication Issues
- Make sure your GitHub Pages domain is added to Firebase Auth
- Check that environment variables are correctly set in GitHub Secrets

### 404 Errors
- Verify the `base` path in `vite.config.ts` matches your repository name
- Check that the deployment workflow completed successfully

### Firebase Connection Issues
- Verify all Firebase environment variables are set
- Check Firebase console for any errors
- Ensure Firestore rules allow your domain

## Custom Domain (Optional)

To use a custom domain:

1. In your repository **Settings** → **Pages**
2. Add your custom domain in the **Custom domain** field
3. Follow GitHub's instructions to configure DNS
4. Add your custom domain to Firebase Auth authorized domains

## Automatic Updates

Every time you push to the `main` branch, GitHub Actions will automatically:
1. Build your project
2. Deploy to GitHub Pages
3. Update your live site

## Local Development

For local development, your app will use `/` as the base path, but in production it will use `/WordZe/` (or your repository name). This is automatically handled by the Vite configuration.

## Support

If you encounter any issues:
1. Check the GitHub Actions logs
2. Verify your Firebase configuration
3. Ensure all environment variables are set
4. Check the browser console for errors

Your WordZe app should now be live and accessible to users worldwide! 🚀
