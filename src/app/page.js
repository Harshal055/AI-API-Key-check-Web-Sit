"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Cpu, Sparkles, Brain, CheckCircle, XCircle, Key, Activity, Zap, Box,
  Network, Globe, MessageSquare, Send, ShieldCheck, Timer, Layers, ArrowRight,
  Volume2, Play, Square, Loader2, Search, CircleDot, Mic, AlertTriangle
} from 'lucide-react';

/* ──────────────── Provider Registry ──────────────── */
const providers = [
  // ─── Chat / LLM ───
  { id: 'openai',    name: 'OpenAI',        icon: <Bot size={20} color="#10a37f" />,      description: 'GPT-4o, GPT-4, GPT-3.5',       category: 'chat', supportsTTS: true },
  { id: 'anthropic', name: 'Anthropic',      icon: <Brain size={20} color="#d97757" />,    description: 'Claude 4, Opus, Sonnet',         category: 'chat' },
  { id: 'gemini',    name: 'Google Gemini',  icon: <Sparkles size={20} color="#4285f4" />,  description: 'Gemini 2.5 Pro, Flash',          category: 'chat' },
  { id: 'xai',       name: 'xAI  (Grok)',    icon: <Zap size={20} color="#1da1f2" />,      description: 'Grok-2, Grok-3',                category: 'chat' },
  { id: 'mistral',   name: 'Mistral AI',     icon: <Activity size={20} color="#f97316" />, description: 'Mistral Large, Mixtral',         category: 'chat' },
  { id: 'groq',      name: 'Groq',           icon: <Zap size={20} color="#ef4444" />,      description: 'Llama 3, Mixtral on LPU',        category: 'chat' },
  { id: 'cohere',    name: 'Cohere',         icon: <Cpu size={20} color="#8b5cf6" />,      description: 'Command R, R+',                  category: 'chat' },
  { id: 'perplexity',name: 'Perplexity',     icon: <Search size={20} color="#22d3ee" />,   description: 'Sonar, Sonar Pro',               category: 'chat' },
  { id: 'deepseek',  name: 'DeepSeek',       icon: <Network size={20} color="#4d6bfe" />,  description: 'DeepSeek Coder & Chat',          category: 'chat' },
  { id: 'nvidia',    name: 'NVIDIA NIM',     icon: <Box size={20} color="#76b900" />,      description: 'NIM Microservices',              category: 'chat' },
  { id: 'together',  name: 'Together AI',    icon: <Globe size={20} color="#2563eb" />,    description: 'Open Source Models',              category: 'chat' },
  // ─── Text-to-Speech ───
  { id: 'elevenlabs',name: 'ElevenLabs',     icon: <Mic size={20} color="#f472b6" />,      description: 'Voices & Speech Synthesis',      category: 'tts', supportsTTS: true },
];

const chatProviders = providers.filter(p => p.category === 'chat');
const ttsProviders  = providers.filter(p => p.category === 'tts');

/* TTS Voice Presets */
const openaiVoices = [
  { id: 'alloy',   name: 'Alloy' },
  { id: 'echo',    name: 'Echo' },
  { id: 'fable',   name: 'Fable' },
  { id: 'onyx',    name: 'Onyx' },
  { id: 'nova',    name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' },
];

/* ──────────────── Feature & Step Data ──────────────── */
const features = [
  {
    icon: <ShieldCheck size={28} />,
    title: 'Secure Server-Side',
    text: 'Keys never touch the browser — all validation flows through secure backend API routes.',
  },
  {
    icon: <Timer size={28} />,
    title: 'Instant Validation',
    text: 'Check any API key in under 2 seconds. Know immediately if it\'s valid, expired, or rate-limited.',
  },
  {
    icon: <Layers size={28} />,
    title: '12 Providers Supported',
    text: 'OpenAI, Anthropic, Gemini, xAI, Mistral, Groq, Cohere, Perplexity, DeepSeek, NVIDIA, Together & ElevenLabs.',
  },
  {
    icon: <Volume2 size={28} />,
    title: 'Text-to-Speech Testing',
    text: 'Test TTS keys with live audio playback — type text, pick a voice, and hear the result instantly.',
  },
];

const steps = [
  { number: '01', title: 'Select a Provider', text: 'Choose from 12 AI providers in the sidebar.' },
  { number: '02', title: 'Paste Your API Key', text: 'Enter your secret key — sent securely to the server, never stored.' },
  { number: '03', title: 'Validate & Test Models', text: 'We check the key, fetch models, and test which ones are working.' },
  { number: '04', title: 'Chat or Listen', text: 'Send a test chat message or generate speech to verify everything works.' },
];

/* ──────────────── Main Component ──────────────── */
export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState(providers[0]);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Model Testing
  const [modelStatuses, setModelStatuses] = useState({});  // { modelId: 'working' | 'failed' | 'testing' }
  const [isTestingModels, setIsTestingModels] = useState(false);

  // Chat State
  const [isChatMode, setIsChatMode] = useState(false);
  const [selectedModelForChat, setSelectedModelForChat] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // TTS State
  const [ttsText, setTtsText] = useState('Hello! This is a test of the text-to-speech API.');
  const [ttsVoice, setTtsVoice] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
  const [ttsError, setTtsError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  /* ── Validate API Key ── */
  const handleValidate = async () => {
    if (!apiKey) return;
    setIsLoading(true);
    setResult(null);
    setIsChatMode(false);
    setSelectedModelForChat('');
    setChatMessages([]);
    setModelStatuses({});
    setIsTestingModels(false);
    setTtsAudioUrl(null);
    setTtsError(null);

    try {
      const response = await fetch(`/api/validate/${selectedProvider.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await response.json();

      if (response.ok) {
        setResult({ status: 'success', message: 'API Key is Valid!', data });
        if (data.models && data.models.length > 0) {
          const firstModel = typeof data.models[0] === 'object' ? data.models[0].id : data.models[0];
          setSelectedModelForChat(firstModel);
          // Set default TTS voice
          if (selectedProvider.id === 'openai') {
            setTtsVoice('alloy');
          } else if (selectedProvider.id === 'elevenlabs' && data.models.length > 0) {
            const first = data.models[0];
            setTtsVoice(typeof first === 'object' ? first.id : first);
          }
        }
      } else {
        setResult({ status: 'error', message: data.error || 'Invalid API Key or request failed' });
      }
    } catch (err) {
      setResult({ status: 'error', message: 'Network error or validation failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Test All Models ── */
  const handleTestAllModels = useCallback(async () => {
    if (!result?.data?.models || !apiKey) return;
    setIsTestingModels(true);

    const models = result.data.models;
    const testableModels = models.slice(0, 20); // Limit to 20 to avoid excessive API calls

    // Mark all as testing
    const initialStatuses = {};
    testableModels.forEach(m => {
      const modelId = typeof m === 'object' ? (m.id || m.name) : m;
      initialStatuses[modelId] = 'testing';
    });
    setModelStatuses(initialStatuses);

    // Test models concurrently (in batches of 3)
    for (let i = 0; i < testableModels.length; i += 3) {
      const batch = testableModels.slice(i, i + 3);
      const results = await Promise.allSettled(
        batch.map(async (m) => {
          const modelId = typeof m === 'object' ? (m.id || m.name) : m;
          try {
            const res = await fetch(`/api/test-model/${selectedProvider.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey, model: modelId }),
            });
            const data = await res.json();
            return { modelId, status: data.status };
          } catch {
            return { modelId, status: 'failed' };
          }
        })
      );

      // Update statuses progressively
      setModelStatuses(prev => {
        const next = { ...prev };
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            next[r.value.modelId] = r.value.status;
          }
        });
        return next;
      });
    }

    setIsTestingModels(false);
  }, [result, apiKey, selectedProvider]);

  /* ── Send Chat Message ── */
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !apiKey || !selectedModelForChat) return;

    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch(`/api/chat/${selectedProvider.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model: selectedModelForChat, messages: newMessages }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages([...newMessages, { role: 'assistant', content: data.text }]);
      } else {
        setChatMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error || 'Failed to get response'}` }]);
      }
    } catch (err) {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Error: Network failure.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  /* ── Generate TTS ── */
  const handleGenerateTTS = async () => {
    if (!ttsText.trim() || !apiKey) return;
    setTtsLoading(true);
    setTtsError(null);
    setTtsAudioUrl(null);
    setIsPlaying(false);

    try {
      const response = await fetch(`/api/tts/${selectedProvider.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, text: ttsText, voice: ttsVoice }),
      });
      const data = await response.json();

      if (response.ok && data.audio) {
        const url = `data:${data.contentType};base64,${data.audio}`;
        setTtsAudioUrl(url);
      } else {
        setTtsError(data.error || 'Failed to generate speech');
      }
    } catch (err) {
      setTtsError('Network error while generating speech.');
    } finally {
      setTtsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  /* ──────────────── Helpers ──────────────── */
  const getModelDisplayName = (m) => {
    if (typeof m === 'object') return m.name || m.id || JSON.stringify(m);
    return String(m);
  };
  const getModelId = (m) => {
    if (typeof m === 'object') return m.id || m.name;
    return String(m);
  };

  const showTTSPanel = selectedProvider.supportsTTS && result?.status === 'success';
  const hasModels = result?.status === 'success' && result.data?.models?.length > 0;

  /* count working / failed / tested */
  const testedCount = Object.values(modelStatuses).filter(s => s !== 'testing').length;
  const workingCount = Object.values(modelStatuses).filter(s => s === 'working').length;
  const failedCount = Object.values(modelStatuses).filter(s => s === 'failed').length;

  /* ──────────────── RENDER ──────────────── */
  return (
    <div className="page-wrapper">
      <div className="container animate-fade-in delay-1">
        {/* ─── Header ─── */}
        <header className="header">
          <div className="header-badge animate-fade-in delay-1">
            <Zap size={14} /> Lightning-fast AI key checking
          </div>
          <h1>OmniKey</h1>
          <p className="header-subtitle">
            Test & validate <strong>all</strong> your AI API keys in one place — check if they&apos;re working,
            see available models, test which models respond, and verify with <strong>live chat</strong> or <strong>text-to-speech</strong>.
          </p>
        </header>

        {/* ─── Feature Cards ─── */}
        <div className="features-grid animate-fade-in delay-2">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>

        {/* ─── How It Works ─── */}
        <div className="how-it-works animate-fade-in delay-2">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-row">
            {steps.map((s, i) => (
              <div key={i} className="step-card">
                <span className="step-number">{s.number}</span>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
                {i < steps.length - 1 && <ArrowRight size={20} className="step-arrow" />}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid-container">
          {/* Sidebar */}
          <div className="sidebar animate-fade-in delay-2">
            <div className="sidebar-section-label">Chat & LLM Models</div>
            {chatProviders.map((p) => (
              <div
                key={p.id}
                className={`provider-item ${selectedProvider.id === p.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedProvider(p);
                  setResult(null); setApiKey(''); setIsChatMode(false);
                  setChatMessages([]); setModelStatuses({}); setTtsAudioUrl(null); setTtsError(null);
                }}
              >
                <div className="provider-icon">{p.icon}</div>
                <div className="provider-info">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                </div>
                {p.supportsTTS && <span className="provider-badge tts-badge">TTS</span>}
              </div>
            ))}

            <div className="sidebar-section-label" style={{ marginTop: '12px' }}>
              <Volume2 size={14} style={{ marginRight: 6 }} /> Text-to-Speech
            </div>
            {ttsProviders.map((p) => (
              <div
                key={p.id}
                className={`provider-item ${selectedProvider.id === p.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedProvider(p);
                  setResult(null); setApiKey(''); setIsChatMode(false);
                  setChatMessages([]); setModelStatuses({}); setTtsAudioUrl(null); setTtsError(null);
                }}
              >
                <div className="provider-icon">{p.icon}</div>
                <div className="provider-info">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                </div>
                <span className="provider-badge tts-badge">TTS</span>
              </div>
            ))}
          </div>

          {/* ─── Main Content Panel ─── */}
          <div className="main-panel glass-panel animate-fade-in delay-3">
            {/* Provider Header */}
            <div className="panel-header">
              <div className="panel-header-icon">{selectedProvider.icon}</div>
              <div>
                <h2 className="panel-title">{selectedProvider.name} Validation</h2>
                <p className="panel-subtitle">Enter your API key below to securely test connectivity.</p>
              </div>
              {selectedProvider.category === 'tts' && <span className="provider-badge tts-badge" style={{ marginLeft: 'auto' }}>TTS Provider</span>}
            </div>

            {/* Key Input */}
            <div className="key-input-wrapper">
              <Key size={20} className="key-input-icon" />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '48px' }}
                placeholder={`Enter ${selectedProvider.name} API Key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
              />
            </div>

            <button className="btn-primary" onClick={handleValidate} disabled={!apiKey || isLoading}>
              {isLoading ? <div className="loader"></div> : <><ShieldCheck size={18} /> Validate API Key</>}
            </button>

            {/* ─── Results ─── */}
            {result && (
              <div className={`result-box animate-fade-in ${result.status}`}>
                <div className="result-header">
                  {result.status === 'success' ? <CheckCircle size={22} color="var(--success)" /> : <XCircle size={22} color="var(--error)" />}
                  <h3 className={`result-title ${result.status}`}>{result.message}</h3>
                </div>

                {/* ─── Model List with Test Status ─── */}
                {hasModels && (
                  <div className="models-section">
                    <div className="models-section-header">
                      <p className="models-count">
                        {result.data.models.length} model{result.data.models.length !== 1 ? 's' : ''} accessible
                      </p>
                      <button
                        className="btn-secondary"
                        onClick={handleTestAllModels}
                        disabled={isTestingModels}
                      >
                        {isTestingModels ? (
                          <><Loader2 size={14} className="spin" /> Testing {testedCount}/{Math.min(result.data.models.length, 20)}…</>
                        ) : testedCount > 0 ? (
                          <><CheckCircle size={14} /> {workingCount} working · {failedCount} failed</>
                        ) : (
                          <><CircleDot size={14} /> Test All Models</>
                        )}
                      </button>
                    </div>

                    <div className="model-chips">
                      {result.data.models.slice(0, 20).map((m, idx) => {
                        const mid = getModelId(m);
                        const mname = getModelDisplayName(m);
                        const st = modelStatuses[mid];
                        return (
                          <span
                            key={idx}
                            className={`model-chip ${st || ''}`}
                            title={st === 'failed' ? 'Model did not respond' : st === 'working' ? 'Model is working' : mid}
                          >
                            {st === 'working' && <CheckCircle size={12} />}
                            {st === 'failed' && <XCircle size={12} />}
                            {st === 'testing' && <Loader2 size={12} className="spin" />}
                            {mname}
                          </span>
                        );
                      })}
                      {result.data.models.length > 20 && (
                        <span className="model-chip muted">+{result.data.models.length - 20} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── Chat Launcher ─── */}
                {hasModels && selectedProvider.category === 'chat' && !isChatMode && (
                  <div className="action-section">
                    <p className="action-label">Start a test chat with a model:</p>
                    <div className="action-row">
                      <select
                        className="input-field select-compact"
                        value={selectedModelForChat}
                        onChange={(e) => setSelectedModelForChat(e.target.value)}
                      >
                        {result.data.models.map((m, idx) => {
                          const mid = getModelId(m);
                          const mname = getModelDisplayName(m);
                          const st = modelStatuses[mid];
                          return (
                            <option key={idx} value={mid} style={{ color: '#000' }}>
                              {st === 'working' ? '✓ ' : st === 'failed' ? '✗ ' : ''}{mname}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        className="btn-primary btn-compact"
                        disabled={!selectedModelForChat}
                        onClick={() => setIsChatMode(true)}
                      >
                        <MessageSquare size={16} /> Chat
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TTS Panel ─── */}
                {showTTSPanel && (
                  <div className="action-section tts-section">
                    <div className="action-label-row">
                      <Volume2 size={16} color="var(--accent)" />
                      <p className="action-label" style={{ margin: 0 }}>Test Text-to-Speech</p>
                    </div>

                    <textarea
                      className="input-field tts-textarea"
                      placeholder="Type text to convert to speech…"
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      rows={3}
                    />

                    <div className="action-row">
                      <select
                        className="input-field select-compact"
                        value={ttsVoice}
                        onChange={(e) => setTtsVoice(e.target.value)}
                      >
                        {selectedProvider.id === 'openai' ? (
                          openaiVoices.map(v => <option key={v.id} value={v.id} style={{ color: '#000' }}>{v.name}</option>)
                        ) : (
                          result.data?.models?.map((m, i) => {
                            const vid = typeof m === 'object' ? m.id : m;
                            const vname = typeof m === 'object' ? m.name : m;
                            return <option key={i} value={vid} style={{ color: '#000' }}>{vname}</option>;
                          })
                        )}
                      </select>
                      <button
                        className="btn-primary btn-compact"
                        onClick={handleGenerateTTS}
                        disabled={ttsLoading || !ttsText.trim()}
                      >
                        {ttsLoading ? <Loader2 size={16} className="spin" /> : <><Volume2 size={16} /> Generate</>}
                      </button>
                    </div>

                    {ttsError && (
                      <div className="tts-error">
                        <AlertTriangle size={14} /> {ttsError}
                      </div>
                    )}

                    {ttsAudioUrl && (
                      <div className="tts-player animate-fade-in">
                        <audio
                          ref={audioRef}
                          src={ttsAudioUrl}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <button className="play-btn" onClick={togglePlayPause}>
                          {isPlaying ? <Square size={20} /> : <Play size={20} />}
                        </button>
                        <div className="tts-waveform">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <span key={i} className={`wave-bar ${isPlaying ? 'active' : ''}`} style={{ animationDelay: `${i * 0.05}s` }} />
                          ))}
                        </div>
                        <span className="tts-label">{isPlaying ? 'Playing…' : 'Ready to play'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── Chat Interface ─── */}
            {isChatMode && (
              <div className="chat-container animate-fade-in delay-2">
                <div className="chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={18} color="var(--accent)" />
                    <h3 className="chat-title">Chatting with {selectedModelForChat}</h3>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => setIsChatMode(false)}
                    title="Close Chat"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <div className="chat-empty">
                      <Bot size={44} style={{ opacity: 0.15 }} />
                      <p>Send a message to test <strong>{selectedModelForChat}</strong></p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`chat-message ${msg.role}`}>
                        <div className="chat-message-content" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      </div>
                    ))
                  )}
                  {isChatLoading && (
                    <div className="chat-message assistant">
                      <div className="chat-message-content">
                        <span className="typing-dot">.</span><span className="typing-dot">.</span><span className="typing-dot">.</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    className="input-field"
                    style={{ flex: 1, margin: 0 }}
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isChatLoading}
                  />
                  <button
                    className="btn-primary btn-send"
                    onClick={handleSendMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <footer className="footer animate-fade-in delay-3">
          <p>Built with <span style={{ color: 'var(--accent)' }}>♥</span> — OmniKey validates keys securely without storing them.</p>
          <p className="footer-sub">Supports 12 AI providers · Chat testing · Text-to-Speech · Model health checks</p>
        </footer>
      </div>
    </div>
  );
}
