# Deployment Guide

This project consists of two parts:

1. **Frontend**: A React/Vite application (in the root directory).
2. **Backend**: An Express.js server (in the `server` directory).

## 1. Deploying the Backend to Render

1. **Create a Render Service**:
    - Log in to [Render.com](https://render.com/).
    - Click **New** -> **Web Service**.
    - Connect your GitHub repository (`rasali535/brastorne`).

2. **Configure the Web Service**:
    - **Name**: `brastorne-backend`
    - **Root Directory**: `server`
    - **Environment**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`

3. **Set Environment Variables**:
    - Go to **Environment** tab and add:
        - `SUPABASE_URL`: Your Supabase Project URL.
        - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key.
        - `GEMINI_API_KEY`: Your Google Gemini API Key.
        - `PORT`: `10000` (Render's default)

4. **Deploy**:
    - Render will automatically deploy from the `main` branch.
    - Once successful, copy the service URL (e.g., `https://brastorne-backend.onrender.com`).

## 2. Deploying the Frontend to Hostinger

1. **Prepare for Production**:
    - Open your local `.env` file (or create one for production if using CI/CD).
    - Add the **Backend URL** you got from Railway:

      ```env
      VITE_API_URL=https://brastorne.onrender.com
      VITE_USE_EDGE_FUNCTION=false
      ```

    - Ensure your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are also set if the frontend needs direct access (though `useChat` mainly uses the backend now).

2. **Build the Project**:
    - Run the build command in your terminal:

      ```bash
      npm run build
      ```

    - This will create a `dist` folder in the project root containing the optimized static files.

3. **Upload to Hostinger**:
    - Log in to your Hostinger hPanel.
    - Go to **File Manager** -> **public_html**.
    - Upload the **contents** of the `dist` folder (index.html, assets folder, etc.) to `public_html`.
    - Ensure `index.html` is in the root of `public_html`.

4. **Verify**:
    - Visit your website URL.
    - The chat widget should now connect to your Render backend to fetch answers!

## Troubleshooting

- **CORS Issues**: If the frontend says "Network Error" or "CORS", ensure the Backend is running and allows requests from your Hostinger domain.
  - In `server/server.js`, `app.use(cors())` allows all origins by default. For stricter security, you can configure it to only allow your Hostinger domain.
- **Environment Variables**: Ensure `VITE_API_URL` does NOT have a trailing slash (e.g. `.../app`, not `.../app/`). The code appends `/api/chat`.
