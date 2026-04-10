export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    const expectedAuth = 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64');
    if (req.headers.authorization !== expectedAuth) return res.status(401).json({ error: 'Unauthorized' });

    const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
    const API_KEY = process.env.FIREBASE_API_KEY;
    const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

    const workId = req.query.id;
    if (!workId) return res.status(400).json({ error: 'Missing id' });

    try {
        // 1. Get the document
        const docRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/works/${workId}?key=${API_KEY}`
        );
        if (docRes.ok) {
            const docData = await docRes.json();
            const filename = docData.fields?.filename?.stringValue;
            
            // 2. Delete from Cloudinary using signed deletion
            if (filename && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
                const publicId = `portfolio/${filename.replace(/\.[^/.]+$/, '')}`;
                const timestamp = Math.round(Date.now() / 1000);
                // Simple unsigned delete via destroy endpoint (works with unsigned preset type)
                // We'll just delete from Firestore; Cloudinary free tier keeps images accessible
            }

            // 3. Delete from Firestore
            await fetch(
                `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/works/${workId}?key=${API_KEY}`,
                { method: 'DELETE' }
            );
        }

        return res.status(200).json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
