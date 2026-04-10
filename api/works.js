export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/works?select=*&order=position.asc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const data = await response.json();
        return res.status(200).json({ success: true, works: data });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
