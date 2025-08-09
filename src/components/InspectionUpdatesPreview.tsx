import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";

interface UpdateItem {
  evidenceId: string;
  updated_at: string;
  status: "green" | "amber" | "red" | "na";
  comment: string;
  evidenceText: string;
  categoryId: string;
  categoryName: string;
  panelId: string;
  panelName: string;
}

function getQuarterDateRange(year: number, quarter: string) {
  const startMonth = quarter === 'Q1' ? 0 : quarter === 'Q2' ? 3 : quarter === 'Q3' ? 6 : 9;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(startMonth === 9 ? year + 1 : year, (startMonth + 3) % 12, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export function InspectionUpdatesPreview({ year, quarter }: { year: number; quarter: string }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!profile?.company_id) return;
      setLoading(true);
      try {
        const { start, end } = getQuarterDateRange(year, quarter);
        const [respRes, panelsRes, categoriesRes, evidenceRes] = await Promise.all([
          supabase
            .from('inspection_company_responses')
            .select('evidence_id, updated_at, status, comment')
            .eq('company_id', profile.company_id)
            .gte('updated_at', start)
            .lt('updated_at', end),
          supabase.from('inspection_panels').select('id, name'),
          supabase.from('inspection_categories').select('id, name, panel_id'),
          supabase.from('inspection_evidence').select('id, category_id, evidence_text'),
        ]);

        if (respRes.error || panelsRes.error || categoriesRes.error || evidenceRes.error) {
          console.error('Inspection preview load error', { respError: respRes.error, panelsError: panelsRes.error, categoriesError: categoriesRes.error, evidenceError: evidenceRes.error });
          setUpdates([]);
          return;
        }

        const evToCat = new Map((evidenceRes.data || []).map((e: any) => [e.id, { category_id: e.category_id, evidence_text: e.evidence_text }]));
        const catToPanel = new Map((categoriesRes.data || []).map((c: any) => [c.id, { panel_id: c.panel_id, name: c.name }]));
        const panelToName = new Map((panelsRes.data || []).map((p: any) => [p.id, p.name]));
        const catToName = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.name]));

        const items: UpdateItem[] = (respRes.data || []).map((r: any) => {
          const ev = evToCat.get(r.evidence_id);
          const catId = ev?.category_id;
          const panelId = catToPanel.get(catId)?.panel_id;
          return {
            evidenceId: r.evidence_id,
            updated_at: r.updated_at,
            status: (r.status || 'green') as any,
            comment: r.comment || '',
            evidenceText: ev?.evidence_text || '',
            categoryId: catId,
            categoryName: (catToName.get(catId) as string) || 'Unknown',
            panelId,
            panelName: (panelToName.get(panelId) as string) || 'Unknown',
          } as UpdateItem;
        }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        setUpdates(items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.company_id, year, quarter]);

  const groupedByPanel = useMemo(() => {
    const map = new Map<string, { panelName: string; items: UpdateItem[] }>();
    updates.forEach(u => {
      const key = u.panelId || 'unknown';
      if (!map.has(key)) {
        map.set(key, { panelName: u.panelName || 'Unknown Panel', items: [] });
      }
      map.get(key)!.items.push(u);
    });
    return Array.from(map.values());
  }, [updates]);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading inspection updates…</div>;
  }

  if (!updates.length) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No inspection updates recorded for {quarter} {year}.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      {groupedByPanel.map(({ panelName, items }) => (
        <Card key={panelName}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{panelName}</CardTitle>
              <Badge variant="secondary">{items.length} update{items.length !== 1 ? 's' : ''}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 rounded border border-border/30 bg-muted/20">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-sm font-medium">{it.categoryName}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={it.status as any} />
                    <span className="text-xs text-muted-foreground">{new Date(it.updated_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
                <div className="text-sm text-foreground mb-1">{it.evidenceText || '—'}</div>
                {it.comment && (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{it.comment}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
