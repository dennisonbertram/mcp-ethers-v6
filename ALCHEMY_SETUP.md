# Setting Up Your Alchemy API Key

This guide will help you properly set up an Alchemy API key for the MCP Ethers Server.

## 1. Create an Alchemy Account

If you don't already have an Alchemy account:

1. Go to [Alchemy's website](https://www.alchemy.com/)
2. Click "Sign Up" or "Get Started for Free"
3. Complete the registration process

## 2. Create a New Application

After signing in to your Alchemy dashboard:

1. Click on "Create App" button
2. Fill in the required details:
   - **Name**: Give your app a name (e.g., "MCP Ethers Server")
   - **Description**: Optional description
   - **Chain**: Select "Ethereum" 
   - **Network**: Select "Mainnet" for production or "Sepolia" for testing
   - **Team**: Select your team (usually default)

3. Click "Create App"

## 3. Get Your API Key

Once your app is created:

1. Find your new app in the dashboard
2. Click on "View Key"
3. You'll see two key formats:
   - **API Key**: This is what you need for the .env file (a 32-character string)
   - **HTTPS**: This contains your API key at the end of the URL after `/v2/`

## 4. Set Up Your .env File

1. In the root directory of your project, create a file named `.env` if it doesn't exist
2. Add your API key in the following format:

```
ALCHEMY_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the API key you obtained from Alchemy.

**Important**: Copy only the API key itself, not the full URL.

Example:
```
ALCHEMY_API_KEY=AbCdEfGhIjKlMnOpQrStUvWxYz123456
```

## 5. Validate Your API Key

Run the validation script to make sure your API key is working:

```
bun run validate:alchemy
```

You should see:
```
✅ Alchemy API key is valid and working!
Successfully fetched latest block number: [block number]
```

## Common Issues

If you see the error "Must be authenticated!":

1. **Incorrect API Key Format**: 
   - Make sure you've copied ONLY the API key, not the whole URL
   - The key should be a 32-character string (typically alphanumeric)
   - Example: If your HTTP URL is `https://eth-mainnet.g.alchemy.com/v2/abc123def456`, your API key is `abc123def456`

2. **Key Activation Issues**:
   - New API keys may take a few minutes to activate
   - Check your Alchemy dashboard to confirm the app status is "Active"

3. **App Settings**:
   - Ensure the app is created for the correct network (Ethereum Mainnet recommended)
   - Check that your Alchemy subscription hasn't expired

4. **Environment Variable Formatting**:
   - Ensure there are no spaces in your .env file entry
   - Do not use quotes around your API key
   - The correct format is: `ALCHEMY_API_KEY=yourkeyhere` (no spaces around the equals sign)

5. **Create a Fresh Key**:
   - Sometimes creating a new API key can resolve authentication issues
   - Go to your Alchemy dashboard and create a new app

## Manually Testing Your API Key

You can test your Alchemy API key with a simple curl command:

```bash
curl https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Replace `YOUR_API_KEY` with your actual API key. If it works, you should see a response with the current block number.

## Getting Help

If you continue to have issues:

1. Create a new API key and try again
2. Contact Alchemy support through their dashboard
3. Check the Alchemy documentation at https://docs.alchemy.com/ 