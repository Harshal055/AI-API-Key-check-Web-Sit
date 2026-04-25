import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { provider } = await params;
  const { apiKey, model } = await request.json();

  if (!apiKey || !model) {
    return NextResponse.json({ error: 'API key and model are required' }, { status: 400 });
  }

  try {
    let response;
    const testMessage = [{ role: 'user', content: 'Say "ok"' }];
    const body = { model, messages: testMessage, max_tokens: 5 };

    switch (provider) {
      case 'openai':
      case 'groq':
      case 'mistral':
      case 'together':
      case 'deepseek':
      case 'nvidia':
      case 'xai':
      case 'perplexity': {
        const endpoints = {
          openai: 'https://api.openai.com/v1/chat/completions',
          groq: 'https://api.groq.com/openai/v1/chat/completions',
          mistral: 'https://api.mistral.ai/v1/chat/completions',
          together: 'https://api.together.xyz/v1/chat/completions',
          deepseek: 'https://api.deepseek.com/chat/completions',
          nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
          xai: 'https://api.x.ai/v1/chat/completions',
          perplexity: 'https://api.perplexity.ai/chat/completions',
        };

        response = await fetch(endpoints[provider], {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        break;
      }

      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: 5,
            messages: testMessage
          }),
        });
        break;

      case 'gemini': {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Say ok' }] }],
              generationConfig: { maxOutputTokens: 5 }
            }),
          }
        );
        break;
      }

      case 'cohere':
        response = await fetch('https://api.cohere.com/v1/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model,
            message: 'Say ok',
            max_tokens: 5
          }),
        });
        break;

      case 'elevenlabs':
        // For ElevenLabs, test by listing models (voices are listed during validate)
        response = await fetch('https://api.elevenlabs.io/v1/models', {
          headers: { 'xi-api-key': apiKey },
        });
        break;

      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    if (response && response.ok) {
      return NextResponse.json({ status: 'working', model });
    } else {
      let errMessage = 'Model not accessible';
      try {
        const errData = await response.json();
        errMessage = errData.error?.message || errData.error || errData.message || errMessage;
        if (typeof errMessage === 'object') errMessage = JSON.stringify(errMessage);
      } catch (e) {}
      return NextResponse.json({ status: 'failed', model, error: errMessage }, { status: 200 });
    }

  } catch (error) {
    return NextResponse.json({ status: 'failed', model, error: error.message }, { status: 200 });
  }
}
