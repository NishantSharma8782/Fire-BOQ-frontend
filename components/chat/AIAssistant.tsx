"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Bot, User, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { chatApi } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

interface Props {
  projectId: string;
}

const SUGGESTED_QUESTIONS = [
  "Explain this BOQ",
  "Why are these many smoke detectors required?",
  "How is the sprinkler quantity calculated?",
  "What fire standards apply to this project?",
  "What is the hydrant spacing requirement?",
];

const PAGE_SIZE = 30;
const TYPING_SPEED_MS = 10; // ms per character

// ── Typing animation ──────────────────────────────────────────────────────────
function useTypingText(fullText: string, active: boolean) {
  const [displayed, setDisplayed] = useState(active ? "" : fullText);
  const [done, setDone] = useState(!active);

  useEffect(() => {
    if (!active) {
      setDisplayed(fullText);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(id);
        setDone(true);
      }
    }, TYPING_SPEED_MS);
    return () => clearInterval(id);
  }, [fullText, active]);

  return { displayed, done };
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, animate }: { msg: ChatMessage; animate: boolean }) {
  const { displayed, done } = useTypingText(msg.content, animate);
  const text = animate ? displayed : msg.content;

  return (
    <div style={{
      display: "flex",
      flexDirection: msg.role === "user" ? "row-reverse" : "row",
      alignItems: "flex-start",
      gap: 10,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: msg.role === "user"
          ? "linear-gradient(135deg, #ef4444, #f97316)"
          : "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.3))",
        border: msg.role === "user" ? "none" : "1px solid rgba(139,92,246,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {msg.role === "user" ? <User size={14} color="white" /> : <Bot size={14} color="#a78bfa" />}
      </div>

      <div
        className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}
        style={{ maxWidth: "78%", whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: 13 }}
      >
        {text}
        {animate && !done && (
          <span style={{
            display: "inline-block", width: 2, height: "1em",
            background: "#a78bfa", marginLeft: 2, verticalAlign: "middle",
            animation: "blink 0.7s step-end infinite",
          }} />
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIAssistant({ projectId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0);
  const [input, setInput] = useState("");
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load history on first mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const data = await chatApi.getHistory(projectId, 1, PAGE_SIZE);
        if (cancelled) return;
        setTotalPages(data.total_pages);
        setTotalSaved(data.total);
        setCurrentPage(1);
        if (data.messages.length === 0) {
          // No history — show welcome message
          setMessages([{
            role: "assistant",
            content: "Hello! I'm your Fire BOQ AI assistant. I can explain the BOQ calculations, fire system recommendations, and answer questions about fire safety standards for this project. How can I help you?",
          }]);
        } else {
          setMessages(data.messages);
        }
        setHistoryLoaded(true);
      } catch {
        // On error just show welcome message
        setMessages([{
          role: "assistant",
          content: "Hello! I'm your Fire BOQ AI assistant. How can I help you?",
        }]);
        setHistoryLoaded(true);
      }
    }
    loadHistory();
    return () => { cancelled = true; };
  }, [projectId]);

  // ── Load older messages (prepend) ──────────────────────────────────────────
  const handleLoadOlder = async () => {
    if (loadingOlder || currentPage >= totalPages) return;
    setLoadingOlder(true);
    try {
      const nextPage = currentPage + 1;
      const data = await chatApi.getHistory(projectId, nextPage, PAGE_SIZE);
      setMessages(prev => [...data.messages, ...prev]);
      setCurrentPage(nextPage);
    } catch {
      toast.error("Could not load older messages");
    } finally {
      setLoadingOlder(false);
    }
  };

  // ── Scroll to bottom on new message ────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Send mutation ───────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (message: string) => {
      // Send last 8 messages as context (exact same as before)
      const history = messages.slice(-8);
      return chatApi.send(projectId, message, history);
    },
    onSuccess: (res) => {
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: res.reply,
        timestamp: res.timestamp,
      };
      setMessages(prev => {
        const updated = [...prev, aiMsg];
        setAnimatingIdx(updated.length - 1); // animate the last message
        return updated;
      });
      setTotalSaved(prev => prev + 2); // user + AI
    },
    onError: () => {
      toast.error("Failed to get AI response");
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process your question. Please try again." },
      ]);
    },
  });

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sendMutation.isPending) return;
    // Optimistically add user message to state
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setAnimatingIdx(null);
    setInput("");
    sendMutation.mutate(msg);
  };

  const isFirstOpen = historyLoaded && messages.length === 1 && messages[0].role === "assistant";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 300px)", minHeight: 540 }}>

      {/* Header */}
      <div className="glass-card" style={{
        padding: "12px 18px", marginBottom: 10,
        background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))",
          border: "1px solid rgba(139,92,246,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bot size={18} color="#a78bfa" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>Fire BOQ AI Assistant</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Powered by Gemini AI • Ask about BOQ, calculations, standards
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {totalSaved > 0 && (
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 999,
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
              color: "#a78bfa", fontWeight: 600,
            }}>
              {totalSaved} msgs
            </span>
          )}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: "#10b981" }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="glass-card" style={{
        flex: 1, overflowY: "auto", padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 14,
        marginBottom: 10,
      }}>
        {/* Load older */}
        {currentPage < totalPages && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <button
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              style={{
                padding: "5px 16px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                color: "#a78bfa", cursor: loadingOlder ? "wait" : "pointer",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
            >
              {loadingOlder
                ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Loading...</>
                : <><ChevronUp size={12} /> Load older messages</>
              }
            </button>
          </div>
        )}

        {/* History loading skeleton */}
        {!historyLoaded && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <Loader2 size={22} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>Loading chat history...</div>
          </div>
        )}

        {/* Messages list */}
        {historyLoaded && messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            animate={i === animatingIdx && msg.role === "assistant"}
          />
        ))}

        {/* Thinking dots */}
        {sendMutation.isPending && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.3))",
              border: "1px solid rgba(139,92,246,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={14} color="#a78bfa" />
            </div>
            <div className="chat-bubble-assistant" style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s 0.2s infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s 0.4s infinite" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {isFirstOpen && (
        <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center", marginRight: 2 }}>
            <Sparkles size={11} style={{ display: "inline", marginRight: 3 }} />Try:
          </span>
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              style={{
                padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 500,
                background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                color: "#a78bfa", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <input
          className="fire-input"
          placeholder="Ask about BOQ, calculations, fire standards..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={sendMutation.isPending}
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          onClick={() => handleSend()}
          disabled={!input.trim() || sendMutation.isPending}
          style={{ padding: "10px 16px" }}
        >
          {sendMutation.isPending
            ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : <Send size={16} />
          }
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
