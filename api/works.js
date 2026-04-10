export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
    const API_KEY = process.env.FIREBASE_API_KEY;

    try {
        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/works?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.documents) return res.status(200).json({ success: true, works: [] });

        const works = data.documents.map(doc => {
            const f = doc.fields;
            return {
                id: doc.name.split('/').pop(),
                filename: f.filename?.stringValue || '',
                url: f.url?.stringValue || '',
                position: f.position?.integerValue ? parseInt(f.position.integerValue) : 0,
                created_at: f.created_at?.timestampValue || ''
            };
        }).sort((a, b) => a.position - b.position);

        return res.status(200).json({ success: true, works });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
