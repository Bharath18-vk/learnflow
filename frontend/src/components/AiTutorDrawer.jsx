import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Sparkles,
    Send,
    Loader2,
    Check,
    Copy,
    User
} from "lucide-react";
import { queryAiTutor } from "../services/api";
import "./AiTutorDrawer.css";

function TutorCodeBlock({ code, language }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="tutor-code-block-container">
            <div className="tutor-code-block-header">
                <span className="tutor-code-lang font-mono">{language || 'code'}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`tutor-copy-btn font-mono ${copied ? 'copied' : ''}`}
                >
                    {copied ? (
                        <>
                            <Check size={12} />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="tutor-pre">
                <code className="tutor-code font-code">{code}</code>
            </pre>
        </div>
    );
}

const parseInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={idx} className="tutor-inline-code font-code">{part.slice(1, -1)}</code>;
        }
        return part;
    });
};

const renderFormattedResponse = (text) => {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
        if (part.startsWith('```')) {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const language = match ? match[1] : '';
            const code = match ? match[2] : part.slice(3, -3);

            return (
                <TutorCodeBlock key={index} code={code} language={language} />
            );
        } else {
            const lines = part.split('\n');
            return (
                <div key={index} className="tutor-text-paragraph font-sans">
                    {lines.map((line, lIdx) => {
                        let content = line;
                        
                        if (content.startsWith('### ')) {
                            return <h4 key={lIdx} className="tutor-h4">{parseInline(content.slice(4))}</h4>;
                        }
                        if (content.startsWith('## ')) {
                            return <h3 key={lIdx} className="tutor-h3">{parseInline(content.slice(3))}</h3>;
                        }
                        if (content.startsWith('# ')) {
                            return <h2 key={lIdx} className="tutor-h2">{parseInline(content.slice(2))}</h2>;
                        }

                        if (content.trim().startsWith('* ') || content.trim().startsWith('- ')) {
                            return (
                                <li key={lIdx} className="tutor-bullet">
                                    {parseInline(content.trim().slice(2))}
                                </li>
                            );
                        }

                        if (content.trim().startsWith('1. ') || content.trim().startsWith('2. ') || content.trim().startsWith('3. ') || content.trim().startsWith('4. ')) {
                            return (
                                <div key={lIdx} className="tutor-ordered-item">
                                    {parseInline(content.trim())}
                                </div>
                            );
                        }

                        if (!content.trim()) {
                            return <div key={lIdx} className="tutor-spacer" />;
                        }

                        return <p key={lIdx} className="tutor-p">{parseInline(content)}</p>;
                    })}
                </div>
            );
        }
    });
};

const QUICK_PROMPTS = [
    { label: "💡 Explain Simply", query: "Explain this concept simply with a clear analogy." },
    { label: "💻 Code Example", query: "Show me a clean, practical code example for this." },
    { label: "❓ Practice Question", query: "Ask me a practice question to test my understanding of this step." }
];

export function AiTutorDrawer({ isOpen, onClose, step }) {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [customInput, setCustomInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 250);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && step) {
            fetchInitialGreeting(step);
        }
    }, [step?.id, isOpen]);

    const fetchInitialGreeting = async (currentStep) => {
        setLoading(true);

        try {
            const data = await queryAiTutor(currentStep.id, "explain_simple", "");
            setMessages([
                {
                    id: 'init-1',
                    sender: 'assistant',
                    text: data.answer,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } catch (err) {
            setMessages([
                {
                    id: 'init-err',
                    sender: 'assistant',
                    text: `### 🤖 AI Tutor: ${currentStep.title}\n\nHi! I'm here to help you learn **${currentStep.title}**.\n\nAsk me any question below, or click one of the quick buttons to get started!`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (textToSend) => {
        if (!textToSend.trim() || !step || loading) return;
        const query = textToSend.trim();
        setCustomInput("");
        setLoading(true);

        const userMsg = {
            id: `usr-${Date.now()}`,
            sender: 'user',
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);

        try {
            const data = await queryAiTutor(step.id, "custom", query);
            const aiMsg = {
                id: `ai-${Date.now()}`,
                sender: 'assistant',
                text: data.answer,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg = {
                id: `ai-err-${Date.now()}`,
                sender: 'assistant',
                text: `### 💡 Study Tip for ${step.title}\n\nTo master **${step.title}**, review the curated documentation links in your roadmap and practice with small code experiments!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        sendMessage(customInput);
    };

    if (!isOpen || !step) return null;

    return createPortal(
        <AnimatePresence>
            <div className="tutor-overlay" onClick={onClose}>
                <motion.div 
                    className="tutor-drawer"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 220 }}
                >
                    {/* Header */}
                    <div className="tutor-header">
                        <div className="tutor-title-group">
                            <div className="bot-avatar">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3>AI Learning Assistant</h3>
                                <p className="tutor-subtitle">Topic: {step.title}</p>
                            </div>
                        </div>
                        <button className="tutor-close-btn" onClick={onClose} aria-label="Close AI Tutor">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="tutor-body">
                        <div className="tutor-messages-stream">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`tutor-chat-row ${msg.sender}`}>
                                    {msg.sender === 'assistant' ? (
                                        <div className="tutor-msg-avatar assistant">
                                            <Sparkles size={14} />
                                        </div>
                                    ) : (
                                        <div className="tutor-msg-avatar user">
                                            <User size={14} />
                                        </div>
                                    )}

                                    <div className={`tutor-bubble ${msg.sender}`}>
                                        <div className="tutor-bubble-header">
                                            <span className="bubble-author">
                                                {msg.sender === 'assistant' ? 'AI Tutor' : 'You'}
                                            </span>
                                            <span className="bubble-time">{msg.timestamp}</span>
                                        </div>

                                        <div className="tutor-bubble-content">
                                            {renderFormattedResponse(msg.text)}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="tutor-chat-row assistant">
                                    <div className="tutor-msg-avatar assistant">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="tutor-bubble assistant typing-bubble">
                                        <div className="typing-dots">
                                            <Loader2 size={14} className="tutor-spin-icon" />
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="tutor-quick-chips">
                        {QUICK_PROMPTS.map((qp, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className="tutor-chip-btn"
                                onClick={() => sendMessage(qp.query)}
                                disabled={loading}
                            >
                                {qp.label}
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <form className="tutor-footer-input" onSubmit={handleCustomSubmit}>
                        <input 
                            ref={inputRef}
                            type="text"
                            placeholder={`Ask a question about ${step.title}...`}
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            disabled={loading}
                            className="tutor-text-input"
                        />
                        <button 
                            type="submit" 
                            disabled={loading || !customInput.trim()} 
                            aria-label="Send Message"
                            className="tutor-send-btn"
                        >
                            {loading ? <Loader2 size={16} className="tutor-spin-icon" /> : <Send size={16} />}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}

export default AiTutorDrawer;
