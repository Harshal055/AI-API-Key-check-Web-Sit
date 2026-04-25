import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { provider } = await params;
  const { apiKey, text, voice, model } = await request.json();

  if (!apiKey || !text) {
    return NextResponse.json({ error: 'API key and text are required' }, { status: 400 });
  }

  try {
    let response;

    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'tts-1',
            input: text,
            voice: voice || 'alloy',
            response_format: 'mp3'
          }),
        });
        break;

      case 'elevenlabs':
        const voiceId = voice || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
        response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text,
            model_id: model || 'eleven_multilingual_v2',
          }),
        });
        break;

      default:
        return NextResponse.json({ error: 'TTS not supported for this provider' }, { status: 400 });
    }

    if (response && response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return NextResponse.json({
        audio: base64,
        contentType: 'audio/mpeg'
      });
    } else {
      let errMessage = 'TTS generation failed';
      try {
        const errData = await response.json();
        errMessage = errData.error?.message || errData.detail?.message || errData.error || errMessage;
        if (typeof errMessage === 'object') errMessage = JSON.stringify(errMessage);
      } catch (e) {
        try { errMessage = await response.text(); } catch (e2) {}
      }
      return NextResponse.json({ error: errMessage }, { status: response?.status || 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
