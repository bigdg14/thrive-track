"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

type UserSummary = { id: string; name?: string | null; image?: string | null; email?: string };

export default function FriendsPage() {
  const [incoming, setIncoming] = useState<Array<any>>([]);
  const [outgoing, setOutgoing] = useState<Array<any>>([]);
  const [friends, setFriends] = useState<Array<UserSummary>>([]);
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<UserSummary>>([]);
  const [suggestions, setSuggestions] = useState<Array<UserSummary>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [incRes, outRes, friRes] = await Promise.all([
        fetch(`/api/social/friends?type=incoming`).then((r) => r.json()),
        fetch(`/api/social/friends?type=outgoing`).then((r) => r.json()),
        fetch(`/api/social/friends?type=friends`).then((r) => r.json()),
      ]);
      setIncoming(incRes.incoming || []);
      setOutgoing(outRes.outgoing || []);
      setFriends(friRes.friends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // load suggestions
    (async () => {
      try {
        const res = await fetch(`/api/social/friends/suggestions`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    let t: any;
    if (searchQuery.trim()) {
      setSearchLoading(true);
      t = setTimeout(async () => {
        try {
          const res = await fetch(`/api/social/friends/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setSearchResults(data.users || []);
        } catch (err) {
          console.error(err);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => clearTimeout(t);
  }, [searchQuery]);

  async function sendRequest() {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/social/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((r) => r.json());
      if (res.friendship) {
        setEmail("");
        await loadAll();
      } else {
        console.error(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function respond(id: string, action: string) {
    setLoading(true);
    try {
      await fetch(`/api/social/friends/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>

      <Card className="p-4 mb-6">
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <input
              className="flex-1 input"
              placeholder="Friend's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={sendRequest} disabled={loading || email.length === 0}>
              Send Request
            </Button>
          </div>

          <div>
            <input
              className="w-full input"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchLoading && <div className="text-sm text-muted-foreground mt-1">Searching...</div>}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {searchResults.map((u) => (
                  <Card key={u.id} className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <img src={u.image || undefined} alt={u.name || u.email || "User"} className="w-8 h-8 rounded-full" />
                      </Avatar>
                      <div>
                        <div className="font-medium">{u.name || u.email}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                    <Button onClick={async () => { setLoading(true); try { const res = await fetch(`/api/social/friends`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id }) }); const data = await res.json(); if (data.friendship) { await loadAll(); setSearchQuery(""); } } catch (err) { console.error(err); } finally { setLoading(false); } }} disabled={loading}>
                      Add
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {suggestions.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Suggestions</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s) => (
                  <Card key={s.id} className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <img src={s.image || undefined} alt={s.name || s.email || "User"} className="w-8 h-8 rounded-full" />
                      </Avatar>
                      <div>
                        <div className="font-medium">{s.name || s.email}</div>
                        <div className="text-sm text-muted-foreground">{s.email}</div>
                      </div>
                    </div>
                    <Button onClick={async () => { setLoading(true); try { const res = await fetch(`/api/social/friends`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: s.id }) }); const data = await res.json(); if (data.friendship) { await loadAll(); setSuggestions((prev) => prev.filter((p) => p.id !== s.id)); } } catch (err) { console.error(err); } finally { setLoading(false); } }} disabled={loading}>
                      Add
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section>
          <h2 className="font-semibold mb-2">Incoming</h2>
          {incoming.length === 0 && <Card className="p-3">No incoming requests</Card>}
          {incoming.map((r: any) => (
            <Card key={r.id} className="p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <img src={r.user.image || undefined} alt={r.user.name || "User"} className="w-10 h-10 rounded-full" />
                </Avatar>
                <div>
                  <div className="font-medium">{r.user.name || r.user.email}</div>
                  <div className="text-sm text-muted-foreground">Requested</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => respond(r.id, "accept")} disabled={loading}>
                  Accept
                </Button>
                <Button variant="ghost" onClick={() => respond(r.id, "decline")} disabled={loading}>
                  Decline
                </Button>
              </div>
            </Card>
          ))}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Outgoing</h2>
          {outgoing.length === 0 && <Card className="p-3">No outgoing requests</Card>}
          {outgoing.map((r: any) => (
            <Card key={r.id} className="p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <img src={r.friend.image || undefined} alt={r.friend.name || "User"} className="w-10 h-10 rounded-full" />
                </Avatar>
                <div>
                  <div className="font-medium">{r.friend.name || r.friend.email}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Friends</h2>
          {friends.length === 0 && <Card className="p-3">No friends yet</Card>}
          {friends.map((f) => (
            <Card key={f.id} className="p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <img src={f.image || undefined} alt={f.name || "User"} className="w-10 h-10 rounded-full" />
                </Avatar>
                <div>
                  <div className="font-medium">{f.name}</div>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
