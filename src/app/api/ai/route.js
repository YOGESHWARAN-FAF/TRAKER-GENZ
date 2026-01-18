import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { performance, userId } = await request.json();

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a fun, high-energy Tamil motivational coach using Gen-Z slang (Tanglish). Keep it short, punchy, and funny. Use emojis."
                    },
                    {
                        "role": "user",
                        "content": `Generate a reaction for this daily performance: ${performance}`
                    }
                ]
            })
        });

        const data = await response.json();
        const message = data.choices?.[0]?.message?.content || "Super da mapla! Keep grinding! 🔥";

        return NextResponse.json({ message });
    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ message: "Network issue da, but you did great! 💪" }, { status: 500 });
    }
}
