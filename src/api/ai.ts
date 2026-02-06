const WORKER_URL = 'https://ai-proxy.lz-t.top'

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export const aiService = {
    async chat(messages: ChatMessage[]): Promise<string> {
        const response = await fetch(WORKER_URL + '/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error)
        return data.choices[0].message.content
    }
}

