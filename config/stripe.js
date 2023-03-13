module.exports = {
    products: {
        PRO_MEMBERSHIP: process.env.STRIPE_PRO_MEMBERSHIP_PRODUCT_ID
    },
    prices: {
        MONTHLY_PRO_MEMBERSHIP: process.env.STRIPE_MONTHLY_PRO_MEMBERSHIP_PRICE_ID,
        LIFETIME_PRO_MEMBERSHIP: process.env.STRIPE_LIFETIME_PRO_MEMBERSHIP_PRICE_ID
    }
};
