export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Auth check
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
    const expectedAuth = 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64');
    if (req.headers.authorization !== expectedAuth) return res.status(401).json({ error: 'Unauthorized' });

    const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
    const API_KEY = process.env.FIREBASE_API_KEY;
    const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD;
    const CLOUDINARY_PRESET = process.env.CLOUDINARY_PRESET;

    const { filename: originalFilename, imageBase64 } = req.body;
    if (!originalFilename || !imageBase64) return res.status(400).json({ error: 'Missing data' });
    
    // Sanitize filename to prevent "Display name cannot contain slashes" or similar errors
    const filename = originalFilename.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');

    try {
        // 1. Upload to Cloudinary (unsigned upload preset)
        const cloudinaryRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: imageBase64,
                    upload_preset: CLOUDINARY_PRESET
                })
            }
        );
        const cloudData = await cloudinaryRes.json();
        if (cloudData.error) throw new Error(cloudData.error.message);
        const public_url = cloudData.secure_url;

        // 2. Get all existing docs to shift positions
        const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/works?key=${API_KEY}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();
        const existingDocs = listData.documents || [];

        // 3. Insert new doc at position 0
        const newDocRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/works?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        filename: { stringValue: filename },
                        url: { stringValue: public_url },
                        position: { integerValue: 0 },
                        created_at: { timestampValue: new Date().toISOString() }
                    }
                })
            }
        );
        if (!newDocRes.ok) throw new Error(`Firestore insert failed: ${await newDocRes.text()}`);

        // 4. Shift all others up by 1
        for (let i = 0; i < existingDocs.length; i++) {
            const docId = existingDocs[i].name.split('/').pop();
            const currentPos = existingDocs[i].fields?.position?.integerValue ? parseInt(existingDocs[i].fields.position.integerValue) : i;
            await fetch(
                `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/works/${docId}?updateMask.fieldPaths=position&key=${API_KEY}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: { position: { integerValue: currentPos + 1 } } })
                }
            );
        }

        return res.status(200).json({ success: true, url: public_url });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
