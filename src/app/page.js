"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Cpu, Sparkles, Brain, CheckCircle, XCircle, Key, Activity, Zap, Box, Network, Globe, MessageSquare, Send } from 'lucide-react';

const providers = [
  { id: 'openai', name: 'OpenAI', icon: <Bot size={20} color="#10a37f" />, description: 'GPT-4, GPT-3.5 APIs' },
  { id: 'anthropic', name: 'Anthropic', icon: <Brain size={20} color="#d97757" />, description: 'Claude 3 Opus, Sonnet' },
  { id: 'gemini', name: 'Google Gemini', icon: <Sparkles size={20} color="#4285f4" />, description: 'Gemini 1.5 Pro, Flash' },
  { id: 'mistral', name: 'Mistral AI', icon: <Activity size={20} color="#f97316" />, description: 'Mistral Large, Mixtral' },
  { id: 'groq', name: 'Groq', icon: <Zap size={20} color="#ef4444" />, description: 'Llama 3, Mixtral on Groq LPU' },
  { id: 'cohere', name: 'Cohere', icon: <Cpu size={20} color="#8b5cf6" />, description: 'Command R, R+' },
  { id: 'nvidia', name: 'NVIDIA API', icon: <Box size={20} color="#76b900" />, description: 'NVIDIA NIM Microservices' },
  { id: 'deepseek', name: 'DeepSeek', icon: <Network size={20} color="#4d6bfe" />, description: 'DeepSeek Coder & Chat' },
  { id: 'together', name: 'Together AI', icon: <Globe size={20} color="#2563eb" />, description: 'Open Source Models' }
];

export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState(providers[0]);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { status: 'success' | 'error', message: string, data?: any }
  
  // Chat State
  const [isChatMode, setIsChatMode] = useState(false);
  const [selectedModelForChat, setSelectedModelForChat] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  const handleValidate = async () => {
    if (!apiKey) return;
    setIsLoading(true);
    setResult(null);
    setIsChatMode(false);
    setSelectedModelForChat('');
    setChatMessages([]);

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
        body: JSON.stringify({
          apiKey,
          model: selectedModelForChat,
          messages: newMessages
        }),
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

  return (
    <div className="container animate-fade-in delay-1">
      <header className="header">
        <h1>OmniKey</h1>
        <p>A unified, secure validation platform for AI model API keys. Check permissions, validity, and connectivity instantly without exposing your keys to the browser.</p>
      </header>

      <div className="grid-container">
        {/* Sidebar */}
        <div className="sidebar animate-fade-in delay-2">
          {providers.map((p) => (
            <div 
              key={p.id} 
              className={`provider-item ${selectedProvider.id === p.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedProvider(p);
                setResult(null);
                setApiKey('');
                setIsChatMode(false);
                setChatMessages([]);
              }}
            >
              <div className="provider-icon">{p.icon}</div>
              <div className="provider-info">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="glass-panel animate-fade-in delay-3" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' }}>
              {selectedProvider.icon}
            </div>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '600' }}>{selectedProvider.name} Validation</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Enter your API key below to securely test connectivity.</p>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Key size={20} style={{ position: 'absolute', top: '18px', left: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              className="input-field" 
              style={{ paddingLeft: '48px' }}
              placeholder={`sk_... (Enter ${selectedProvider.name} Key)`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            />
          </div>

          <button className="btn-primary" onClick={handleValidate} disabled={!apiKey || isLoading}>
            {isLoading ? <div className="loader"></div> : 'Validate API Key'}
          </button>

          {/* Results Box */}
          {result && (
            <div className={`result-box animate-fade-in ${result.status}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {result.status === 'success' ? <CheckCircle color="var(--success)" /> : <XCircle color="var(--error)" />}
                <h3 style={{ fontSize: '1.2rem', color: result.status === 'success' ? 'var(--success)' : 'var(--error)' }}>
                  {result.message}
                </h3>
              </div>
              
              {result.status === 'success' && result.data?.models && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.9rem' }}>
                    Successfully connected and fetched {result.data.models.length} accessible model(s).
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.data.models.slice(0, 10).map((m, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>
                        {typeof m === 'object' ? JSON.stringify(m) : String(m)}
                      </span>
                    ))}
                    {result.data.models.length > 10 && (
                      <span style={{ padding: '4px 10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        +{result.data.models.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {result.status === 'success' && result.data?.models && !isChatMode && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.95rem' }}>
                    Choose a model to start a test chat:
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                      className="input-field" 
                      style={{ padding: '10px', height: '45px', flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}
                      value={selectedModelForChat}
                      onChange={(e) => setSelectedModelForChat(e.target.value)}
                    >
                      {result.data.models.map((m, idx) => {
                        const modelName = typeof m === 'object' ? (m.id || m.name) : m;
                        return (
                          <option key={idx} value={modelName} style={{ color: '#000' }}>
                            {modelName}
                          </option>
                        );
                      })}
                    </select>
                    <button 
                      className="btn-primary" 
                      style={{ height: '45px', width: 'auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      disabled={!selectedModelForChat}
                      onClick={() => setIsChatMode(true)}
                    >
                      <MessageSquare size={18} /> Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          {isChatMode && (
            <div className="chat-container animate-fade-in delay-2" style={{ marginTop: '20px' }}>
              <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Chatting with {selectedModelForChat}</h3>
                </div>
                <button 
                  className="btn-icon" 
                  onClick={() => setIsChatMode(false)}
                  title="Close Chat"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <XCircle size={22} />
                </button>
              </div>
              
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto' }}>
                    <Bot size={48} style={{ opacity: 0.2, margin: '0 auto 15px', display: 'block' }} />
                    <p style={{ fontSize: '1rem' }}>Send a message to test {selectedModelForChat}.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                      <div className="chat-message-content" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
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
                  className="btn-primary" 
                  style={{ width: '50px', height: '50px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
