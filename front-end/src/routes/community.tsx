import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ProtectedRoute from "../components/ProtectedRoute";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — Agent Apply" },
      { name: "description", content: "Connect with other creatives on their hunt." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <ProtectedRoute>
      <Community />
    </ProtectedRoute>
  );
}


type PostTag = "Win 🏆" | "Tip 💡" | "Rant 😤";

interface Post {
  id: string;
  tag: PostTag;
  text: string;
  username: string;
  timestamp: number;
  likes: number;
  likedByMe: boolean;
}

const INITIAL_POSTS: Post[] = [
  { id: "1", tag: "Win 🏆", text: "Got a callback from a startup I cold-emailed using Agent Apply. First response in 2 days!", username: "HungryDev_42", timestamp: Date.now() - 1000 * 60 * 60 * 2, likes: 24, likedByMe: false },
  { id: "2", tag: "Tip 💡", text: "Keep your tailored resume under 1 page. Recruiters at small companies hate scrolling.", username: "ResumeNinja_7", timestamp: Date.now() - 1000 * 60 * 60 * 24, likes: 18, likedByMe: false },
  { id: "3", tag: "Tip 💡", text: "Adding the exact job title from the posting into your subject line doubled my response rate.", username: "CodeCrafter_99", timestamp: Date.now() - 1000 * 60 * 60 * 48, likes: 45, likedByMe: false },
  { id: "4", tag: "Win 🏆", text: "Landed an internship at a fintech in Bangalore. 4 applications sent, 1 reply, 1 offer.", username: "InternHustle_1", timestamp: Date.now() - 1000 * 60 * 60 * 72, likes: 89, likedByMe: false },
  { id: "5", tag: "Rant 😤", text: "Applied to 12 places this week. 11 ghosted. The 1 reply asked for 3 years experience for an internship.", username: "TiredCoder_00", timestamp: Date.now() - 1000 * 60 * 60 * 96, likes: 112, likedByMe: false },
  { id: "6", tag: "Tip 💡", text: "Don't skip the email body. A 3-line personal note gets more replies than a formal letter.", username: "ByteScribe_22", timestamp: Date.now() - 1000 * 60 * 60 * 120, likes: 56, likedByMe: false },
];

const USERNAMES = ["HungryDev_42", "ResumeNinja_7", "CodeCrafter_99", "InternHustle_1", "TiredCoder_00", "ByteScribe_22", "PixelPusher_8", "DataWizard_11"];

function getRelativeTime(timestamp: number) {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysDifference === 0) {
    const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60));
    if (hoursDifference === 0) return "just now";
    return rtf.format(hoursDifference, "hour");
  }
  return rtf.format(daysDifference, "day");
}

function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeTag, setActiveTag] = useState<PostTag>("Win 🏆");
  
  useEffect(() => {
    const saved = localStorage.getItem("communityPosts");
    if (saved) {
      setPosts(JSON.parse(saved));
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem("communityPosts", JSON.stringify(INITIAL_POSTS));
    }
  }, []);

  const handlePost = () => {
    if (!inputText.trim()) return;
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9),
      tag: activeTag,
      text: inputText,
      username: USERNAMES[Math.floor(Math.random() * USERNAMES.length)],
      timestamp: Date.now(),
      likes: 0,
      likedByMe: false,
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem("communityPosts", JSON.stringify(updated));
    setInputText("");
    toast.success("Posted to community!");
  };

  const handleLike = (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
          likedByMe: !p.likedByMe,
        };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem("communityPosts", JSON.stringify(updated));
  };

  const getTagColor = (tag: PostTag) => {
    if (tag.includes("Win")) return "bg-sage/20 text-sage border-sage";
    if (tag.includes("Tip")) return "bg-sand/20 text-sand border-sand";
    return "bg-terracotta/20 text-terracotta border-terracotta"; // Rant
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Hero Strip */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-cream mb-2">The Hunting Ground</h1>
          <p className="text-mutedtext">Real wins. Real tips. From people in the same hunt as you.</p>
        </div>
        <div className="flex gap-4 justify-center md:justify-end">
          <div className="rounded-column bg-cardbg border border-cardborder px-4 py-2">
            <div className="text-2xl font-bold text-cream">1,240</div>
            <div className="text-[10px] uppercase tracking-wider text-mutedtext">Applications Sent</div>
          </div>
          <div className="rounded-column bg-cardbg border border-cardborder px-4 py-2">
            <div className="text-2xl font-bold text-cream">38</div>
            <div className="text-[10px] uppercase tracking-wider text-mutedtext">Interviews Landed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          {/* Composer */}
          <div className="rounded-card border border-cardborder bg-cardbg p-4 shadow-[var(--shadow-glow)]">
            <textarea
              className="w-full resize-none rounded-card border border-darkbg bg-darkbg px-4 py-3 text-sm text-cream placeholder:text-mutedtext focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              rows={3}
              placeholder="Share a win, a tip, or a lesson..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {(["Win 🏆", "Tip 💡", "Rant 😤"] as PostTag[]).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeTag === tag
                        ? "bg-terracotta text-darkbg shadow-[var(--shadow-glow-strong)]"
                        : "bg-darkbg text-mutedtext hover:bg-cardbg-hover hover:text-cream"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePost}
                disabled={!inputText.trim()}
                className="rounded-card bg-terracotta px-5 py-2 text-sm font-bold uppercase tracking-wider text-darkbg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                Post to Community
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-card border border-cardborder bg-cardbg p-5 transition-all hover:border-terracotta/50"
                style={{ animation: "var(--animate-slide-in)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cream text-sm">{post.username}</span>
                    <span className="text-xs text-mutedtext">{getRelativeTime(post.timestamp)}</span>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getTagColor(post.tag)}`}>
                    {post.tag}
                  </span>
                </div>
                <p className="text-cream/90 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {post.text}
                </p>
                <div className="flex items-center gap-4 border-t border-cardborder pt-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors active:scale-90 ${
                      post.likedByMe ? "text-terracotta" : "text-mutedtext hover:text-cream"
                    }`}
                  >
                    <svg className="w-4 h-4" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="rounded-column border border-cardborder bg-cardbg p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sand mb-4">Top Tips This Week</h3>
            <ul className="space-y-4">
              <li className="text-sm text-mutedtext leading-snug">
                <span className="text-cream font-semibold block mb-1">Target Companies, Not Listings</span>
                Finding HR emails directly bypasses the ATS black hole.
              </li>
              <li className="text-sm text-mutedtext leading-snug">
                <span className="text-cream font-semibold block mb-1">Tailor Relentlessly</span>
                Even a 2-line personalized intro email boosts replies.
              </li>
              <li className="text-sm text-mutedtext leading-snug">
                <span className="text-cream font-semibold block mb-1">Follow Up</span>
                Wait 4 days, then reply to your own email asking if they saw it.
              </li>
            </ul>
          </div>

          <div className="rounded-column border border-cardborder bg-cardbg p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sage mb-4 flex items-center justify-between">
              Active Hunters
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sage"></span>
              </span>
            </h3>
            <ul className="space-y-3">
              {["ReactNinja_2", "GoDev_88", "DataScientist_Pro", "InternHustle_4", "DesignSystem_1"].map((u) => (
                <li key={u} className="flex items-center gap-2 text-sm text-cream">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage"></span>
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
