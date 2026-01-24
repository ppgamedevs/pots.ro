"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Percent, 
  RefreshCcw, 
  AlertTriangle, 
  Clock,
  Download,
  Filter,
  CheckCircle,
  UserPlus,
  Bell,
  Loader2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface KPIs {
  gmvCents: number;
  orderCount: number;
  avgOrderValueCents: number;
  commissionTotalCents: number;
  refundRatePct: number;
  payoutBacklogCents: number;
  ordersPerDay: number;
}

interface Alert {
  id: string;
  source: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  dedupeKey: string;
  entityType: string | null;
  entityId: string | null;
  title: string;
  details: Record<string, unknown>;
  status: "open" | "acknowledged" | "resolved" | "snoozed";
  assignedTo: { id: string; name: string | null; email: string } | null;
  snoozedUntil: string | null;
  resolvedAt: string | null;
  linkedTicketId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AlertCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("ro-RO").format(num);
}

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  high: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  low: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
};

const sourceLabels: Record<string, string> = {
  webhook_failure: "Webhook Eșuat",
  payment_error: "Eroare Plată",
  payout_error: "Eroare Payout",
  refund_error: "Eroare Refund",
  stock_negative: "Stoc Negativ",
  seller_suspended: "Seller Suspendat",
  message_spike: "Spike Mesaje",
  security_event: "Eveniment Securitate",
};

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  drilldownHref,
  trend,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof TrendingUp;
  drilldownHref?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}) {
  const content = (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 ${trend.value >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className="bg-gray-100 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      </div>
      {drilldownHref && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Vezi detalii <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      )}
    </div>
  );

  if (drilldownHref) {
    return <Link href={drilldownHref}>{content}</Link>;
  }

  return content;
}

function AlertRow({
  alert,
  onAction,
  actionLoading,
}: {
  alert: Alert;
  onAction: (action: string, alertIds: string[], extra?: Record<string, unknown>) => void;
  actionLoading: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const colors = severityColors[alert.severity] || severityColors.medium;

  const entityLink = alert.entityType && alert.entityId
    ? getEntityLink(alert.entityType, alert.entityId)
    : null;

  return (
    <div className={`border rounded-lg p-4 ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.text} bg-white/50`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-600">
              {sourceLabels[alert.source] || alert.source}
            </span>
            {alert.status === "acknowledged" && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                Acknowledged
              </span>
            )}
            {alert.status === "snoozed" && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Snoozed până la {new Date(alert.snoozedUntil!).toLocaleString("ro-RO")}
              </span>
            )}
          </div>
          <h4 className="font-medium text-gray-900 mt-2 truncate">{alert.title}</h4>
          <p className="text-sm text-gray-600 mt-1">
            Creat: {new Date(alert.createdAt).toLocaleString("ro-RO")}
            {alert.assignedTo && (
              <span className="ml-2">
                • Atribuit: {alert.assignedTo.name || alert.assignedTo.email}
              </span>
            )}
          </p>
          {entityLink && (
            <Link
              href={entityLink.href}
              className="text-sm text-blue-600 hover:underline mt-1 inline-block"
            >
              Vezi {entityLink.label}
            </Link>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-white/50 rounded"
            disabled={actionLoading}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showActions ? "rotate-180" : ""}`} />
          </button>
          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[160px]">
              {alert.status !== "resolved" && (
                <>
                  {alert.status === "open" && (
                    <button
                      onClick={() => {
                        onAction("acknowledge", [alert.id]);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Bell className="h-4 w-4" /> Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onAction("resolve", [alert.id]);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Rezolvă
                  </button>
                  <button
                    onClick={() => {
                      const hours = prompt("Snooze pentru câte ore?", "24");
                      if (hours) {
                        const snoozeUntil = new Date(Date.now() + parseInt(hours) * 60 * 60 * 1000);
                        onAction("snooze", [alert.id], { snoozeUntil: snoozeUntil.toISOString() });
                      }
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" /> Snooze
                  </button>
                  {!alert.linkedTicketId && (
                    <button
                      onClick={() => {
                        onAction("create_task", [alert.id]);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" /> Creează Task
                    </button>
                  )}
                </>
              )}
              {alert.linkedTicketId && (
                <Link
                  href={`/admin/support/tickets/${alert.linkedTicketId}`}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" /> Vezi Ticket
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getEntityLink(entityType: string, entityId: string): { href: string; label: string } | null {
  switch (entityType) {
    case "order":
      return { href: `/admin/orders?q=${entityId}`, label: "comanda" };
    case "product":
      return { href: `/admin/products?q=${entityId}`, label: "produsul" };
    case "seller":
      return { href: `/admin/sellers/${entityId}`, label: "seller-ul" };
    case "webhook":
      return { href: `/admin/webhooks?q=${entityId}`, label: "webhook-ul" };
    case "payout":
      return { href: `/admin/finante/payouts?q=${entityId}`, label: "payout-ul" };
    case "refund":
      return { href: `/admin/finante/refunds?q=${entityId}`, label: "refund-ul" };
    default:
      return null;
  }
}

export default function OverviewPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({ critical: 0, high: 0, medium: 0, low: 0 });
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>("open,acknowledged");

  const fetchKPIs = useCallback(async () => {
    setKpisLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/admin/overview/kpis?${params}`);
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
      }
    } catch (error) {
      console.error("Failed to fetch KPIs:", error);
    } finally {
      setKpisLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const params = new URLSearchParams();
      if (alertStatusFilter) params.set("status", alertStatusFilter);
      params.set("limit", "20");

      const res = await fetch(`/api/admin/alerts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
        setAlertCounts(data.counts);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setAlertsLoading(false);
    }
  }, [alertStatusFilter]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAlertAction = async (action: string, alertIds: string[], extra?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/alerts/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, alertIds, ...extra }),
      });

      if (res.ok) {
        fetchAlerts();
      } else {
        const error = await res.json();
        alert(`Eroare: ${error.error || "Acțiune eșuată"}`);
      }
    } catch (error) {
      console.error("Failed to perform action:", error);
      alert("Eroare la executarea acțiunii");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/admin/overview/kpis/export?${params}`);

      if (res.status === 429) {
        alert("Prea multe exporturi. Așteaptă un minut.");
        return;
      }

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kpis_${dateFrom}_${dateTo}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Export eșuat");
      }
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Eroare la export");
    } finally {
      setExportLoading(false);
    }
  };

  const totalActiveAlerts = alertCounts.critical + alertCounts.high + alertCounts.medium + alertCounts.low;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview Dashboard</h1>
          <p className="text-gray-600 mt-1">KPI-uri și alerte pentru platform</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading || kpisLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-lg border p-4 flex items-center gap-4 flex-wrap">
        <Filter className="h-5 w-5 text-gray-400" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">De la:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Până la:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => {
            fetchKPIs();
            fetchAlerts();
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          <RefreshCcw className="h-4 w-4" /> Actualizează
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="GMV Total"
          value={kpis ? formatCurrency(kpis.gmvCents) : "-"}
          subtitle="Volum brut de vânzări"
          icon={TrendingUp}
          drilldownHref="/admin/orders"
          loading={kpisLoading}
        />
        <KPICard
          title="Comenzi"
          value={kpis ? formatNumber(kpis.orderCount) : "-"}
          subtitle={kpis ? `${kpis.ordersPerDay} comenzi/zi` : undefined}
          icon={ShoppingCart}
          drilldownHref="/admin/orders"
          loading={kpisLoading}
        />
        <KPICard
          title="AOV"
          value={kpis ? formatCurrency(kpis.avgOrderValueCents) : "-"}
          subtitle="Valoare medie comandă"
          icon={DollarSign}
          loading={kpisLoading}
        />
        <KPICard
          title="Comision Total"
          value={kpis ? formatCurrency(kpis.commissionTotalCents) : "-"}
          subtitle="Venituri platformă"
          icon={Percent}
          drilldownHref="/admin/finante"
          loading={kpisLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Rată Refund"
          value={kpis ? `${kpis.refundRatePct}%` : "-"}
          subtitle="Din comenzi finalizate"
          icon={RefreshCcw}
          drilldownHref="/admin/finante/refunds"
          loading={kpisLoading}
        />
        <KPICard
          title="Payout Backlog"
          value={kpis ? formatCurrency(kpis.payoutBacklogCents) : "-"}
          subtitle="Pending + Processing"
          icon={Clock}
          drilldownHref="/admin/finante/payouts"
          loading={kpisLoading}
        />
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alerte Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalActiveAlerts}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="flex gap-2 mt-4 text-xs">
            {alertCounts.critical > 0 && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                {alertCounts.critical} critical
              </span>
            )}
            {alertCounts.high > 0 && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                {alertCounts.high} high
              </span>
            )}
            {alertCounts.medium > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {alertCounts.medium} medium
              </span>
            )}
            {alertCounts.low > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {alertCounts.low} low
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Alerte Recente</h2>
          <select
            value={alertStatusFilter}
            onChange={(e) => setAlertStatusFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="open,acknowledged">Active (Open + Acknowledged)</option>
            <option value="open">Doar Open</option>
            <option value="acknowledged">Doar Acknowledged</option>
            <option value="snoozed">Snoozed</option>
            <option value="resolved">Resolved</option>
            <option value="open,acknowledged,snoozed,resolved">Toate</option>
          </select>
        </div>
        <div className="p-4 space-y-3">
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Nicio alertă {alertStatusFilter.includes("resolved") ? "" : "activă"}</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onAction={handleAlertAction}
                actionLoading={actionLoading}
              />
            ))
          )}
        </div>
        {alerts.length > 0 && (
          <div className="p-4 border-t">
            <Link
              href="/admin/alerts"
              className="text-sm text-blue-600 hover:underline"
            >
              Vezi toate alertele →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
