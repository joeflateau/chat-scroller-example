import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface Message {
  id: number;
  text: string;
  sender: "me" | "them";
  time: string;
}

const scriptedMessages: { text: string; sender: "me" | "them" }[] = [
  { text: "Hey! How's it going?", sender: "them" },
  { text: "Pretty good! Just messing around with CSS stuff", sender: "me" },
  {
    text: "Did you see the new overflow-anchor spec? Pretty neat.",
    sender: "them",
  },
  { text: "Wait what's that?", sender: "me" },
  {
    text: "It keeps the scroll pinned without any JS scroll hacks.",
    sender: "them",
  },
  {
    text: "The trick is to put overflow-anchor: none on every message…",
    sender: "them",
  },
  {
    text: "…and overflow-anchor: auto on a tiny sentinel at the bottom.",
    sender: "them",
  },
  { text: "Oh interesting, so the browser does the work?", sender: "me" },
  {
    text: "The browser's scroll anchoring algorithm does the rest!",
    sender: "them",
  },
  { text: "Try scrolling up — you'll see it stops pinning.", sender: "them" },
  { text: "Ok lemme try", sender: "me" },
  { text: "Whoa yeah it disengages when I scroll up", sender: "me" },
  {
    text: "Then scroll back down and it re-engages automatically.",
    sender: "them",
  },
  {
    text: "No requestAnimationFrame, no scrollTop = scrollHeight. Pure CSS.",
    sender: "them",
  },
  { text: "That's way cleaner than what we have in prod lol", sender: "me" },
  {
    text: "Works in Chrome, Edge, and Firefox. Safari is still catching up.",
    sender: "them",
  },
  { text: "Of course Safari 🙄", sender: "me" },
  {
    text: "Pretty cool for chat UIs, logs, terminal output, feeds…",
    sender: "them",
  },
  { text: "We should use this for the activity feed too", sender: "me" },
  { text: "Totally. Anyway, want to grab lunch later?", sender: "them" },
  { text: "I'm thinking tacos. 🌮", sender: "them" },
  { text: "Or maybe ramen. 🍜", sender: "them" },
  { text: "Tacos 100%", sender: "me" },
  { text: "Let's do it. 12:30?", sender: "them" },
  { text: "Perfect see you there 👍", sender: "me" },
  { text: "btw can you review my PR before lunch?", sender: "them" },
  { text: "Sure just send me the link", sender: "me" },
  { text: "Already assigned you, check your notifications", sender: "them" },
  { text: "Got it, looking now", sender: "me" },
  {
    text: "Thanks! It's a small one, mostly just the anchor stuff",
    sender: "them",
  },
];

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Welcome to the overflow-anchor chat demo!",
      sender: "them",
      time: timestamp(),
    },
    {
      id: 2,
      text: "Type a message below or just watch the auto-replies roll in.",
      sender: "them",
      time: timestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [paused, setPaused] = useState(false);
  const nextId = useRef(3);
  const botIndex = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const addMessage = useCallback((text: string, sender: "me" | "them") => {
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, text, sender, time: timestamp() },
    ]);
  }, []);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    addMessage(text, "me");
    setInput("");

    if (botIndex.current < scriptedMessages.length) {
      const next = scriptedMessages[botIndex.current++];
      setTimeout(
        () => addMessage(next.text, next.sender),
        600 + Math.random() * 800,
      );
    }
  }, [input, addMessage]);

  // Scroll to bottom on mount so scrollTop > 0 (spec requires it for anchoring)
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Auto-generate messages forever, looping through the script
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const next = scriptedMessages[botIndex.current % scriptedMessages.length];
      botIndex.current++;
      addMessage(next.text, next.sender);
    }, 400);
    return () => clearInterval(interval);
  }, [addMessage, paused]);

  // Track whether anchor is visible (i.e. user is at bottom)
  useEffect(() => {
    const anchor = anchorRef.current;
    const scroller = scrollerRef.current;
    if (!anchor || !scroller) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAtBottom(entry.isIntersecting),
      { root: scroller, threshold: 0 },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <div className="flex flex-col h-dvh bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="font-semibold text-lg">overflow-anchor Chat</span>
        <button
          onClick={() => setPaused((p) => !p)}
          className="ml-auto px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer transition-colors"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </header>

      {/* Info banner */}
      <div className="px-4 py-2 bg-slate-900/60 text-center text-xs text-slate-500 border-b border-slate-800 shrink-0">
        Scroll anchoring keeps you pinned to the bottom via{" "}
        <code className="text-rose-400">overflow-anchor: none</code> on messages
        + <code className="text-rose-400">overflow-anchor: auto</code> on a
        sentinel element. Scroll up to break the anchor.{" "}
        <a
          href="https://github.com/joeflateau/chat-scroller-example"
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose-400 underline hover:text-rose-300"
        >
          View source on GitHub
        </a>
      </div>

      {/* Chat area */}
      <div
        id="scroller"
        ref={scrollerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <div id="scroll-content" className="flex flex-col gap-2 justify-end">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed animate-[fadeIn_0.15s_ease] ${
                msg.sender === "me"
                  ? "self-end bg-indigo-600 rounded-br-sm"
                  : "self-start bg-slate-800 border border-slate-700 rounded-bl-sm"
              }`}
            >
              {msg.text}
              <div className="text-[0.65rem] text-slate-400 mt-1">
                {msg.time}
              </div>
            </div>
          ))}
        </div>
        {/* Anchor — direct child of scroller, not inside scroll-content */}
        <div id="anchor" ref={anchorRef} />
      </div>

      {/* Scroll to bottom button */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute right-6 bottom-20 z-20 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center shadow-lg cursor-pointer transition-all"
        >
          ↓
        </button>
      )}

      {/* Composer — overlaps scroller bottom, anchor sits behind it */}
      <div className="relative z-10 -mt-[50px] flex gap-2 px-4 py-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-sm outline-none focus:border-rose-500 placeholder:text-slate-500"
        />
        <button
          onClick={sendMessage}
          className="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm cursor-pointer transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
