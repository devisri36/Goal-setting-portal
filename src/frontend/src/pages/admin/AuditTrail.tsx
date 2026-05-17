import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, Search, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuditLog } from "../../hooks/useAdmin";
import type { AuditLog } from "../../lib/types";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fieldBadgeColor(field: string): string {
  const f = field.toLowerCase();
  if (f.includes("weightage")) return "bg-chart-4/15 text-chart-4";
  if (f.includes("target")) return "bg-chart-2/15 text-chart-2";
  if (f.includes("status")) return "bg-primary/15 text-primary";
  if (f.includes("title") || f.includes("description"))
    return "bg-chart-3/15 text-chart-3";
  return "bg-muted text-muted-foreground";
}

function AuditRow({ log, index }: { log: AuditLog; index: number }) {
  return (
    <div
      className="flex items-start gap-4 py-4 border-b border-border last:border-0 group"
      data-ocid={`audit.row.${index}`}
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Shield size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">
            {log.changedByName}
          </span>
          <span className="text-xs text-muted-foreground">modified</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fieldBadgeColor(log.field)}`}
          >
            {log.field}
          </span>
          <span className="text-xs text-muted-foreground">on goal</span>
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
            {log.goalId.slice(0, 8)}…
          </code>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive font-mono line-through">
            {log.oldValue || "(empty)"}
          </span>
          <ArrowRight
            size={12}
            className="text-muted-foreground flex-shrink-0"
          />
          <span className="px-2 py-0.5 rounded bg-chart-2/10 text-chart-2 font-mono">
            {log.newValue || "(empty)"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 mt-1">
        <Clock size={11} />
        <span>{formatTimestamp(log.timestamp)}</span>
      </div>
    </div>
  );
}

export default function AuditTrail() {
  const { data: logs, isLoading } = useAuditLog();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!logs) return [];
    const q = search.toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.changedByName.toLowerCase().includes(q) ||
        l.field.toLowerCase().includes(q) ||
        l.goalId.toLowerCase().includes(q) ||
        l.oldValue.toLowerCase().includes(q) ||
        l.newValue.toLowerCase().includes(q),
    );
  }, [logs, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    for (const log of filtered) {
      const ms = Number(log.timestamp / 1_000_000n);
      const dateKey = new Date(ms).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      // sort descending by date string (newest first)
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [filtered]);

  return (
    <div className="p-6 space-y-6" data-ocid="audit_trail.page">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Field-level log of all changes made to goals after the lock date
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-semibold gap-1">
          <Shield size={11} />
          {isLoading ? "—" : `${logs?.length ?? 0} entries`}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search by name, field, value, goal ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-sm"
          data-ocid="audit_trail.search_input"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Change History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" data-ocid="audit_trail.loading_state">
              {["s0", "s1", "s2", "s3", "s4", "s5"].map((k) => (
                <div key={k} className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center"
              data-ocid="audit_trail.empty_state"
            >
              <Shield
                size={36}
                className="mx-auto text-muted-foreground/40 mb-2"
              />
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "No entries match your search"
                  : "No audit entries yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? "Try a different search term"
                  : "Changes to locked goals will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([dateKey, dateLogs]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      {dateKey}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {dateLogs.map((log, i) => (
                    <AuditRow key={log.id} log={log} index={i + 1} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
