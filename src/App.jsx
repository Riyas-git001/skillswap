import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// ─── DESIGN TOKENS ──────────────────────────────────────
const C = {
  bg:         "#0a0e17",
  surface:    "#111827",
  border:     "#1e2d45",
  accent:     "#00d4aa",
  accentDim:  "#003d30",
  accentText: "#00ffcc",
  blue:       "#3b82f6",
  blueDim:    "#1e3a5f",
  muted:      "#4a5568",
  text:       "#e2e8f0",
  soft:       "#94a3b8",
};

// ─── TINY SHARED COMPONENTS ─────────────────────────────

const Avatar = ({ name = "", size = 38 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${C.accent}22`, border: `1.5px solid ${C.accent}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: C.accent,
    }}>{initials || "?"}</div>
  );
};

const SkillTag = ({ children, color = "accent", onRemove }) => {
  const palette = {
    accent: { bg: C.accentDim, text: C.accentText, border: "#005544" },
    blue:   { bg: C.blueDim,   text: "#93c5fd",    border: "#1e3a5f" },
    muted:  { bg: "#1e293b",   text: C.soft,       border: C.border  },
  };
  const p = palette[color] || palette.accent;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: p.bg, color: p.text, border: `1px solid ${p.border}`,
      padding: "4px 11px", borderRadius: 999, fontSize: 12, fontWeight: 500,
      fontFamily: "'DM Mono', monospace", margin: "3px 4px 3px 0",
    }}>
      {children}
      {onRemove && (
        <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.6, fontSize: 11 }}>✕</span>
      )}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { bg: "#2d2000", color: "#f59e0b" },
    accepted: { bg: C.accentDim, color: C.accentText },
    rejected: { bg: "#2d0a0a", color: "#f87171" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, padding: "3px 10px",
      borderRadius: 999, fontSize: 11, fontWeight: 600, textTransform: "capitalize",
    }}>{status}</span>
  );
};

const Btn = ({ onClick, children, variant = "primary", style = {} }) => {
  const variants = {
    primary: { background: C.accent,  color: "#000",   border: "none" },
    blue:    { background: C.blue,    color: "#fff",   border: "none" },
    danger:  { background: "transparent", color: "#f87171", border: "1px solid #f87171" },
    ghost:   { background: "#1e293b", color: C.text,   border: "none" },
  };
  return (
    <button onClick={onClick} style={{
      ...variants[variant], borderRadius: 8, padding: "8px 16px",
      fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      ...style,
    }}>{children}</button>
  );
};

const InputField = ({ value, onChange, placeholder, onKeyDown, type = "text" }) => (
  <input
    type={type} value={value} onChange={onChange}
    placeholder={placeholder} onKeyDown={onKeyDown}
    style={{
      width: "100%", background: C.bg, border: `1px solid ${C.border}`,
      color: C.text, borderRadius: 8, padding: "10px 13px",
      fontSize: 13, outline: "none", fontFamily: "inherit", marginBottom: 12,
    }}
  />
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 14, padding: 22, marginBottom: 16, ...style,
  }}>{children}</div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: C.soft,
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14,
  }}>{children}</div>
);

// ─── NAV CONFIG ─────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "skills",    icon: "✦", label: "My Skills"  },
  { id: "matches",   icon: "◈", label: "Matches"    },
  { id: "requests",  icon: "⇄", label: "Requests"   },
  { id: "chat",      icon: "◉", label: "Chat"       },
];

// ─── AUTH SCREEN ────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    if (!data.user) return alert("Signup failed.");
    const { error: profileError } = await supabase.from("profiles").insert([{
      id: data.user.id, name, skills_offered: [], skills_required: [], time_credits: 0,
    }]);
    if (profileError) return alert(profileError.message);
    alert("Signup successful! Please login.");
    setIsLogin(true);
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    onLogin(data.user);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.bg, fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <div style={{
        width: "100%", maxWidth: 420, background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 20,
        padding: "40px 36px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⇄</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>SkillSwap</span>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", background: C.bg, borderRadius: 9, marginBottom: 24, padding: 4, gap: 4 }}>
          {["Login", "Sign Up"].map((label, i) => {
            const active = isLogin ? i === 0 : i === 1;
            return (
              <button key={label} onClick={() => setIsLogin(i === 0)} style={{
                flex: 1, padding: "9px", border: "none", borderRadius: 7, cursor: "pointer",
                background: active ? C.surface : "transparent",
                color: active ? C.accentText : C.soft,
                fontWeight: active ? 700 : 500, fontSize: 13, fontFamily: "inherit",
                transition: "all 0.15s",
              }}>{label}</button>
            );
          })}
        </div>

        {!isLogin && (
          <InputField value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
        )}
        <InputField value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <InputField type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />

        <button onClick={isLogin ? handleLogin : handleSignup} style={{
          width: "100%", padding: 12, background: C.accent, color: "#000",
          border: "none", borderRadius: 9, fontWeight: 800, fontSize: 14,
          cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 4,
        }}>{isLogin ? "Login →" : "Create Account →"}</button>
      </div>
    </div>
  );
}

// ─── DASHBOARD TAB ──────────────────────────────────────
function DashboardTab({ profile, requests, matchedUsers }) {
  const pendingCount = requests.filter(r => r.receiver_id && r.status === "pending").length;
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>
          Welcome back, {profile.name?.split(" ")[0]} 👋
        </div>
        <div style={{ fontSize: 13, color: C.soft, marginTop: 4 }}>
          {pendingCount} pending swap request{pendingCount !== 1 ? "s" : ""} · {matchedUsers.length} skill matches found
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { icon: "⏱", value: profile.time_credits ?? 0, label: "Time Credits" },
          { icon: "◈", value: matchedUsers.length,        label: "Matches"      },
          { icon: "⇄", value: requests.length,            label: "Total Swaps"  },
          { icon: "✓", value: requests.filter(r => r.status === "accepted").length, label: "Accepted" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: 120, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.soft, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Skills snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionLabel>Skills I Offer</SectionLabel>
          <div>{(profile.skills_offered || []).map(s => <SkillTag key={s}>{s}</SkillTag>)}</div>
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "16px 0" }} />
          <SectionLabel>Skills I Want</SectionLabel>
          <div>{(profile.skills_required || []).map(s => <SkillTag key={s} color="blue">{s}</SkillTag>)}</div>
        </Card>

        <Card>
          <SectionLabel>Recent Requests</SectionLabel>
          {requests.slice(0, 4).map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: `${C.blue}22`,
                border: `1.5px solid ${C.blue}55`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 12, color: C.blue, fontWeight: 700,
              }}>⇄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{r.skill}</div>
                <div style={{ fontSize: 11, color: C.soft }}>{r.status}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
          {requests.length === 0 && <div style={{ color: C.muted, fontSize: 13 }}>No requests yet.</div>}
        </Card>
      </div>
    </div>
  );
}

// ─── SKILLS TAB ─────────────────────────────────────────
function SkillsTab({ profile, user, onRefresh }) {
  const [newOfferedSkill, setNewOfferedSkill] = useState("");
  const [newRequiredSkill, setNewRequiredSkill] = useState("");

  const addOfferedSkill = async () => {
    if (!newOfferedSkill.trim()) return;
    const updated = [...(profile.skills_offered || []), newOfferedSkill.trim()];
    await supabase.from("profiles").update({ skills_offered: updated }).eq("id", user.id);
    setNewOfferedSkill("");
    onRefresh();
  };

  const addRequiredSkill = async () => {
    if (!newRequiredSkill.trim()) return;
    const updated = [...(profile.skills_required || []), newRequiredSkill.trim()];
    await supabase.from("profiles").update({ skills_required: updated }).eq("id", user.id);
    setNewRequiredSkill("");
    onRefresh();
  };

  // Remove a skill by filtering it out of the array and saving to Supabase
  const removeOfferedSkill = async (skillToRemove) => {
    const updated = (profile.skills_offered || []).filter(s => s !== skillToRemove);
    await supabase.from("profiles").update({ skills_offered: updated }).eq("id", user.id);
    onRefresh();
  };

  const removeRequiredSkill = async (skillToRemove) => {
    const updated = (profile.skills_required || []).filter(s => s !== skillToRemove);
    await supabase.from("profiles").update({ skills_required: updated }).eq("id", user.id);
    onRefresh();
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>My Skills</div>
      <div style={{ fontSize: 13, color: C.soft, marginBottom: 24 }}>Click the ✕ on any skill to remove it.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Offered */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, display: "inline-block" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>Skills I Offer</span>
          </div>
          <div style={{ minHeight: 50, marginBottom: 14 }}>
            {(profile.skills_offered || []).map((s, i) => (
              <SkillTag key={i} onRemove={() => removeOfferedSkill(s)}>{s}</SkillTag>
            ))}
            {(profile.skills_offered || []).length === 0 && <span style={{ color: C.muted, fontSize: 13 }}>None added yet.</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newOfferedSkill} onChange={e => setNewOfferedSkill(e.target.value)}
              placeholder="Skill you can teach…"
              onKeyDown={e => e.key === "Enter" && addOfferedSkill()}
              style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "9px 13px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <Btn onClick={addOfferedSkill}>+ Add</Btn>
          </div>
        </Card>

        {/* Required */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, display: "inline-block" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>Skills I Want</span>
          </div>
          <div style={{ minHeight: 50, marginBottom: 14 }}>
            {(profile.skills_required || []).map((s, i) => (
              <SkillTag key={i} color="blue" onRemove={() => removeRequiredSkill(s)}>{s}</SkillTag>
            ))}
            {(profile.skills_required || []).length === 0 && <span style={{ color: C.muted, fontSize: 13 }}>None added yet.</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newRequiredSkill} onChange={e => setNewRequiredSkill(e.target.value)}
              placeholder="Skill you want to learn…"
              onKeyDown={e => e.key === "Enter" && addRequiredSkill()}
              style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "9px 13px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <Btn onClick={addRequiredSkill} variant="blue">+ Add</Btn>
          </div>
        </Card>
      </div>

      <div style={{ background: C.accentDim, border: `1px solid #005544`, borderRadius: 14, padding: 18, marginTop: 4, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 26 }}>⏱</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.accentText }}>You have {profile.time_credits ?? 0} time credits</div>
          <div style={{ fontSize: 12, color: "#7ecfc0", marginTop: 3 }}>Each completed swap earns 1 credit. Credits unlock high-demand skill requests.</div>
        </div>
      </div>
    </div>
  );
}

// ─── MATCHES TAB ────────────────────────────────────────
function MatchesTab({ matchedUsers, profile, user, onRefresh }) {
  const sendSwapRequest = async (receiverId, skill) => {
    const { error } = await supabase.from("swap_requests").insert([{
      requester_id: user.id, receiver_id: receiverId, skill, status: "pending",
    }]);
    if (error) return alert(error.message);
    alert("Swap request sent!");
    onRefresh();
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Skill Matches</div>
      <div style={{ fontSize: 13, color: C.soft, marginBottom: 24 }}>
        {matchedUsers.length} users can teach skills you want to learn.
      </div>

      {matchedUsers.length === 0 && (
        <Card>
          <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "20px 0" }}>
            No matches yet. Add skills you want to learn to find matches!
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {matchedUsers.map(u => {
          const matchingSkill = profile.skills_required?.find(s => u.skills_offered?.includes(s));
          return (
            <div key={u.id} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16,
            }}>
              <Avatar name={u.name} size={46} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: C.soft, marginBottom: 6 }}>Offers:</div>
                <div>
                  {(u.skills_offered || []).map((s, i) => (
                    <SkillTag key={i} color={profile.skills_required?.includes(s) ? "accent" : "muted"}>{s}</SkillTag>
                  ))}
                </div>
              </div>
              <Btn onClick={() => sendSwapRequest(u.id, matchingSkill)}>
                Send Request ⇄
              </Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REQUESTS TAB ───────────────────────────────────────
function RequestsTab({ requests, user, onRefresh }) {
  const acceptRequest = async (req) => {
    // 1. Mark the swap as accepted
    await supabase.from("swap_requests").update({ status: "accepted" }).eq("id", req.id);

    // 2. Give +1 credit to receiver (the person accepting)
    const { data: receiverProfile } = await supabase
      .from("profiles").select("time_credits").eq("id", req.receiver_id).single();
    if (receiverProfile) {
      await supabase.from("profiles")
        .update({ time_credits: (receiverProfile.time_credits || 0) + 1 })
        .eq("id", req.receiver_id);
    }

    // 3. Give +1 credit to requester (the person who sent the request)
    const { data: requesterProfile } = await supabase
      .from("profiles").select("time_credits").eq("id", req.requester_id).single();
    if (requesterProfile) {
      await supabase.from("profiles")
        .update({ time_credits: (requesterProfile.time_credits || 0) + 1 })
        .eq("id", req.requester_id);
    }

    onRefresh();
  };

  const rejectRequest = async (reqId) => {
    await supabase.from("swap_requests").update({ status: "rejected" }).eq("id", reqId);
    onRefresh();
  };

  const incoming = requests.filter(r => r.receiver_id === user.id);
  const outgoing = requests.filter(r => r.requester_id === user.id);

  const Section = ({ title, items }) => (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>{title} ({items.length})</SectionLabel>
      {items.length === 0 && <div style={{ color: C.muted, fontSize: 13, padding: "10px 0" }}>None yet.</div>}
      {items.map(req => (
        <div key={req.id} style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "16px 20px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: req.receiver_id === user.id ? `${C.accent}22` : `${C.blue}22`,
            border: `1.5px solid ${req.receiver_id === user.id ? C.accent : C.blue}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: req.receiver_id === user.id ? C.accent : C.blue,
          }}>⇄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              {req.receiver_id === user.id ? "Incoming" : "Outgoing"} · <span style={{ color: C.accentText }}>{req.skill}</span>
            </div>
            <div style={{ fontSize: 12, color: C.soft, marginTop: 2 }}>
              {req.receiver_id === user.id ? "Someone wants your skill" : "You requested this skill"}
            </div>
          </div>
          <StatusBadge status={req.status} />
          {req.receiver_id === user.id && req.status === "pending" && (
            <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
              <Btn onClick={() => acceptRequest(req)}>Accept</Btn>
              <Btn onClick={() => rejectRequest(req.id)} variant="danger">Reject</Btn>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Swap Requests</div>
      <div style={{ fontSize: 13, color: C.soft, marginBottom: 24 }}>Review and manage all swap requests.</div>
      <Section title="Incoming" items={incoming} />
      <Section title="Outgoing" items={outgoing} />
    </div>
  );
}

// ─── CHAT TAB ───────────────────────────────────────────
function ChatTab({ requests, user, messages, activeSwap, onOpenChat, newMessage, setNewMessage, onSendMessage, messagesEndRef }) {
  const acceptedSwaps = requests.filter(r => r.status === "accepted");

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Chat</div>
      <div style={{ fontSize: 13, color: C.soft, marginBottom: 20 }}>Coordinate your skill swaps.</div>

      <div style={{ display: "flex", gap: 16, height: 480 }}>
        {/* Contact list */}
        <div style={{ width: 210, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px 10px", fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Swaps</div>
          {acceptedSwaps.length === 0 && (
            <div style={{ padding: "12px 16px", color: C.muted, fontSize: 13 }}>No active swaps yet.</div>
          )}
          {acceptedSwaps.map(req => (
            <div key={req.id}
              onClick={() => onOpenChat(req)}
              style={{
                padding: "12px 16px", cursor: "pointer",
                background: activeSwap?.id === req.id ? C.accentDim : "transparent",
                borderLeft: activeSwap?.id === req.id ? `3px solid ${C.accent}` : "3px solid transparent",
              }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{req.skill}</div>
              <div style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>
                {req.requester_id === user.id ? "You requested" : "They requested"}
              </div>
            </div>
          ))}
        </div>

        {/* Chat panel */}
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!activeSwap ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>
              Select a swap to start chatting
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${C.accent}22`, border: `1.5px solid ${C.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 14 }}>⇄</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Swap: {activeSwap.skill}</div>
                  <div style={{ fontSize: 11, color: C.accent }}>● Active swap</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender_id === user.id ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "68%", padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
                      borderRadius: msg.sender_id === user.id ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: msg.sender_id === user.id ? C.accent : C.bg,
                      color: msg.sender_id === user.id ? "#000" : C.text,
                    }}>
                      {msg.sender_id !== user.id && (
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, color: C.accentText }}>
                          {msg.profiles?.name || "User"}
                        </div>
                      )}
                      {msg.message}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div style={{ color: C.muted, fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages yet. Say hello!</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && onSendMessage()}
                  placeholder="Type a message…"
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "9px 13px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                <Btn onClick={onSendMessage}>Send ↑</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────
function App() {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [requests, setRequests]       = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [activeSwap, setActiveSwap]   = useState(null);
  const [messages, setMessages]       = useState([]);
  const [newMessage, setNewMessage]   = useState("");
  const [loading, setLoading]         = useState(true);
  const chatChannelRef    = useRef(null);
  const swapChannelRef    = useRef(null);
  const profileChannelRef = useRef(null);
  const messagesEndRef    = useRef(null);

  // Hash-based routing so browser back/forward buttons work
  const getTabFromHash = () => {
    const hash = window.location.hash.replace("#", "");
    const valid = ["dashboard", "skills", "matches", "requests", "chat"];
    return valid.includes(hash) ? hash : "dashboard";
  };
  const [activeTab, setActiveTab] = useState(getTabFromHash);

  const navigateTo = (tab) => {
    window.location.hash = tab;
    setActiveTab(tab);
  };

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!data) return;
    setProfile(data);
    fetchRequests(userId);
    subscribeToSwaps(userId);
    subscribeToProfile(userId);
    findMatches(data, userId);
  };

  const fetchRequests = async (userId) => {
    const { data } = await supabase.from("swap_requests").select("*")
      .or(`receiver_id.eq.${userId},requester_id.eq.${userId}`);
    setRequests(data || []);
  };

  const subscribeToSwaps = (userId) => {
    if (swapChannelRef.current) supabase.removeChannel(swapChannelRef.current);
    const channel = supabase
      .channel(`swap_requests:user=${userId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "swap_requests" },
        () => fetchRequests(userId)
      )
      .subscribe();
    swapChannelRef.current = channel;
  };

  // Subscribe to profile changes — keeps credits + skills live
  const subscribeToProfile = (userId) => {
    if (profileChannelRef.current) supabase.removeChannel(profileChannelRef.current);
    const channel = supabase
      .channel(`profiles:id=eq.${userId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          // Directly update profile state from the live payload — no extra fetch needed
          setProfile(payload.new);
        }
      )
      .subscribe();
    profileChannelRef.current = channel;
  };

  const findMatches = async (currentProfile, userId) => {
    if (!currentProfile?.skills_required?.length) { setMatchedUsers([]); return; }
    const { data } = await supabase.from("profiles").select("*").neq("id", userId);
    if (!data) return;
    const matches = data.filter(other =>
      other.skills_offered?.some(skill => currentProfile.skills_required.includes(skill))
    );
    setMatchedUsers(matches);
  };

  // Fetch all messages for a swap once, then subscribe for new ones live
  const openChatWithRealtime = async (swapId) => {
    // 1. Unsubscribe from any previous chat channel
    if (chatChannelRef.current) {
      await supabase.removeChannel(chatChannelRef.current);
      chatChannelRef.current = null;
    }

    // 2. Load existing messages
    const { data } = await supabase
      .from("messages")
      .select("id, message, sender_id, created_at, profiles(name)")
      .eq("swap_id", swapId)
      .order("created_at", { ascending: true });
    setMessages(data || []);

    // 3. Subscribe to new INSERT events on this swap's messages
    const channel = supabase
      .channel(`messages:swap_id=eq.${swapId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `swap_id=eq.${swapId}` },
        async (payload) => {
          // Fetch the full message row with the sender's profile name
          const { data: newMsg } = await supabase
            .from("messages")
            .select("id, message, sender_id, created_at, profiles(name)")
            .eq("id", payload.new.id)
            .single();
          if (newMsg) setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    chatChannelRef.current = channel;
  };

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (chatChannelRef.current)    supabase.removeChannel(chatChannelRef.current);
      if (swapChannelRef.current)    supabase.removeChannel(swapChannelRef.current);
      if (profileChannelRef.current) supabase.removeChannel(profileChannelRef.current);
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeSwap) return;
    setNewMessage(""); // clear input immediately for snappy feel
    await supabase.from("messages").insert([{
      swap_id: activeSwap.id,
      sender_id: user.id,
      message: newMessage.trim(),
    }]);
    // No need to re-fetch — the realtime subscription above will catch the new row
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (swapChannelRef.current)    supabase.removeChannel(swapChannelRef.current);
    if (chatChannelRef.current)    supabase.removeChannel(chatChannelRef.current);
    if (profileChannelRef.current) supabase.removeChannel(profileChannelRef.current);
    setUser(null); setProfile(null); setRequests([]);
    setMatchedUsers([]); setActiveSwap(null);
  };

  const refresh = () => user && fetchProfile(user.id);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.soft, fontFamily: "sans-serif" }}>
      Loading…
    </div>
  );

  if (!user) return <AuthScreen onLogin={async (u) => { setUser(u); await fetchProfile(u.id); }} />;

  // Guard: user is set but profile hasn't loaded yet — show spinner instead of crashing
  if (!profile) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.soft, fontFamily: "sans-serif" }}>
      Loading profile…
    </div>
  );

  const pendingCount = requests.filter(r => r.receiver_id === user.id && r.status === "pending").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        input::placeholder { color: ${C.muted}; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Logo */}
          <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⇄</div>
              <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: C.text }}>SkillSwap</span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "12px 10px", flex: 1 }}>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => navigateTo(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                background: activeTab === item.id ? C.accentDim : "transparent",
                color: activeTab === item.id ? C.accentText : C.soft,
                fontSize: 13, fontWeight: activeTab === item.id ? 700 : 500,
                marginBottom: 2, textAlign: "left", fontFamily: "inherit", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
                {item.id === "requests" && pendingCount > 0 && (
                  <span style={{ marginLeft: "auto", background: C.accent, color: "#000", borderRadius: 999, fontSize: 10, fontWeight: 800, padding: "2px 7px" }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar name={profile?.name || ""} size={32} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.name}</div>
                <div style={{ fontSize: 10, color: C.soft }}>⏱ {profile?.time_credits ?? 0} credits</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              width: "100%", padding: "8px", background: "transparent",
              border: `1px solid ${C.border}`, color: "#f87171",
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>Sign Out</button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
          {activeTab === "dashboard" && (
            <DashboardTab profile={profile} requests={requests} matchedUsers={matchedUsers} />
          )}
          {activeTab === "skills" && (
            <SkillsTab profile={profile} user={user} onRefresh={refresh} />
          )}
          {activeTab === "matches" && (
            <MatchesTab matchedUsers={matchedUsers} profile={profile} user={user} onRefresh={refresh} />
          )}
          {activeTab === "requests" && (
            <RequestsTab requests={requests} user={user} onRefresh={refresh} />
          )}
          {activeTab === "chat" && (
            <ChatTab
              requests={requests} user={user}
              messages={messages} activeSwap={activeSwap}
              onOpenChat={(req) => { setActiveSwap(req); openChatWithRealtime(req.id); }}
              newMessage={newMessage} setNewMessage={setNewMessage}
              onSendMessage={sendMessage}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default App;