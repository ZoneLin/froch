const { TableClient } = require("@azure/data-tables");
const { v4: uuidv4 } = require("uuid");

module.exports = async function (context, req) {
    context.log('Survey submission received');

    if (req.method !== 'POST') {
        context.res = { status: 405, body: { error: 'Method not allowed' } };
        return;
    }

    const data = req.body;
    if (!data || !data.Email || !data.Ques_Type) {
        context.res = { status: 400, body: { error: 'Missing required fields' } };
        return;
    }

    try {
        const connectionString = process.env.SURVEY_TABLE_CONNECTION || process.env.AZURE_STORAGE_CONNECTION_STRING;

        if (connectionString) {
            const tableClient = TableClient.fromConnectionString(connectionString, "Satisfaction");
            await tableClient.createTable();

            const entity = {
                partitionKey: data.Ques_Type,
                rowKey: uuidv4(),
                Email: data.Email,
                CompanyName: data.CompanyName || '',
                Name: data.Name || '',
                JobTitle: data.JobTitle || '',
                ReasonA: data.ReasonA || '',
                ReasonB: data.ReasonB || '',
                ReasonC: data.ReasonC || '',
                Feedback: data.Feedback || '',
                SubmittedAt: new Date().toISOString()
            };

            const fields = [
                'SatisfactionA01','SatisfactionA02','SatisfactionA03','SatisfactionA04','SatisfactionA05',
                'SatisfactionA06','SatisfactionA07','SatisfactionA08','SatisfactionA09','SatisfactionA10',
                'SatisfactionA11','SatisfactionA12','SatisfactionA13',
                'SatisfactionB01','SatisfactionB02','SatisfactionB03','SatisfactionB04','SatisfactionB05',
                'SatisfactionB06','SatisfactionB07',
                'SatisfactionC01','SatisfactionC02','SatisfactionC03','SatisfactionC04','SatisfactionC05',
                'SatisfactionC06','SatisfactionC07'
            ];

            fields.forEach(f => {
                if (data[f] !== undefined) {
                    entity[f] = data[f];
                }
            });

            await tableClient.createEntity(entity);
            context.log('Survey saved successfully with rowKey: ' + entity.rowKey);

            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, message: 'Survey submitted successfully' }
            };
        } else {
            context.log.warn('No storage connection string - survey not persisted');
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, message: 'Survey submitted (not persisted)' }
            };
        }
    } catch (error) {
        context.log.error('Error saving survey: ' + error.message);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { success: false, error: 'Internal server error' }
        };
    }
};
