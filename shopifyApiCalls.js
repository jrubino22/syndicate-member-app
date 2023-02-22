const dotenv = require('dotenv');
dotenv.config();

const replaceCustomerTags = async (
  shopifyStore,
  shopifyCustomerId,
  newCardTier
) => {
  let thisUrl = `https://${shopifyStore}.myshopify.com/admin/api/2022-07/customers/${shopifyCustomerId}.json`;

  const getResponse = await fetch(thisUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.ACCESS_TOKEN,
    },
  });
  const getData = await getResponse.json();

  // const oldOnes = getData.customer.tags
  console.log(getData);
  const oldOnes = getData.customer.tags.split(', ');
  console.log(oldOnes);

  let colorTagIndex;
  if (oldOnes.indexOf('Red') > -1) {
    colorTagIndex = oldOnes.indexOf('Red');
  } else if (oldOnes.indexOf('Blue') > -1) {
    colorTagIndex = oldOnes.indexOf('Blue');
  } else if (oldOnes.indexOf('Gold') > -1) {
    colorTagIndex = oldOnes.indexOf('Gold');
  } else if (oldOnes.indexOf('Black') > -1) {
    colorTagIndex = oldOnes.indexOf('Black');
  } else if (oldOnes.indexOf('None') > -1) {
    colorTagIndex = oldOnes.indexOf('None');
  }
   else {
    colorTagIndex = -1;
  }

  console.log(colorTagIndex);

  if (colorTagIndex > -1) {
    oldOnes.splice(colorTagIndex, 1);
  }

  console.log(oldOnes);

  let typeTagIndex = -1;
  let newTypeTag = '';
  if (newCardTier === 'Red' || newCardTier === 'Blue') {
    if (oldOnes.indexOf('distributor') > -1) {
      typeTagIndex = oldOnes.indexOf('distributor');
      newTypeTag = 'retail';
    }
    if (oldOnes.indexOf('master-distributor') > -1) {
      typeTagIndex = oldOnes.indexOf('master-distributor');
      newTypeTag = 'retail';
    }
  }
  if (newCardTier === 'Gold') {
    if (oldOnes.indexOf('retail') > -1) {
      typeTagIndex = oldOnes.indexOf('retail');
      newTypeTag = 'distributor';
    }
    if (oldOnes.indexOf('master-distributor') > -1) {
      typeTagIndex = oldOnes.indexOf('master-distributor');
      newTypeTag = 'distributor';
    }
  }
  if (newCardTier === 'Black') {
    if (oldOnes.indexOf('retail') > -1) {
      typeTagIndex = oldOnes.indexOf('retail');
      newTypeTag = 'master-distributor';
    }
    if (oldOnes.indexOf('distributor') > -1) {
      typeTagIndex = oldOnes.indexOf('distributor');
      newTypeTag = 'master-distributor';
    }
  }
  if (newCardTier === 'None') {
    if (oldOnes.indexOf('distributor') > -1) {
      typeTagIndex = oldOnes.indexOf('distributor');
      newTypeTag = 'retail';
    }
    if (oldOnes.indexOf('master-distributor') > -1) {
      typeTagIndex = oldOnes.indexOf('master-distributor');
      newTypeTag = 'retail';
    }
  }

  console.log(typeTagIndex);
  console.log(newTypeTag);

  let newCustomerTags;
  if (typeTagIndex > -1) {
    oldOnes.splice(typeTagIndex, 1);
    oldOnes.push(newTypeTag);
  }
    

  newCustomerTags = oldOnes.concat(`${newCardTier}`);
  console.log(newCustomerTags);

  const requestOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.ACCESS_TOKEN,
    },
    body: JSON.stringify({
      customer: {
        id: shopifyCustomerId,
        tags: newCustomerTags,
      },
    }),
  };
  const response = await fetch(thisUrl, requestOptions);
  const data = await response.json();
  console.log(data);
};

const addMemberTag = async (shopifyStore, customerEmail) => {
  const url=`https://${shopifyStore}.myshopify.com/admin/api/2022-07/customers.json?email=${customerEmail}`
  console.log('inside MemberTag', url)
  const response = await fetch(url, {
    headers: {
      'Content-type': 'application/json',
      'X-Shopify-Access-Token': process.env.ACCESS_TOKEN,
    }
  });
  
if (response.ok) {
  const { customers } = await response.json();
  const customer = customers[0];
  console.log("customer",customer);

  const tags = customer.tags ? customer.tags.split(', ') : [];
  tags.push('member');

  const putUrl = `https://${shopifyStore}.myshopify.com/admin/api/2022-07/customers/${customer.id}.json`;
  const putResponse = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.ACCESS_TOKEN
    },
    body: JSON.stringify({
      customer: {
        id: customer.id,
        tags: tags.join(', ')
      }
    })
  });
  if (putResponse.ok) {
    console.log('Customer tags updated successfully');
  } else {
    console.error('Failed to update customer tags:', putResponse.status, putResponse.statusText);
  }
} else {
  console.error('Failed to retrieve customer:', response.status, response.statusText);
}
}

module.exports = { replaceCustomerTags, addMemberTag };
