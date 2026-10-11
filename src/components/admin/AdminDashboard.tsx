import React, { useState, useEffect } from 'react';
import {
  Shield, Users, CreditCard, AlertTriangle, FileText, CheckCircle2,
  XCircle, Eye, Search, Lock, UserCheck, RefreshCw, Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PaymentSubmission, Report, AdminAuditLog } from '../../types/index.ts';

export const AdminDashboard: React.FC = () => {
  const { token, user, refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'moderation' | 'audit'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentSubmission[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal inspection of payment screenshot
  const [inspectPayment, setInspectPayment] = useState<PaymentSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Bootstrap key input for upgrading account to admin if needed
  const [setupKey, setSetupKey] = useState('');
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  const fetchOverview = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const q = userSearch ? `?search=${encodeURIComponent(userSearch)}` : '';
      const res = await fetch(`/api/admin/users${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/payments/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentsList(data.payments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportsList(data.reports || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchUsers(),
      fetchPayments(),
      fetchReports(),
      fetchAuditLogs()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user?.role, token]);

  const handleReviewPayment = async (paymentId: string, decision: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'rejected' ? rejectionReason : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review payment');

      alert(`Payment ${decision} successfully.`);
      setInspectPayment(null);
      setRejectionReason('');
      fetchPayments();
      fetchOverview();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    const reason = prompt(`Enter reason for changing status to ${newStatus}:`);
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (res.ok) {
        alert(`User status updated to ${newStatus}.`);
        fetchUsers();
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleReportAction = async (reportId: string, status: 'reviewed' | 'action_taken' | 'dismissed') => {
    const notes = prompt('Enter resolution notes:');
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminNotes: notes || 'Handled' })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {
      alert('Failed to update report');
    }
  };

  const handleBootstrapAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/admin-bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminSetupKey: setupKey })
      });
      const data = await res.json();
      if (res.ok) {
        setSetupMessage('Access granted! Upgraded to Administrator.');
        await refreshUserData();
      } else {
        setSetupMessage(data.error || 'Invalid setup key');
      }
    } catch (err) {
      setSetupMessage('Failed to execute administrative bootstrap');
    }
  };

  // If not admin, show secure administrative setup prompt
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Restricted Administrator Console
        </h2>
        <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
          Access to NaijaMatch management requires role-based administrative permissions. If you are the site owner, enter the server bootstrap setup key below.
        </p>

        {setupMessage && (
          <div className="mb-4 p-3 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800">
            {setupMessage}
          </div>
        )}

        <form onSubmit={handleBootstrapAdmin} className="space-y-3">
          <input
            type="password"
            value={setupKey}
            onChange={(e) => setSetupKey(e.target.value)}
            placeholder="Enter ADMIN_SETUP_KEY"
            className="w-full h-11 px-3 text-center rounded-xl border border-slate-300 text-xs font-mono focus:border-[#008751] outline-hidden"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Authenticate Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              Super Admin Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            NaijaMatch Control Panel
          </h1>
          <p className="text-xs text-slate-500">
            Real-time management for users, manual Opay payments, and content safety
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'overview' ? 'bg-[#008751] text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'payments' ? 'bg-[#008751] text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Payment Approvals ({stats?.pendingPayments || 0})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'users' ? 'bg-[#008751] text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          User Accounts ({stats?.totalUsers || 0})
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'moderation' ? 'bg-[#008751] text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Reports & Safety ({stats?.reportedProfiles || 0})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'audit' ? 'bg-[#008751] text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Users
              </span>
              <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">
                {stats?.totalUsers ?? '...'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats?.verifiedEmails ?? 0} Email Verified
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Subscriptions
              </span>
              <p className="text-3xl font-black text-[#008751] tabular-nums mt-1">
                {stats?.activeSubscriptions ?? '...'}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">Full Chat Privileges</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Payments
              </span>
              <p className="text-3xl font-black text-amber-600 tabular-nums mt-1">
                {stats?.pendingPayments ?? '...'}
              </p>
              <p className="text-[11px] text-amber-600 mt-1">Awaiting Review</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Approved Payments
              </span>
              <p className="text-3xl font-black text-slate-900 tabular-nums mt-1">
                {stats?.approvedPayments ?? '...'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats?.rejectedPayments ?? 0} Rejected
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Payment Verification Rules & Compliance
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>
                Destination Account: <strong>Opay 8167258121 (Stephen)</strong>.
              </li>
              <li>
                Always cross-reference the uploaded transaction reference and receipt amount before clicking <strong>Approve</strong>.
              </li>
              <li>
                Approved payments immediately activate the member's subscription without manual SQL edits.
              </li>
              <li>
                Rejections must specify a helpful reason so the customer can correct their transfer.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* PAYMENTS REVIEW TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Manual Bank Transfer Submissions
            </h3>
            <span className="text-xs text-slate-500">
              {paymentsList.length} Total Submissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Submission Date</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Reference ID</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paymentsList.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3.5 tabular-nums">{p.paymentDate}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{p.userName}</div>
                      <div className="text-[11px] text-slate-500">{p.userEmail}</div>
                    </td>
                    <td className="p-3.5 font-bold uppercase">{p.planId}</td>
                    <td className="p-3.5 font-bold font-mono">₦{p.amountNGN.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">{p.transactionReference}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setInspectPayment(p)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800"
                      >
                        Inspect Proof
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-900">
              Registered Accounts Directory
            </h3>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="Search user email or name..."
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-300 text-xs focus:border-[#008751] outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Email Verified</th>
                  <th className="p-3.5">Subscription</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {u.profile?.displayName || 'No profile completed'}
                      </div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold uppercase text-[10px] text-slate-600">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {u.isEmailVerified ? (
                        <span className="text-emerald-600 font-bold">Yes (OTP)</span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700">{u.subscriptionStatus}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'suspended'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {u.status === 'active' ? (
                        <>
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                            className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 text-[10px] font-bold"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, 'banned')}
                            className="px-2.5 py-1 rounded bg-rose-50 text-rose-800 hover:bg-rose-100 text-[10px] font-bold"
                          >
                            Ban
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateUserStatus(u.id, 'active')}
                          className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold"
                        >
                          Reinstate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODERATION REPORTS TAB */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Content & Member Reports
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Report Date</th>
                  <th className="p-3.5">Target Type</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reportsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No reported content pending review.
                    </td>
                  </tr>
                ) : (
                  reportsList.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3.5 tabular-nums">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-bold uppercase">{r.targetType}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">{r.reason}</td>
                      <td className="p-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleReportAction(r.id, 'action_taken')}
                          className="px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                        >
                          Take Action
                        </button>
                        <button
                          onClick={() => handleReportAction(r.id, 'dismissed')}
                          className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-300"
                        >
                          Dismiss
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Administrative Audit Trail (Immutable)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Administrator</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3.5 tabular-nums text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{log.adminEmail}</td>
                    <td className="p-3.5 font-mono text-[11px] text-[#008751] font-bold">{log.action}</td>
                    <td className="p-3.5 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT INSPECTION MODAL */}
      {inspectPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectPayment(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Review Payment Submission
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Verify this screenshot against our bank records (Opay - 8167258121 - Stephen)
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <div>
                <span className="text-slate-500">Customer:</span>
                <p className="font-bold text-slate-900">{inspectPayment.userName}</p>
                <p className="text-[11px] text-slate-500">{inspectPayment.userEmail}</p>
              </div>
              <div>
                <span className="text-slate-500">Plan & Amount:</span>
                <p className="font-bold text-[#008751] font-mono text-sm">
                  {inspectPayment.planId.toUpperCase()} — ₦{inspectPayment.amountNGN.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">Date: {inspectPayment.paymentDate}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Transaction Reference:</span>
                <p className="font-mono font-bold text-slate-800 break-all">
                  {inspectPayment.transactionReference}
                </p>
              </div>
            </div>

            {/* Proof Screenshot Display */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Submitted Screenshot
              </label>
              <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-900 max-h-96 flex items-center justify-center">
                <img
                  src={inspectPayment.proofScreenshotUrl}
                  alt="Proof screenshot"
                  className="max-h-96 w-auto object-contain"
                />
              </div>
            </div>

            {inspectPayment.status === 'pending' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rejection Reason (Required only if rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Transaction reference not found in bank statement"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs focus:border-[#008751] outline-hidden"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReviewPayment(inspectPayment.id, 'approved')}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Activate Subscription</span>
                  </button>
                  <button
                    onClick={() => handleReviewPayment(inspectPayment.id, 'rejected')}
                    disabled={isProcessing}
                    className="py-3 px-5 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-100 text-center text-xs font-bold text-slate-700">
                This payment was already {inspectPayment.status.toUpperCase()} by administrator on {inspectPayment.reviewedAt}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
