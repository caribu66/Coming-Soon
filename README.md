<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5593aac4-5cbd-4c1f-a108-5a2143706c97

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VERUS_RPC_URL` in [.env.local](.env.local) if your verusd testnet RPC is not on `http://127.0.0.1:27486`
3. Optionally set `VERUS_RPC_USER` and `VERUS_RPC_PASSWORD` if your RPC requires auth
4. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
5. Run the app:
   `npm run dev`

The coming-soon subscription now accepts VerusID / i-address entries and queues Verus-native alerts through the local backend.
