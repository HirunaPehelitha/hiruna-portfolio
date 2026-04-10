export const config = {
    api: { bodyParser: { sizeLimit: '20mb' } }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Verify Auth
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    const expectedAuth = 'Basic ' + Buffer.from(adminUser + ':' + adminPass).toString('base64');
    if (req.headers.authorization !== expectedAuth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filename, imageBase64 } = req.body;
    if (!filename || !imageBase64) return res.status(400).json({ error: 'Missing data' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'portfolio-images';

    try {
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // 1. Upload to Supabase Storage
        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filename}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'image/png'
            },
            body: imageBuffer
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.text();
            throw new Error(`Upload failed: ${err}`);
        }

        const public_url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filename}`;

        // 2. Shift positions
        const allWorksRes = await fetch(`${SUPABASE_URL}/rest/v1/works?select=id&order=position.asc`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const allWorks = await allWorksRes.json();

        // 3. Insert new work at pos 0
        await fetch(`${SUPABASE_URL}/rest/v1/works`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ filename, url: public_url, position: 0 })
        });

        // 4. Update others
        for (let i = 0; i < allWorks.length; i++) {
            await fetch(`${SUPABASE_URL}/rest/v1/works?id=eq.${allWorks[i].id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ position: i + 1 })
            });
        }

        return res.status(200).json({ success: true, url: public_url });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
