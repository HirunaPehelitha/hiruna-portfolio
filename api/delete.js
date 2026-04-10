export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Verify Auth
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    const expectedAuth = 'Basic ' + Buffer.from(adminUser + ':' + adminPass).toString('base64');
    if (req.headers.authorization !== expectedAuth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const workId = req.query.id;
    if (!workId) return res.status(400).json({ error: 'Missing id' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'portfolio-images';

    try {
        // 1. Get filename
        const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${workId}&select=filename`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const rows = await fetchRes.json();
        
        if (rows && rows.length > 0) {
            const filename = rows[0].filename;

            // 2. Delete from storage
            await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filename}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });

            // 3. Delete from DB
            await fetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${workId}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
        }

        return res.status(200).json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
