export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Verify Auth
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    const expectedAuth = 'Basic ' + Buffer.from(adminUser + ':' + adminPass).toString('base64');
    if (req.headers.authorization !== expectedAuth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'Invalid order data' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

    try {
        for (let i = 0; i < order.length; i++) {
            const workId = order[i];
            await fetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${workId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ position: i })
            });
        }
        return res.status(200).json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
