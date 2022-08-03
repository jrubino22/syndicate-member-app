
const replaceCustomerTags = async (shopifyStore, shopifyCustomerId, newCardTier) => {
    let thisUrl = `https://${shopifyStore}.myshopify.com/admin/api/2022-07/customers/${shopifyCustomerId}.json`

    getResponse = await fetch(thisUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': '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'
        }
    }
    );
    const getData = await getResponse.json();

    // const oldOnes = getData.customer.tags
    // console.log(oldOnes)
    const oldOnes = getData.customer.tags.split(", ")
    console.log(oldOnes)

    let tagIndex
    if (oldOnes.indexOf('Blue') > -1) {
        tagIndex = oldOnes.indexOf('Blue');
    } else if (oldOnes.indexOf('Green') > -1) {
        tagIndex = oldOnes.indexOf('Green');
    } else if (oldOnes.indexOf('Gold') > -1) {
        tagIndex = oldOnes.indexOf('Gold');
    } else if (oldOnes.indexOf('Black') > -1) {
        tagIndex = oldOnes.indexOf('Black');
    } else { tagIndex = 1 }

    console.log(tagIndex)

    if (tagIndex > -1) {
        oldOnes.splice(tagIndex, 1)
    }

    console.log(oldOnes)

    const newCustomerTags = oldOnes.concat(`${newCardTier}`);
    console.log(newCustomerTags)


    const requestOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': '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'
        },
        body: JSON.stringify({
            "customer":
            {
                "id": shopifyCustomerId,
                "tags": newCustomerTags
            }
        })
    }
    const response = await fetch(thisUrl, requestOptions);
    const data = await response.json();
    console.log(data)
}

module.exports = { replaceCustomerTags }