"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { minecraftFont } from "../fonts";
import "./admin.css";

type Stats = {
  totalTeams: number;
  totalParticipants: number;
  totalRegistrations: number;
  pendingPayments: number;
  verifiedPayments: number;
  rejectedPayments: number;
  verifiedAmount: number;
  currency: string;
};

type PaymentItem = {
  id: string;
  utr: string;
  amount: number;
  currency: string;
  status: "pending_verification" | "paid" | "payment_failed";
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  registrationNumber: string;
  teamId: string;
  teamName: string;
  members: Array<{ id: string; name: string; participant_id: string; email: string }>;
};

type TeamItem = {
  id: string;
  teamId: string;
  teamName: string;
  status: string;
  memberCount: number;
  members: Array<{ id: string; name: string; email: string; phone: string | null }>;
  registration: { id: string; registrationNumber: string; status: string; feeAmount: number; currency: string } | null;
  createdAt: string;
};

type ParticipantItem = {
  id: string;
  participantId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  teamId: string;
  teamName: string;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"payments" | "teams" | "participants">("payments");
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // 1. Load Stats
      const statsRes = await fetch("/api/admin/stats", { cache: "no-store" });
      if (statsRes.status === 401 || statsRes.status === 403) {
        router.replace("/login");
        return;
      }
      const statsData = await statsRes.json();
      if (statsData.statistics) setStats(statsData.statistics);

      // 2. Load Payments
      const paymentsRes = await fetch("/api/admin/payments?pageSize=100", { cache: "no-store" });
      const paymentsData = await paymentsRes.json();
      if (paymentsData.payments) setPayments(paymentsData.payments);

      // 3. Load Teams
      const teamsRes = await fetch("/api/admin/teams?pageSize=100", { cache: "no-store" });
      const teamsData = await teamsRes.json();
      if (teamsData.teams) setTeams(teamsData.teams);

      // 4. Load Participants
      const partsRes = await fetch("/api/admin/participants?pageSize=100", { cache: "no-store" });
      const partsData = await partsRes.json();
      if (partsData.participants) setParticipants(partsData.participants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  async function handleVerifyPayment(paymentId: string) {
    if (!confirm("Are you sure you want to approve and verify this payment?")) return;
    setProcessingId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify payment");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectPayment(paymentId: string) {
    const reason = prompt("Enter the reason for rejecting this payment (e.g. UTR not received, screenshot unreadable):");
    if (!reason || reason.trim().length < 3) {
      if (reason !== null) alert("A reason of at least 3 characters is required.");
      return;
    }
    setProcessingId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject payment");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleViewScreenshot(paymentId: string) {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.payment?.screenshotUrl) {
        window.open(data.payment.screenshotUrl, "_blank", "noopener,noreferrer");
      } else {
        alert("Screenshot URL unavailable.");
      }
    } catch {
      alert("Failed to fetch screenshot URL.");
    }
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    router.replace("/login");
  }

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.utr.toLowerCase().includes(search.toLowerCase()) ||
      p.teamName.toLowerCase().includes(search.toLowerCase()) ||
      p.teamId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTeams = teams.filter((t) => {
    return (
      search === "" ||
      t.teamName.toLowerCase().includes(search.toLowerCase()) ||
      t.teamId.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredParticipants = participants.filter((part) => {
    return (
      search === "" ||
      part.name.toLowerCase().includes(search.toLowerCase()) ||
      part.email.toLowerCase().includes(search.toLowerCase()) ||
      part.participantId.toLowerCase().includes(search.toLowerCase()) ||
      part.teamName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <main className="admin-container">
      {/* Top Header */}
      <header className="admin-header">
        <div>
          <span className={`admin-badge ${minecraftFont.className}`}>FARLANDS // ORGANIZER PORTAL</span>
          <h1 className={minecraftFont.className}>Admin Dashboard</h1>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => void loadData()} className="admin-btn secondary" disabled={loading}>
            {loading ? "Refreshing..." : "↻ Refresh Data"}
          </button>
          <button type="button" onClick={() => void handleSignOut()} className="admin-btn danger">
            Sign Out
          </button>
        </div>
      </header>

      {error && <div className="admin-alert error">{error}</div>}

      {/* Statistics Cards */}
      {stats && (
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <span>TOTAL TEAMS</span>
            <strong>{stats.totalTeams}</strong>
          </div>
          <div className="admin-stat-card">
            <span>TOTAL PARTICIPANTS</span>
            <strong>{stats.totalParticipants}</strong>
          </div>
          <div className="admin-stat-card highlight-yellow">
            <span>PENDING VERIFICATION</span>
            <strong>{stats.pendingPayments}</strong>
          </div>
          <div className="admin-stat-card highlight-green">
            <span>VERIFIED PAYMENTS</span>
            <strong>{stats.verifiedPayments}</strong>
          </div>
          <div className="admin-stat-card">
            <span>TOTAL COLLECTED</span>
            <strong>₹{(stats.verifiedAmount / 100).toLocaleString("en-IN")}</strong>
          </div>
        </section>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          UPI Payments ({payments.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "teams" ? "active" : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          Teams ({teams.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "participants" ? "active" : ""}`}
          onClick={() => setActiveTab("participants")}
        >
          Participants ({participants.length})
        </button>
      </div>

      {/* Filters & Search */}
      <div className="admin-filter-bar">
        <input
          type="text"
          placeholder="Search by Team ID, Name, UTR, or Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />

        {activeTab === "payments" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select-input"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="paid">Verified & Paid</option>
            <option value="payment_failed">Rejected</option>
          </select>
        )}
      </div>

      {/* Tab 1: Payments Table */}
      {activeTab === "payments" && (
        <section className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>UTR / Ref Number</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Screenshot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty-cell">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <code className="admin-team-id">{p.teamId}</code>
                    </td>
                    <td>
                      <strong>{p.teamName}</strong>
                      <div className="admin-subtext">{p.members.length} members</div>
                    </td>
                    <td>
                      <code className="admin-utr">{p.utr}</code>
                    </td>
                    <td>₹{(p.amount / 100).toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`admin-status-pill ${p.status}`}>
                        {p.status === "pending_verification"
                          ? "UNDER VERIFICATION"
                          : p.status === "paid"
                          ? "VERIFIED / PAID"
                          : "REJECTED"}
                      </span>
                      {p.rejectionReason && (
                        <div className="admin-subtext rejection-reason">
                          Reason: {p.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>{new Date(p.submittedAt).toLocaleString()}</td>
                    <td>
                      <button
                        onClick={() => void handleViewScreenshot(p.id)}
                        className="admin-btn table-action"
                      >
                        👁 View Screenshot
                      </button>
                    </td>
                    <td>
                      {p.status === "pending_verification" ? (
                        <div className="admin-action-group">
                          <button
                            onClick={() => void handleVerifyPayment(p.id)}
                            disabled={processingId === p.id}
                            className="admin-btn verify-btn"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => void handleRejectPayment(p.id)}
                            disabled={processingId === p.id}
                            className="admin-btn reject-btn"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="admin-reviewed-text">
                          Reviewed {p.reviewedAt ? new Date(p.reviewedAt).toLocaleDateString() : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Tab 2: Teams Table */}
      {activeTab === "teams" && (
        <section className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Members Count</th>
                <th>Members</th>
                <th>Registration Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-cell">
                    No teams found.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <code className="admin-team-id">{t.teamId}</code>
                    </td>
                    <td>
                      <strong>{t.teamName}</strong>
                    </td>
                    <td>{t.memberCount} hackers</td>
                    <td>
                      <div className="admin-member-tags">
                        {t.members.map((m) => (
                          <span key={m.id} className="admin-member-tag">
                            {m.name} ({m.email})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-pill ${t.registration?.status ?? "pending_payment"}`}>
                        {t.registration?.status ?? "pending_payment"}
                      </span>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Tab 3: Participants Table */}
      {activeTab === "participants" && (
        <section className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Participant ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Team Name</th>
                <th>Team ID</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((part) => (
                  <tr key={part.id}>
                    <td>
                      <code>{part.participantId}</code>
                    </td>
                    <td>
                      <strong>{part.name}</strong>
                    </td>
                    <td>{part.email}</td>
                    <td>{part.phone || "—"}</td>
                    <td>{part.teamName}</td>
                    <td>
                      <code className="admin-team-id">{teams.find((t) => t.id === part.teamId)?.teamId || "—"}</code>
                    </td>
                    <td>{new Date(part.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
