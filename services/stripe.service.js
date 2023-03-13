const stripe = require("stripe")(process.env.STRIPE_SKEY);

const listInvoices = (customer, status = '') => {
    try {
        if(status)
            return stripe.invoices.list({ customer, status });
        return stripe.invoices.list();
    } catch (e) {
        console.error(e);
        return null;
    }
};

module.exports = {
    listInvoices,
    getLatestInvoice: async (customer) => {
        try {
            const invoices = await listInvoices(customer, 'paid');
            if(invoices && invoices.data) return invoices.data[0];
            else null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    createCustomer: async (user, data = {}) => {
        try {
            if (user) {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: !!user.profile && !!user.profile.name ? user.profile.name : '',
                    metadata: {
                        userId: user.id
                    },
                    ...data
                });

                user.set("stripeCustomerId", customer.id);
                await user.save();

                return customer;
            } else return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    getPaymentMethods: async (customer) => {
        try {
            const paymentMethods = await stripe.paymentMethods.list({ customer, limit: 50 });
            if(paymentMethods && paymentMethods.data)
                return paymentMethods.data;
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    getPaymentMethod: async (paymentMethodId) => {
        try {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            if (paymentMethod)
                return paymentMethod;

            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    getCustomer: async (customerId) => {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer)
                return customer;

            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    updateCustomer: async (customerId, data) => {
        try {
            await stripe.customers.update(customerId, data);

            return true
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    updateSubscription: async (subscriptionId, data) => {
        try {
            const res = await stripe.subscriptions.update(subscriptionId, data);
            // console.log("updated==========", res);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    deleteSubscription: async (subscriptionId) => {
        try {
            const res = await stripe.subscriptions.del(subscriptionId);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    detachPaymentMethod: async (paymentMethodId) => {
        try {
            await stripe.paymentMethods.detach(paymentMethodId);

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },
    getPromotionCodes: async () => {
        try {
            return await stripe.promotionCodes.list();
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    findPromotionCode: async (promoCode) => {
        try {
            if (promoCode) {
                console.log({promoCode});
                const promotionCodes = await stripe.promotionCodes.list({
                    code: promoCode,
                    expand: ['data.coupon.applies_to']
                });
                return promotionCodes.data[0];
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    getInvoice: async (id) => {
        try {
            return await stripe.invoices.retrieve(id);
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    createSubscription: async (data) => {
        try {
            return await stripe.subscriptions.create(data);
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    getSubscription: async (id, expand) => {
        try {
            if(id){
                const sub = await stripe.subscriptions.retrieve(id, { expand });
                return sub;
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    querySubscription: async (query) => {
        try {
            const subs = await stripe.subscriptions.list(query);
            if(query.limit)
                return subs.data[0];
            return subs.data;
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    getProductPrice: async (id, productPrice, expand = ['data.product']) => {
        try {
            const prices = await stripe.prices.list({
                product: id,
                active: true,
                expand
            });
            debugger;
            return prices.data.find((price) => price.id === productPrice);
        } catch (e) {
            console.error(e);
            return [];
        }
    },
    getPrice: async (id, expand = ['product']) => {
        try {
            return await stripe.prices.retrieve(id, { expand });
        } catch (e) {
            console.error(e);
            return null
        }
    }
}