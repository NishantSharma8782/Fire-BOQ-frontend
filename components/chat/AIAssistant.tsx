"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Bot, User, ChevronUp, Loader2, Sparkles, Mic } from "lucide-react";
import { chatApi } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

interface Props {
  projectId: string;
}

const SUGGESTED_QUESTIONS = [
  "Explain this BOQ",
  "Why so many smoke detectors?",
  "How is sprinkler quantity calculated?",
  "What fire standards apply here?",
  "What is hydrant spacing requirement?",
];

const PAGE_SIZE = 30;
const TYPING_SPEED_MS = 10;

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
  const isUser = msg.role === "user";

  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 10,
      padding: "0 4px",
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg, #ef4444, #f97316)"
          : "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.4))",
        border: isUser ? "none" : "1px solid rgba(139,92,246,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isUser
          ? "0 2px 8px rgba(239,68,68,0.3)"
          : "0 2px 8px rgba(139,92,246,0.2)",
      }}>
        {isUser ? <User size={15} color="white" /> : <Bot size={15} color="#c4b5fd" />}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: "75%",
        background: isUser
          ? "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(249,115,22,0.18))"
          : "rgba(255,255,255,0.05)",
        border: isUser
          ? "1px solid rgba(239,68,68,0.3)"
          : "1px solid rgba(255,255,255,0.1)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px",
        fontSize: 14,
        lineHeight: 1.65,
        color: "var(--text-primary)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load history ─────────────────────────────────────────────────────────────
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
          setMessages([{
            role: "assistant",
            content: "Hello! I'm your Fire BOQ AI assistant 🔥\n\nI can explain BOQ calculations, fire system recommendations, and answer questions about fire safety standards for this project.\n\nHow can I help you?",
          }]);
        } else {
          setMessages(data.messages);
        }
        setHistoryLoaded(true);
      } catch {
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

  // ── Load older messages ────────────────────────────────────────────────────
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

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Send mutation ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (message: string) => {
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
        setAnimatingIdx(updated.length - 1);
        return updated;
      });
      setTotalSaved(prev => prev + 2);
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
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setAnimatingIdx(null);
    setInput("");
    sendMutation.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isFirstOpen = historyLoaded && messages.length === 1 && messages[0].role === "assistant";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 290px)",
      minHeight: 480,
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid rgba(139,92,246,0.15)",
      background: "rgba(10,14,30,0.6)",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "14px 18px",
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))",
        borderBottom: "1px solid rgba(139,92,246,0.15)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))",
          border: "1px solid rgba(139,92,246,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(139,92,246,0.2)",
        }}>
          <Bot size={20} color="#c4b5fd" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#c4b5fd" }}>Fire BOQ AI Assistant</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Powered by AI • BOQ, calculations, fire standards
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {totalSaved > 0 && (
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 999,
              background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
              color: "#a78bfa", fontWeight: 600,
            }}>
              {totalSaved} msgs
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>Online</span>
          </div>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* Load older */}
        {currentPage < totalPages && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <button
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              style={{
                padding: "6px 18px", borderRadius: 999, fontSize: 11, fontWeight: 600,
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

        {/* History loading */}
        {!historyLoaded && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Loader2 size={24} color="#a78bfa" style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading chat history...</div>
          </div>
        )}

        {/* Messages */}
        {historyLoaded && messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            animate={i === animatingIdx && msg.role === "assistant"}
          />
        ))}

        {/* Thinking indicator */}
        {sendMutation.isPending && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "0 4px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.4))",
              border: "1px solid rgba(139,92,246,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={15} color="#c4b5fd" />
            </div>
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "18px 18px 18px 4px",
              padding: "12px 18px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s infinite" }} />
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s 0.2s infinite" }} />
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s 0.4s infinite" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggested Questions ── */}
      {isFirstOpen && (
        <div style={{
          padding: "10px 14px 4px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Sparkles size={12} color="#a78bfa" />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Suggested questions</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                style={{
                  padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 500,
                  background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                  color: "#a78bfa", cursor: "pointer", transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.1)"; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Area ── */}
      <div style={{
        padding: "12px 14px",
        borderTop: "1px solid rgba(139,92,246,0.12)",
        background: "rgba(0,0,0,0.15)",
        flexShrink: 0,
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
      }}>
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            ref={inputRef}
            className="fire-input"
            placeholder="Ask about BOQ, fire standards, calculations..."
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            disabled={sendMutation.isPending}
            rows={1}
            style={{
              width: "100%",
              resize: "none",
              overflow: "hidden",
              minHeight: 42,
              maxHeight: 120,
              lineHeight: "1.5",
              paddingTop: 10,
              paddingBottom: 10,
              fontFamily: "inherit",
              fontSize: 14,
              borderRadius: 12,
            }}
          />
        </div>
        <button
          className="btn-primary"
          onClick={() => handleSend()}
          disabled={!input.trim() || sendMutation.isPending}
          style={{
            padding: "11px 16px",
            borderRadius: 12,
            flexShrink: 0,
            alignSelf: "flex-end",
          }}
          title="Send message (Enter)"
        >
          {sendMutation.isPending
            ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            : <Send size={18} />
          }
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes pulse { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.6; transform:scale(1.1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
