# Trade News Feed Azure Function

This Azure Function aggregates trade and tariff news from multiple government sources including CBP, USTR, Federal Register, and Census Bureau.

## Features

- **Multi-source aggregation**: Fetches news from 4+ government agencies
- **Smart fallback**: Uses cached data when external sources are unavailable
- **CORS enabled**: Ready for cross-origin requests from mobile apps
- **Priority ranking**: Automatically prioritizes high-importance trade news
- **Rate limiting**: Built-in timeout and retry logic

## Government Sources

1. **CBP (Customs and Border Protection)**
   - Trade bulletins and HTS code updates
   - High priority for tariff-related content

2. **USTR (U.S. Trade Representative)**
   - Trade policy announcements
   - International trade negotiations

3. **Federal Register**
   - Official regulatory updates
   - Tariff schedule modifications

4. **Census Bureau**
   - Trade statistics and economic data
   - Monthly import/export reports

## Deployment

### Prerequisites

1. **Azure CLI**: Install from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Functions Core Tools**: Install with `npm install -g azure-functions-core-tools@4 --unsafe-perm true`
3. **Node.js 18+**: Required for Azure Functions v4

### Quick Deploy

1. **Login to Azure**:
   ```bash
   az login
   ```

2. **Run deployment script**:
   ```bash
   cd tradeNewsfeed_deploy
   ./deploy.sh
   ```

3. **Update your app**: Copy the function URL and update `AZURE_FUNCTION_URL` in `src/components/TariffNewsContent.tsx`

### Manual Deployment

If you prefer manual deployment:

1. **Create resources**:
   ```bash
   # Create resource group
   az group create --name dgl-trade-news-rg --location westus
   
   # Create storage account
   az storage account create --name dgltradenewsstorage --location westus --resource-group dgl-trade-news-rg --sku Standard_LRS
   
   # Create function app
   az functionapp create --resource-group dgl-trade-news-rg --consumption-plan-location westus --runtime node --runtime-version 18 --functions-version 4 --name dgl-trade-news-api --storage-account dgltradenewsstorage
   ```

2. **Deploy function**:
   ```bash
   func azure functionapp publish dgl-trade-news-api
   ```

## Configuration

### Environment Variables

The function works out-of-the-box but you can configure:

- `TIMEOUT_MS`: Request timeout (default: 10000ms)
- `MAX_ITEMS_PER_SOURCE`: Items per source (default: 3-5)
- `CACHE_DURATION`: Not used in function, handled by client

### Customizing Sources

To add or modify news sources, edit the fetch functions in `index.js`:

```javascript
// Add new source
async function fetchNewSource() {
    // Your implementation
}

// Add to main function
const newSourceData = await fetchNewSource();
newsItems.push(...newSourceData);
```

## API Response Format

```json
{
  "success": true,
  "items": [
    {
      "id": "unique-identifier",
      "title": "News Article Title",
      "summary": "Brief description...",
      "date": "2025-01-15T10:30:00.000Z",
      "url": "https://source-website.gov/article",
      "source": "CBP",
      "category": "regulatory",
      "priority": "high",
      "visualType": "article",
      "chartData": null
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z",
  "count": 15
}
```

## Error Handling

The function includes comprehensive error handling:

- **Individual source failures**: Other sources continue working
- **Network timeouts**: 10-second timeout with graceful fallback
- **Parsing errors**: Fallback to static content
- **CORS issues**: Proper headers for cross-origin requests

## Testing

Test the deployed function:

```bash
# Basic test
curl https://your-function-app.azurewebsites.net/api/tradenewsfeed

# With verbose output
curl -v https://your-function-app.azurewebsites.net/api/tradenewsfeed
```

## Integration

Once deployed, update your React Native app:

1. Open `src/components/TariffNewsContent.tsx`
2. Replace the placeholder URL:
   ```javascript
   const AZURE_FUNCTION_URL = "https://your-function-app.azurewebsites.net/api/tradenewsfeed";
   ```
3. The app will automatically start using live government news data

## Cost Estimation

Azure Functions Consumption Plan pricing (as of 2025):

- **Free tier**: 1M executions/month + 400K GB-seconds
- **Typical usage**: ~$0-5/month for moderate traffic
- **High traffic**: Scales automatically, pay per execution

## Monitoring

Monitor your function in the Azure Portal:

1. Go to your Function App
2. Check **Monitor** tab for execution logs
3. View **Application Insights** for detailed analytics
4. Set up **Alerts** for failures or high usage

## Troubleshooting

### Common Issues

1. **Function not responding**:
   - Check Azure Portal logs
   - Verify all dependencies are installed
   - Check network connectivity

2. **CORS errors**:
   - Headers are pre-configured
   - Verify function app CORS settings if needed

3. **Timeout errors**:
   - Government sites can be slow
   - Function includes 10s timeout + fallback data

4. **Empty results**:
   - Fallback data ensures some content always returns
   - Check individual source URLs manually

### Logs

View logs in Azure Portal or via CLI:

```bash
func azure functionapp logstream dgl-trade-news-api
```

## License

This function is part of the HarmonyTi trade calculation app by Dedola Global Logistics. 