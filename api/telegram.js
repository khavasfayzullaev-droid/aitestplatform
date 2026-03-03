export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = process.env.VITE_TG_BOT_TOKEN;
    if (!token) {
        return response.status(500).json({ error: 'Bot token configuration is missing' });
    }

    const { chat_id, message } = request.body;
    if (!chat_id || !message) {
        return response.status(400).json({ error: 'Missing chat_id or message' });
    }

    try {
        const tgResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chat_id,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const tgData = await tgResponse.json();
        if (!tgResponse.ok) {
            throw new Error(tgData.description || 'Failed to send telegram message');
        }

        return response.status(200).json({ success: true });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
