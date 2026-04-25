import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { provider } = await params;
  const { apiKey } = await request.json();

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  try {
    let response;
    let models = [];

    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data.map(m => m.id);
        }
        break;

      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data.map(m => m.id || m.type || m.name);
        }
        break;

      case 'gemini':
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (response.ok) {
          const data = await response.json();
          models = data.models?.map(m => m.name.replace('models/', '')) || [];
        }
        break;

      case 'mistral':
        response = await fetch('https://api.mistral.ai/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data.map(m => m.id);
        }
        break;

      case 'groq':
        response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data.map(m => m.id);
        }
        break;

      case 'cohere':
        response = await fetch('https://api.cohere.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.models.map(m => m.name);
        }
        break;

      case 'nvidia':
        response = await fetch('https://integrate.api.nvidia.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data.map(m => m.id);
        }
        break;

      case 'deepseek':
        response = await fetch('https://api.deepseek.com/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data.map(m => m.id);
        }
        break;

      case 'together':
        response = await fetch('https://api.together.xyz/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = Array.isArray(data) ? data.map(m => m.id) : (data.data?.map(m => m.id) || []);
        }
        break;

      case 'xai':
        response = await fetch('https://api.x.ai/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data?.map(m => m.id) || [];
        }
        break;

      case 'perplexity':
        response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1
          }),
        });
        if (response.ok) {
          models = ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'sonar-deep-research', 'r1-1776'];
        }
        break;

      case 'elevenlabs':
        response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.voices?.map(v => ({ id: v.voice_id, name: v.name })) || [];
        }
        break;

      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    if (response && response.ok) {
      return NextResponse.json({ 
        message: 'Valid API Key',
        models: models 
      });
    } else {
      let errMessage = 'Invalid API Key or Rate Limited';
      try {
        const errData = await response.json();
        // Extract common error messages based on API formats
        errMessage = errData.error?.message || errData.error || errData.message || errMessage;
        
        if (typeof errMessage === 'object') {
          errMessage = JSON.stringify(errMessage);
        }
      } catch (e) {
        // Fallback to text if JSON parsing fails
        try {
          errMessage = await response.text();
        } catch (e2) {
           // Do nothing
        }
      }
      return NextResponse.json({ error: errMessage }, { status: response?.status || 401 });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
