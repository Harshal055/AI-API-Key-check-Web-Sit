import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { provider } = await params;
  const { apiKey, model, messages } = await request.json();

  if (!apiKey || !model || !messages) {
    return NextResponse.json({ error: 'API key, model, and messages are required' }, { status: 400 });
  }

  try {
    let response;
    let responseText = '';

    // Standard OpenAI compatible format
    const openAICompatibleBody = {
      model: model,
      messages: messages,
    };

    switch (provider) {
      case 'openai':
      case 'groq':
      case 'mistral':
      case 'together':
      case 'deepseek':
      case 'nvidia':
        const endpoints = {
          openai: 'https://api.openai.com/v1/chat/completions',
          groq: 'https://api.groq.com/openai/v1/chat/completions',
          mistral: 'https://api.mistral.ai/v1/chat/completions',
          together: 'https://api.together.xyz/v1/chat/completions',
          deepseek: 'https://api.deepseek.com/chat/completions',
          nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
        };

        response = await fetch(endpoints[provider], {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(openAICompatibleBody),
        });

        if (response.ok) {
          const data = await response.json();
          responseText = data.choices[0]?.message?.content || '';
        }
        break;

      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4096,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          }),
        });
        if (response.ok) {
          const data = await response.json();
          responseText = data.content[0]?.text || '';
        }
        break;

      case 'gemini':
        const formatGeminiMessage = (msg) => {
          return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          };
        };
        
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: messages.map(formatGeminiMessage)
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        break;

      case 'cohere':
        // Cohere maps history and message differently.
        const cohereHistory = messages.slice(0, -1).map(m => ({
          role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
          message: m.content
        }));
        const cohereMessage = messages[messages.length - 1].content;
        
        response = await fetch('https://api.cohere.com/v1/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            message: cohereMessage,
            chat_history: cohereHistory
          })
        });

        if (response.ok) {
          const data = await response.json();
          responseText = data.text || '';
        }
        break;

      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    if (response && response.ok) {
      return NextResponse.json({ 
        text: responseText
      });
    } else {
      let errMessage = 'Chat request failed';
      try {
        const errData = await response.json();
        errMessage = errData.error?.message || errData.error || errData.message || errMessage;
        if (typeof errMessage === 'object') {
          errMessage = JSON.stringify(errMessage);
        }
      } catch (e) {
        try {
          errMessage = await response.text();
        } catch (e2) {}
      }
      return NextResponse.json({ error: errMessage }, { status: response?.status || 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
