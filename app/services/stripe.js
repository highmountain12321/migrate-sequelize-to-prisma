const test = 'sk_test_51Kj7akHBvtrbgTjqMrg2pZWpxxlylEm0srWToEIqvev0ssC8lTK5fZ8LOaJc93DDj1jpCA6WcNVb2MHqXvIEvQjT00tGvAxihg';
process.env.STRIPE_API_KEY = test;
//process.env.STRIPE_API_KEY = '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';
const stripe = require('stripe')(process.env.STRIPE_API_KEY);


exports.createCheckoutSession = async(product, metadata) =>{
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        product_data: {
                            name: product.name,
                        },
                        unit_amount: product.price * 100,
                    },
                    quantity: product.quantity,
                },
            ],
            mode: "payment",
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel",
        });
        return session;
    }catch(e){
        throw e;
    }

}


exports.listProducts = async(customerId) =>{
    try {
        const products = await stripe.products.list();
        return products;
    }catch(e){
        throw e;
    }

}


exports.getCustomer = async(customerId) =>{
    const customer = await stripe.customers.retrieve(customerId);
    return customer;

}

exports.createCustomer = async(payload) =>{
    const {id, email, firstName, lastName} = payload;
    const customer = await stripe.customers.create({
        name: `${firstName} ${lastName}`,
        email,
        metadata : {
            userId: id
        }
    });
    return customer;

}
exports.updateCustomer = async(customerId, payload) =>{
    const customer = await stripe.customers.update(customerId,payload);
    return customer;
}
exports.createCard = async(customerId, token) =>{
    const card = await stripe.customers.createSource(
        customerId,
        {source: token.token}
    );
    return card;
}
exports.deleteCard = async(customerId, cardId) =>{
    const deleted = await stripe.customers.deleteSource(
        customerId,
        cardId
    );
    return deleted;
}
exports.listCards = async(customerId, limit = 10) =>{
    const cards = await stripe.customers.listSources(
        customerId,
        {object: 'card', limit}
    );
    // tslint:disable-next-line:no-unused-expression
    return cards;
}
exports.charge = async(customerId, amount,metadata = {}) =>{
// `source` is obtained with Stripe.js; see https://stripe.com/docs/payments/accept-a-payment-charges#web-create-token

    try {
        const amo = parseFloat(amount) * 100;
        console.log(customerId);
        console.log('amount ',amo);
        const charge = await stripe.charges.create({
            customer: customerId,
            amount: amo,
            currency: 'usd',
            metadata
        });
        console.log('ok ',charge)
        return charge;
    }catch(e){
        throw e;
    }
}
