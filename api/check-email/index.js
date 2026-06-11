const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    const email = (req.query.email || (req.body && req.body.email) || '').toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        context.res = {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: { allowed: false, error: 'Invalid email format' }
        };
        return;
    }

    try {
        const connectionString = process.env.SURVEY_TABLE_CONNECTION || process.env.AZURE_STORAGE_CONNECTION_STRING;
        let allowed = true;

        if (connectionString) {
            try {
                const tableClient = TableClient.fromConnectionString(connectionString, "AllowEmail");
                const entity = await tableClient.getEntity("email", email);
                allowed = entity.Allow === "Y";
                context.log('Email ' + email + ' allowed: ' + allowed);
            } catch {
                context.log.warn('AllowEmail table or entity not found for ' + email + ' - allowing by default');
                allowed = true;
            }
        }

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { allowed, email }
        };
    } catch (error) {
        context.log.error('Error checking email: ' + error.message);
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { allowed: true, email }
        };
    }
};
