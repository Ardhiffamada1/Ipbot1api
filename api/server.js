const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const ip = req.query.ip;

  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  const url = `https://scamalytics.com/ip/${ip}`;

  try {
    const response = await axios.get(url);
    const data = extractData(response.data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


function extractData(html) {
  const $ = cheerio.load(html);
  const data = {
    operator: {
      hostname: '',
      asn: '',
      ispName: '',
      organizationName: '',
      connectionType: ''
    },
    location: {
      countryName: '',
      countryCode: '',
      stateProvince: '',
      districtCounty: '',
      city: '',
      postalCode: '',
      latitude: '',
      longitude: ''
    },
    proxies: {
      anonymizingVpn: '',
      torExitNode: '',
      server: '',
      publicProxy: '',
      webProxy: '',
      searchEngineRobot: ''
    },
    domainNames: [],
    botStatus: [],
    countryFlag: []
  };

  $('table tr').each((index, element) => {
    const th = $(element).find('th').text().trim();
    const td = $(element).find('td').text().trim();

    switch (th) {
      case 'Hostname':
        data.operator.hostname = td;
        break;
      case 'ASN':
        data.operator.asn = td;
        break;
      case 'ISP Name':
        data.operator.ispName = td;
        break;
      case 'Organization Name':
        data.operator.organizationName = td;
        break;
      case 'Connection type':
        data.operator.connectionType = td;
        break;
      case 'Country Name':
        data.location.countryName = td;
        break;
      case 'Country Code':
        data.location.countryCode = td;
        break;
      case 'State / Province':
        data.location.stateProvince = td;
        break;
      case 'District / County':
        data.location.districtCounty = td;
        break;
      case 'City':
        data.location.city = td;
        break;
      case 'Postal Code':
        data.location.postalCode = td;
        break;
      case 'Latitude':
        data.location.latitude = td;
        break;
      case 'Longitude':
        data.location.longitude = td;
        break;
      case 'Anonymizing VPN':
      case 'Tor Exit Node':
      case 'Server':
      case 'Public Proxy':
      case 'Web Proxy':
      case 'Search Engine Robot':
        data.proxies[th.toLowerCase().replace(/\s+/g, '')] = td;
        if (td === 'Yes') {
          data.botStatus.push('Yes');
        }
        break;
      case 'Domain Names':
        $('table tr').slice(index + 1).each((idx, el) => {
          const domain = $(el).find('td').text().trim();
          if (domain) {
            data.domainNames.push(domain);
          }
        });
        break;
      default:
        break;
    }
  });

  if (data.botStatus.length === 0) {
    data.botStatus.push('No');
  }

  // Adding country flag URL
  const countryCode = data.location.countryCode.toLowerCase();
  const countryFlagURL = `https://flagcdn.com/${countryCode}.svg`;
  data.countryFlag.push(countryFlagURL);

  return data;
}