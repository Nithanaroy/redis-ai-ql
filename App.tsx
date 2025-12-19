
import React, { useState, useRef, useEffect } from 'react';
import { EXAMPLES } from './constants';
import { generateRedisResponse, ChatMessage, RedisContext } from './services/geminiService';
import { GenerationResult } from './types';

const Header: React.FC = () => (
  <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">RedisQuery AI</h1>
          <p className="text-xs text-slate-400 font-medium">Full Context Discovery Mode</p>
        </div>
      </div>
      <div className="flex space-x-3">
        <button className="hidden md:block text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold">Docs</button>
        <span className="hidden md:block text-slate-700">|</span>
        <button className="hidden md:block text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold">Insight</button>
      </div>
    </div>
  </header>
);

const DiscoverySection: React.FC<{
  title: string;
  cmd: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  color: string;
}> = ({ title, cmd, value, onChange, placeholder, color }) => {
  const handleCopy = () => navigator.clipboard.writeText(cmd);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col mb-4 last:mb-0">
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{title}</span>
        <button 
          onClick={handleCopy}
          className="text-[9px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 border border-slate-700 transition-colors"
        >
          Copy Cmd
        </button>
      </div>
      <div className="bg-slate-950 p-2 border-b border-slate-800">
        <code className="text-[10px] font-mono text-emerald-500/80 break-all">{cmd}</code>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent p-3 font-mono text-[11px] focus:outline-none resize-none text-slate-300 min-h-[80px]"
      />
    </div>
  );
};

const MessageBubble: React.FC<{ msg: ChatMessage; result?: GenerationResult }> = ({ msg, result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result?.command) {
      navigator.clipboard.writeText(result.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] bg-slate-800 border border-slate-700 rounded-2xl rounded-tr-none px-4 py-3 text-slate-200 shadow-sm">
          <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text.split("\n\nQUERY: ").pop()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[95%] w-full bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none overflow-hidden shadow-xl">
        <div className="bg-slate-950/50 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600"></div>
            Suggested Command
          </span>
          {result && (
            <button onClick={handleCopy} className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition-all text-slate-400 hover:text-white border border-slate-700">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        <div className="p-4">
          <pre className="font-mono text-xs md:text-sm text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed mb-4">
            {result?.command || "Processing..."}
          </pre>
          <div className="flex gap-2 items-start mt-2 pt-3 border-t border-slate-800/50">
            <svg className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-400 italic">{result?.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [ctx, setCtx] = useState<RedisContext>({
    keyPatterns: EXAMPLES[0].keyPatterns,
    sampleData: EXAMPLES[0].sampleData,
    indexInfo: EXAMPLES[0].indexInfo,
    otherMetadata: EXAMPLES[0].otherMetadata
  });
  
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<number, GenerationResult>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, loading]);

  const handleSend = async () => {
    if (!userInput.trim() || loading) return;

    const currentInput = userInput;
    setUserInput('');
    setError(null);

    const newUserMsg: ChatMessage = { role: 'user', parts: [{ text: currentInput }] };
    setChatHistory(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const response = await generateRedisResponse(ctx, chatHistory, currentInput);
      const modelMsg: ChatMessage = { role: 'model', parts: [{ text: JSON.stringify(response) }] };
      setChatHistory(prev => [...prev, modelMsg]);
      setResultsMap(prev => ({ ...prev, [chatHistory.length + 1]: response }));
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setChatHistory(prev => prev.slice(0, -1));
      setUserInput(currentInput);
    } finally {
      setLoading(false);
    }
  };

  const applyExample = (ex: (typeof EXAMPLES)[0]) => {
    setCtx({
      keyPatterns: ex.keyPatterns,
      sampleData: ex.sampleData,
      indexInfo: ex.indexInfo,
      otherMetadata: ex.otherMetadata
    });
    setChatHistory([]);
    setResultsMap({});
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <Header />

      <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Sidebar: Database Explorer */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Database Explorer</h2>
            <div className="flex gap-1">
              {EXAMPLES.map((ex, idx) => (
                <button key={idx} onClick={() => applyExample(ex)} className="text-[10px] w-5 h-5 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors">
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            <DiscoverySection 
              title="1. Key Patterns"
              cmd="SCAN 0 MATCH * COUNT 10"
              value={ctx.keyPatterns}
              onChange={(v) => setCtx({...ctx, keyPatterns: v})}
              placeholder="e.g. user:{id}:profile, active_orders (ZSET)"
              color="text-red-500"
            />
            <DiscoverySection 
              title="2. Sample Data"
              cmd="HGETALL <key> or JSON.GET <key>"
              value={ctx.sampleData}
              onChange={(v) => setCtx({...ctx, sampleData: v})}
              placeholder="Paste raw output from HGETALL or JSON.GET here..."
              color="text-amber-500"
            />
            <DiscoverySection 
              title="3. Search Indexes"
              cmd="FT.INFO <index-name>"
              value={ctx.indexInfo}
              onChange={(v) => setCtx({...ctx, indexInfo: v})}
              placeholder="Paste index attributes from FT.INFO..."
              color="text-emerald-500"
            />
            <DiscoverySection 
              title="4. System Context"
              cmd="INFO Modules / TS.INFO <key>"
              value={ctx.otherMetadata}
              onChange={(v) => setCtx({...ctx, otherMetadata: v})}
              placeholder="TTLs, relationship logic, or module specific data..."
              color="text-blue-500"
            />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-140px)] bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h2 className="text-sm font-semibold text-slate-200">Engineer Terminal</h2>
            </div>
            <button onClick={() => { setChatHistory([]); setResultsMap({}); }} className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-bold tracking-widest transition-colors">Clear Stream</button>
          </div>

          <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-2">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-30 grayscale pointer-events-none">
                <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50 shadow-inner">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Initialize Translation</h3>
                  <p className="text-sm max-w-sm mx-auto leading-relaxed">Fill the discovery tasks on the left with data from Redis Insight, then ask for a query or paste an error here.</p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => <MessageBubble key={idx} msg={msg} result={resultsMap[idx]} />)
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs text-center font-medium animate-in fade-in slide-in-from-top-2">{error}</div>}
          </div>

          <div className="p-4 bg-slate-900/50 border-t border-slate-800/50">
            <div className="relative group">
              <textarea 
                rows={1} 
                value={userInput} 
                onChange={(e) => { setUserInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                placeholder="Ask for a command or paste a stack trace..." 
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 pr-16 focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 outline-none transition-all shadow-xl resize-none text-sm max-h-48 scrollbar-hide text-slate-200"
              />
              <button 
                onClick={handleSend} 
                disabled={loading || !userInput.trim()} 
                className="absolute right-2.5 top-2.5 bottom-2.5 w-11 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-slate-700 rounded-full"></div> Enter to send</span>
              <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-slate-700 rounded-full"></div> Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-slate-900/50 bg-slate-950 py-3">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center opacity-40">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Context-Aware Redis Engine</span>
          <span className="text-[10px] text-slate-400 font-medium">Powered by Gemini-3-Pro</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
