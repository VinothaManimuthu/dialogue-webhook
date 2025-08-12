const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Your SAP API credentials
const SAP_USERNAME = 'AIUSER';
const SAP_PASSWORD = 'VFelFiDbErgKDsWqjfGmUGnWMnS-GSkyQwfg2xoc';

// Webhook endpoint for Dialogflow
app.post('/webhook', async (req, res) => {
  const productId = req.body.queryResult.parameters['product_id'];

  try {
    // Construct API URL dynamically for the given productId
    const sapApiUrl = `https://my404092.s4hana.cloud.sap:443/sap/opu/odata4/sap/api_product/srvd_a2x/sap/product/0002/Product?$format=json&$filter=Product eq '${productId}'`;

    // Call SAP Product Master API with Basic Auth
    const apiResponse = await axios.get(sapApiUrl, {
      auth: {
        username: SAP_USERNAME,
        password: SAP_PASSWORD
      }
    });

    // SAP returns data in 'value' array
    const products = apiResponse.data.value;
    if (products.length > 0) {
      const product = products[0];
      const reply = `Product ${product.Product} is ${product._ProductDescription[0]?.ProductDescription || 'No description'}, type: ${product.ProductType}.`;
      res.json({ fulfillmentText: reply });
    } else {
      res.json({ fulfillmentText: `Sorry, I couldn't find product ${productId}.` });
    }

  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.json({ fulfillmentText: `There was an error fetching product ${productId}.` });
  }
});

// Default route to test Render deployment
app.get('/', (req, res) => res.send('Dialogflow Webhook Running!'));

app.listen(3000, () => console.log('Server running on port 3000'));
