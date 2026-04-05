import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import RoleBadge from "@/components/RoleBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Trash2, Download, Search, Users, FileText, Settings, BadgeCheck, ShoppingBag, Eye, CheckCircle2, XCircle, Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { exportArticlesToPDF } from "@/lib/pdf-export";
import type { Role } from "@/lib/types";
import type { ICMembership } from "@/hooks/useICMembership";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ROLE_LABELS } from "@/lib/types";
import VoucherManager from "@/components/admin/VoucherManager";
import PopupManager from "@/components/admin/PopupManager";
import MaintenanceToggle from "@/components/admin/MaintenanceToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserRow {
  user_id: string;
  username: string;
  display_name: string;
  created_at: string;
  joined_at: string | null;
  role: Role;
  hasInnerCircle: boolean;
  membership?: ICMembership | null;
}

interface StoryRow {
  id: string;
  title: string;
  user_id: string;
  is_draft: boolean;
  published_at: string | null;
  views: number;
  content: string | null;
  subtitle: string | null;
  author_name: string;
  author_username: string;
}

interface ICOrder {
  id: string;
  user_id: string;
  email: string;
  plan: string;
  transfer_proof_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  username?: string;
  display_name?: string;
}

const ITEMS_PER_PAGE = 20;

const getMonthYearKey = (dateStr: string | null) => {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const groupByMonth = <T,>(items: T[], dateKey: keyof T): { label: string; items: T[] }[] => {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = getMonthYearKey(item[dateKey] as string | null);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  });
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
};

const SimplePagination = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 pt-4 pb-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">1</button>
          {start > 2 && <span className="text-xs text-muted-foreground px-1">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors ${
            p === page ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-xs text-muted-foreground px-1">…</span>}
          <button onClick={() => onPageChange(totalPages)} className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

const CollapsibleMonthGroup = ({
  label,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: (paginatedRange: { start: number; end: number }) => React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {count}
        </span>
      </button>
      {isOpen && (
        <div>
          {children({ start, end })}
          <SimplePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const { isFounder, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [storyUserFilter, setStoryUserFilter] = useState<string>("all");
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [deleteStoryTarget, setDeleteStoryTarget] = useState<{ id: string; title: string } | null>(null);

  // IC Orders state
  const [orders, setOrders] = useState<ICOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [icPlanDialog, setIcPlanDialog] = useState<{ userId: string; displayName: string } | null>(null);
  const [memberships, setMemberships] = useState<Map<string, ICMembership>>(new Map());

  // Inner Circle feature toggle
  const { data: innerCircleEnabled, refetch: refetchSetting } = useQuery({
    queryKey: ["site-settings", "inner_circle_enabled"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "inner_circle_enabled")
        .single();
      return (data?.value as any)?.enabled ?? false;
    },
  });

  const toggleInnerCircleFeature = async () => {
    const newValue = !innerCircleEnabled;
    await supabase
      .from("site_settings")
      .update({ value: { enabled: newValue }, updated_at: new Date().toISOString() })
      .eq("key", "inner_circle_enabled");
    refetchSetting();
    toast.success(newValue ? "Inner Circle enabled (★‿★)" : "Inner Circle disabled");
  };

  const canAccessAdmin = isFounder || isAdmin;

  useEffect(() => {
    if (!loading && !canAccessAdmin) navigate("/");
  }, [loading, canAccessAdmin]);

  useEffect(() => {
    fetchUsers();
    fetchStories();
    fetchOrders();
    fetchMemberships();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!profiles) return;
    const userIds = profiles.map((p) => p.user_id);
    const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", userIds);

    const rolesByUser = new Map<string, string[]>();
    (roles || []).forEach((r) => {
      const existing = rolesByUser.get(r.user_id) || [];
      existing.push(r.role);
      rolesByUser.set(r.user_id, existing);
    });

    setUsers(
      profiles.map((p) => {
        const userRoles = rolesByUser.get(p.user_id) || [];
        const primaryRole = userRoles.find((r) => r !== "inner_circle") || "writer";
        const hasInnerCircle = userRoles.includes("inner_circle");
        return {
          user_id: p.user_id,
          username: p.username,
          display_name: p.display_name,
          created_at: p.created_at,
          joined_at: (p as any).joined_at || p.created_at,
          role: primaryRole as Role,
          hasInnerCircle,
        };
      })
    );
  };

  const fetchStories = async () => {
    const { data: storiesData } = await supabase
      .from("stories")
      .select("*")
      .eq("is_draft", false)
      .order("published_at", { ascending: false });
    if (!storiesData) return setStories([]);
    const userIds = [...new Set(storiesData.map((s) => s.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    setStories(
      storiesData.map((s: any) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        content: s.content,
        user_id: s.user_id,
        is_draft: s.is_draft,
        published_at: s.published_at,
        views: s.views,
        author_name: profileMap.get(s.user_id)?.display_name || "unknown",
        author_username: profileMap.get(s.user_id)?.username || "unknown",
      }))
    );
  };

  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from("ic_orders")
      .select("*")
      .order("created_at", { ascending: false }) as any;
    if (!ordersData) return setOrders([]);

    const userIds = [...new Set((ordersData as any[]).map((o: any) => o.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setOrders(
      (ordersData as any[]).map((o: any) => ({
        ...o,
        username: profileMap.get(o.user_id)?.username || "unknown",
        display_name: profileMap.get(o.user_id)?.display_name || "unknown",
      }))
    );
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      result = result.filter(
        (u) => u.username.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, userSearch]);

  const filteredStories = useMemo(() => {
    let result = stories;
    if (storyUserFilter !== "all") {
      result = result.filter((s) => s.user_id === storyUserFilter);
    }
    if (storySearch.trim()) {
      const q = storySearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.author_name.toLowerCase().includes(q) ||
          s.author_username.toLowerCase().includes(q)
      );
    }
    return result;
  }, [stories, storyUserFilter, storySearch]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderStatusFilter !== "all") {
      result = result.filter((o) => o.status === orderStatusFilter);
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.email.toLowerCase().includes(q) ||
          (o.username || "").toLowerCase().includes(q) ||
          (o.display_name || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, orderStatusFilter, orderSearch]);

  // Grouped data for collapsible sections
  const groupedUsers = useMemo(() => groupByMonth(filteredUsers, "joined_at"), [filteredUsers]);
  const groupedOrders = useMemo(() => groupByMonth(filteredOrders, "created_at"), [filteredOrders]);
  const groupedStories = useMemo(() => groupByMonth(filteredStories, "published_at"), [filteredStories]);


  const pendingCount = useMemo(() => orders.filter((o) => o.status === "pending").length, [orders]);

  const changeRole = async (userId: string, newRole: Role) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).neq("role", "inner_circle");
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    toast.success("role updated (◕‿◕)");
    fetchUsers();
  };

  const updateJoinDate = async (userId: string, dateStr: string) => {
    if (!dateStr) return;
    const joined = new Date(dateStr).toISOString();
    await supabase.from("profiles").update({ joined_at: joined } as any).eq("user_id", userId);
    toast.success("join date updated (◕‿◕)");
    fetchUsers();
  };

  const toggleInnerCircle = async (userId: string, currentlyHas: boolean) => {
    if (currentlyHas) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "inner_circle");
      toast.success("Inner Circle removed");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "inner_circle" as any });
      toast.success("Inner Circle granted (★‿★)");
    }
    fetchUsers();
  };

  const deleteStory = async () => {
    if (!deleteStoryTarget) return;
    await supabase.from("stories").delete().eq("id", deleteStoryTarget.id);
    toast.success("story deleted");
    setDeleteStoryTarget(null);
    fetchStories();
    qc.invalidateQueries({ queryKey: ["stories"] });
  };

  const approveOrder = async (order: ICOrder) => {
    await supabase.from("ic_orders").update({ status: "approved", updated_at: new Date().toISOString() } as any).eq("id", order.id);
    const { data: existingRole } = await supabase.from("user_roles").select("*").eq("user_id", order.user_id).eq("role", "inner_circle");
    if (!existingRole?.length) {
      await supabase.from("user_roles").insert({ user_id: order.user_id, role: "inner_circle" as any });
    }
    toast.success(`Order approved & IC granted to @${order.username} (★‿★)`);
    fetchOrders();
    fetchUsers();
  };

  const rejectOrder = async (order: ICOrder) => {
    await supabase.from("ic_orders").update({ status: "rejected", updated_at: new Date().toISOString() } as any).eq("id", order.id);
    toast.success("Order rejected");
    fetchOrders();
  };

  const storyAuthors = useMemo(() => {
    const map = new Map<string, { user_id: string; name: string; username: string }>();
    stories.forEach((s) => {
      if (!map.has(s.user_id)) {
        map.set(s.user_id, { user_id: s.user_id, name: s.author_name, username: s.author_username });
      }
    });
    return Array.from(map.values());
  }, [stories]);

  const toggleStorySelect = (id: string) => {
    const next = new Set(selectedStories);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedStories(next);
  };

  const toggleAllStories = () => {
    if (selectedStories.size === filteredStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(filteredStories.map((s) => s.id)));
    }
  };

  const handleExportPDF = () => {
    if (!selectedStories.size) return;
    const toExport = stories
      .filter((s) => selectedStories.has(s.id))
      .map((s) => ({
        title: s.title, subtitle: s.subtitle, content: s.content,
        published_at: s.published_at, author_name: s.author_name,
      }));
    exportArticlesToPDF(toExport);
    toast.success(`exported ${toExport.length} article(s)`);
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="font-serif text-xl font-medium">admin dashboard</h1>
          <p className="mt-1 text-xs text-muted-foreground">{isFounder ? "founder" : "admin"} access (*´▽`*)</p>

          <Tabs defaultValue="users" className="mt-8">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0 overflow-x-auto overflow-y-hidden flex-nowrap scrollbar-none">
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Users className="h-3.5 w-3.5 mr-1.5" /> Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> IC Orders
                {pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(45,90%,50%)] px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="stories" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Stories & Backup
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by username or display name..."
                    className="w-full rounded-md border border-border bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {filteredUsers.length} user(s)
                </p>
              </div>

              <div className="rounded-md border border-border">
                {groupedUsers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">no users found (◕︿◕)</p>
                ) : (
                  groupedUsers.map((group, idx) => (
                    <CollapsibleMonthGroup key={group.label} label={group.label} count={group.items.length} defaultOpen={idx === 0}>
                      {({ start, end }) => (
                        <div className="divide-y divide-border">
                          {group.items.slice(start, end).map((u) => (
                            <div key={u.user_id} className="flex items-center justify-between py-3 px-4 gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                  {u.display_name[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{u.display_name}</p>
                                    {u.hasInnerCircle && <VerifiedBadge size="sm" />}
                                    <RoleBadge role={u.role} variant="card" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <input
                                      type="date"
                                      defaultValue={u.joined_at ? format(new Date(u.joined_at), "yyyy-MM-dd") : ""}
                                      onBlur={(e) => updateJoinDate(u.user_id, e.target.value)}
                                      className="bg-transparent text-[10px] text-muted-foreground border-none p-0 focus:outline-none focus:text-foreground w-24"
                                      title="Change join date"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleInnerCircle(u.user_id, u.hasInnerCircle)}
                                  className={`flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-medium transition-colors ${
                                    u.hasInnerCircle
                                      ? "border-[hsl(45,70%,75%)] bg-[hsl(45,80%,92%)] text-[hsl(45,60%,35%)]"
                                      : "border-border text-muted-foreground hover:border-[hsl(45,70%,75%)] hover:text-[hsl(45,60%,35%)]"
                                  }`}
                                  title={u.hasInnerCircle ? "Remove Inner Circle" : "Grant Inner Circle"}
                                >
                                  <BadgeCheck className={`h-3 w-3 ${u.hasInnerCircle ? "text-[hsl(45,90%,50%)] fill-[hsl(45,90%,50%)] stroke-white" : ""}`} />
                                  {u.hasInnerCircle ? "IC" : "IC"}
                                </button>
                                <select
                                  value={u.role}
                                  onChange={(e) => changeRole(u.user_id, e.target.value as Role)}
                                  className="rounded-md border border-border bg-transparent px-2 py-1 text-xs focus:outline-none"
                                >
                                  {(["founder", "admin", "early_adopter", "contributor", "writer"] as Role[])
                                    .filter((r) => isFounder || r !== "founder")
                                    .map((r) => (
                                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleMonthGroup>
                  ))
                )}
              </div>
            </TabsContent>

            {/* IC Orders Tab */}
            <TabsContent value="orders" className="mt-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by email or username..."
                    className="w-full rounded-md border border-border bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="rounded-md border border-border bg-transparent px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
                >
                  <option value="all">All status ({orders.length})</option>
                  <option value="pending">Pending ({orders.filter((o) => o.status === "pending").length})</option>
                  <option value="approved">Approved ({orders.filter((o) => o.status === "approved").length})</option>
                  <option value="rejected">Rejected ({orders.filter((o) => o.status === "rejected").length})</option>
                </select>
              </div>

              <p className="mb-3 text-xs text-muted-foreground">
                {filteredOrders.length} order(s)
              </p>

              <div className="rounded-md border border-border">
                {groupedOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">no orders yet (◕ᴗ◕✿)</p>
                ) : (
                  groupedOrders.map((group, idx) => (
                    <CollapsibleMonthGroup key={group.label} label={group.label} count={group.items.length} defaultOpen={idx === 0}>
                      {({ start, end }) => (
                        <div className="divide-y divide-border">
                          {group.items.slice(start, end).map((o) => (
                            <div key={o.id} className="px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium">{o.display_name}</p>
                                    <span className="text-xs text-muted-foreground">@{o.username}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      o.status === "pending"
                                        ? "bg-[hsl(45,80%,92%)] text-[hsl(45,60%,35%)]"
                                        : o.status === "approved"
                                        ? "bg-[hsl(140,50%,92%)] text-[hsl(140,50%,30%)]"
                                        : "bg-destructive/10 text-destructive"
                                    }`}>
                                      {o.status}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span>{o.email}</span>
                                    <span>·</span>
                                    <span className="font-medium text-foreground">
                                      {o.plan === "yearly" ? "1 Year (Rp. 99.000)" : "Lifetime (Rp. 299.000)"}
                                    </span>
                                    <span>·</span>
                                    <span>{new Date(o.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {o.transfer_proof_url && (
                                    <button
                                      onClick={() => setProofPreview(o.transfer_proof_url)}
                                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
                                      title="View proof"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {o.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => approveOrder(o)}
                                        className="flex h-7 items-center gap-1 rounded-md border border-[hsl(140,50%,75%)] bg-[hsl(140,50%,95%)] px-2 text-[10px] font-medium text-[hsl(140,50%,30%)] hover:bg-[hsl(140,50%,90%)] transition-colors"
                                      >
                                        <CheckCircle2 className="h-3 w-3" /> Approve
                                      </button>
                                      <button
                                        onClick={() => rejectOrder(o)}
                                        className="flex h-7 items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-2 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                      >
                                        <XCircle className="h-3 w-3" /> Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleMonthGroup>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Stories & Backup Tab */}
            <TabsContent value="stories" className="mt-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={storySearch}
                    onChange={(e) => setStorySearch(e.target.value)}
                    placeholder="Search by title or author..."
                    className="w-full rounded-md border border-border bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                  value={storyUserFilter}
                  onChange={(e) => { setStoryUserFilter(e.target.value); setSelectedStories(new Set()); }}
                  className="flex-1 min-w-[180px] rounded-md border border-border bg-transparent px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
                >
                  <option value="all">All users ({stories.length})</option>
                  {storyAuthors.map((a) => (
                    <option key={a.user_id} value={a.user_id}>
                      {a.name} (@{a.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={toggleAllStories} className="text-xs text-muted-foreground hover:text-foreground">
                    {selectedStories.size === filteredStories.length && filteredStories.length > 0 ? "Deselect all" : "Select all"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {filteredStories.length} stories
                  </p>
                </div>
                <Button onClick={handleExportPDF} disabled={!selectedStories.size} size="sm" className="gap-2">
                  <Download className="h-3.5 w-3.5" /> Download PDF ({selectedStories.size})
                </Button>
              </div>

              <div className="rounded-md border border-border">
                {groupedStories.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">no stories found</p>
                ) : (
                  groupedStories.map((group, idx) => (
                    <CollapsibleMonthGroup key={group.label} label={group.label} count={group.items.length} defaultOpen={idx === 0}>
                      {({ start, end }) => (
                        <div className="divide-y divide-border">
                          {group.items.slice(start, end).map((s) => (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                              <Checkbox
                                checked={selectedStories.has(s.id)}
                                onCheckedChange={() => toggleStorySelect(s.id)}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{s.title || "untitled"}</p>
                                <p className="text-xs text-muted-foreground">
                                  by {s.author_name} · {s.published_at ? new Date(s.published_at).toLocaleDateString() : "draft"} · {s.views} views
                                </p>
                              </div>
                              <button onClick={() => setDeleteStoryTarget({ id: s.id, title: s.title })} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleMonthGroup>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4">
              <div className="space-y-6">
                <div className="rounded-lg border border-border p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(45,80%,92%)]">
                        <BadgeCheck className="h-5 w-5 text-[hsl(45,90%,50%)] fill-[hsl(45,90%,50%)] stroke-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Support & Join Inner Circle</h3>
                        <p className="text-xs text-muted-foreground">
                          {innerCircleEnabled ? "Feature is live and accessible to users" : "Feature is currently hidden from users"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={innerCircleEnabled ?? false}
                      onCheckedChange={toggleInnerCircleFeature}
                    />
                  </div>
                </div>

                <VoucherManager />

                <PopupManager />

                <MaintenanceToggle />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Delete Story Dialog */}
      <AlertDialog open={!!deleteStoryTarget} onOpenChange={(open) => !open && setDeleteStoryTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{deleteStoryTarget?.title || "untitled"}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={deleteStory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proof Preview Dialog */}
      <AlertDialog open={!!proofPreview} onOpenChange={(open) => !open && setProofPreview(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Proof</AlertDialogTitle>
          </AlertDialogHeader>
          {proofPreview && (
            <img src={proofPreview} alt="Transfer proof" className="w-full rounded-lg border border-border" />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
