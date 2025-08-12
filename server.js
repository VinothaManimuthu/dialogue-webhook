const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json()); // Parse JSON body

// SAP API credentials (store in Render environment variables for security)
const SAP_USERNAME = process.env.SAP_USERNAME || 'AIUSER';
const SAP_PASSWORD = process.env.SAP_PASSWORD || 'VFelFiDbErgKDsWqjfGmUGnWMnS-GSkyQwfg2xoc';

// Webhook endpoint for Dialogflow
app.post('/webhook', async (req, res) => {
  console.log("Incoming Dialogflow request:", JSON.stringify(req.body, null, 2));

  // Extract product_id from Dialogflow parameters
  const productId = req.body?.queryResult?.parameters?.['product_id'];

  if (!productId) {
    console.warn("No product_id found in request.");
    return res.json({ fulfillmentText: "Please provide a product ID." });
  }

  try {
    const sapApiUrl = `https://my404092.s4hana.cloud.sap:443/sap/opu/odata4/sap/api_product/srvd_a2x/sap/product/0002/Product?$format=json&$filter=Product eq '${productId}'`;

    console.log("Calling SAP API:", sapApiUrl);

    const apiResponse = await axios.get(sapApiUrl, {
      auth: {
        username: SAP_USERNAME,
        password: SAP_PASSWORD
      }
    });

    const products = apiResponse.data?.value || [];

    if (products.length > 0) {
      const product = products[0];
      const description = product._ProductDescription?.[0]?.ProductDescription || 'No description available';
      const reply = `Product ${product.Product} is ${description}, type: ${product.ProductType}.`;
      return res.json({ fulfillmentText: reply });
    } else {
      return res.json({ fulfillmentText: `Sorry, I couldn't find product ${productId}.` });
    }

  } catch (error) {
    console.error('Error fetching product from SAP:', error.response?.data || error.message);
    return res.json({ fulfillmentText: `There was an error fetching product ${productId}.` });
  }
});

// Default route for testing Render deployment
app.get('/', (req, res) => res.send('Dialogflow Webhook Running!'));

// Use Render-assigned PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
