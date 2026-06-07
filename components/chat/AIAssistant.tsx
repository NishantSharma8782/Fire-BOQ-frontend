"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Bot, User, MessageSquare, Sparkles } from "lucide-react";
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

export default function AIAssistant({ projectId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Fire BOQ AI assistant. I can explain the BOQ calculations, fire system recommendations, and answer questions about fire safety standards for this project. How can I help you?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      chatApi.send(projectId, message, messages.slice(-8)),
    onSuccess: (res) => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: res.reply, timestamp: res.timestamp },
      ]);
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
    setInput("");
    sendMutation.mutate(msg);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 620 }}>
      {/* Header */}
      <div className="glass-card" style={{
        padding: "14px 20px", marginBottom: 12,
        background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)",
        display: "flex", alignItems: "center", gap: 10
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))",
          border: "1px solid rgba(139,92,246,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Bot size={19} color="#a78bfa" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>Fire BOQ AI Assistant</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Powered by Gemini AI • Ask about BOQ, calculations, standards
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: "#10b981" }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="glass-card" style={{
        flex: 1, overflowY: "auto", padding: 16,
        display: "flex", flexDirection: "column", gap: 12,
        marginBottom: 12
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-start", gap: 10
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: msg.role === "user"
                ? "linear-gradient(135deg, #ef4444, #f97316)"
                : "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.3))",
              border: msg.role === "user" ? "none" : "1px solid rgba(139,92,246,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {msg.role === "user"
                ? <User size={14} color="white" />
                : <Bot size={14} color="#a78bfa" />
              }
            </div>
            <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}>
              {msg.content}
            </div>
          </div>
        ))}

        {sendMutation.isPending && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.3))",
              border: "1px solid rgba(139,92,246,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Bot size={14} color="#a78bfa" />
            </div>
            <div className="chat-bubble-assistant" style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s 0.2s infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "bounce 0.6s 0.4s infinite" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              style={{
                padding: "5px 12px", borderRadius: 999,
                fontSize: 11, fontWeight: 500,
                background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                color: "#a78bfa", cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
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
          <Send size={16} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
