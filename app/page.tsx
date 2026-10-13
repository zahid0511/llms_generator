"use client";

import { useState } from "react";
import { Copy, Check, Loader2, ArrowRight } from "lucide-react";

export default function Page() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.markdown) {
        setOutput(data.markdown);
      } else {
        alert(data.error || "Failed to generate");
      }
    } catch {
      alert("Network error. Check console.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-16 max-w-4xl mx-auto flex flex-col gap-10">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Rapid <span className="text-emerald-400">/llms.txt</span> Generator
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
          Make your SaaS documentation and APIs discoverable and cleanly parsed by Cursor, Windsurf, Claude, and ChatGPT.
        </p>
      </header>

      <form onSubmit={handleGenerate} className="flex gap-2 max-w-xl mx-auto w-full">
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-5 py-3 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
        </button>
      </form>

      {output && (
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">Generated llms.txt</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Raw"}
            </button>
          </div>
          <pre className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed">
            {output}
          </pre>
        </section>
      )}

      {/* Market Validation Signal (Waitlist) */}
      <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-6 text-center space-y-3 mt-4">
        <h2 className="text-base font-semibold text-zinc-200">
          Want this synced automatically on every Git push?
        </h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          We are building a 1-line GitHub Action that regenerates your <code className="text-emerald-400">/public/llms.txt</code> file whenever your docs change.
        </p>
        {joinedWaitlist ? (
          <p className="text-emerald-400 text-sm font-medium">You are on the list! We will reach out shortly.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (waitlistEmail) setJoinedWaitlist(true);
            }}
            className="flex max-w-sm mx-auto gap-2 pt-2"
          >
            <input
              type="email"
              placeholder="name@company.com"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <button
              type="submit"
              className="bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              Join Waitlist <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}