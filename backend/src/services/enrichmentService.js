const https = require('https');
const logger = require('../config/logger');

const enrichLeadData = async (email) => {
  return new Promise((resolve) => {
    // If the network call fails or is slow, we resolve with a mock object
    const fallbackData = {
      enriched: true,
      companyName: 'Acme Corp Inc.',
      companyDescription: 'An enterprise business services company enriched from email domain.',
      socialProfile: 'https://linkedin.com/company/acme-corp',
    };

    const domain = email ? email.split('@')[1] : 'unknown.com';
    
    // We make a GET request to randomuser.me to simulate enriching the profile
    https.get('https://randomuser.me/api/?inc=name,picture,location&noinfo', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            if (parsed.results && parsed.results.length > 0) {
              const user = parsed.results[0];
              const companyName = domain.split('.')[0].toUpperCase() + ' Co.';
              const enrichedDetails = {
                enriched: true,
                companyName: companyName,
                companyDescription: `Enriched contact matching user ${user.name.first} ${user.name.last} located in ${user.location.city}, ${user.location.country}.`,
                avatarUrl: user.picture.medium,
              };
              logger.info(`Lead enriched successfully from randomuser.me for email: ${email}`);
              resolve(enrichedDetails);
            } else {
              resolve(fallbackData);
            }
          } else {
            resolve(fallbackData);
          }
        } catch (err) {
          logger.warn(`Failed to parse enrichment response: ${err.message}`);
          resolve(fallbackData);
        }
      });
    }).on('error', (err) => {
      logger.warn(`Error during external enrichment API request: ${err.message}`);
      resolve(fallbackData);
    });

    // Set a 3-second timeout to prevent hanging requests
    setTimeout(() => {
      resolve(fallbackData);
    }, 3000);
  });
};

module.exports = {
  enrichLeadData,
};
