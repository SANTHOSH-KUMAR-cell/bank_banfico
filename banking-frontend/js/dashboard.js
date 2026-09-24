/**
 * NovaBank Enterprise Core Banking & Open Banking Dashboard
 */

// Global State
const state = {
  user: null,
  roles: [],
  primaryRole: 'USER',
  isAdmin: false,
  isMaker: false,
  isChecker: false,
  isUser: false,
  myCustomerId: null,
  customers: [],
  accounts: [],
  transactions: [],
  beneficiaries: [],
  consents: [],
  users: []
};

// Check Authentication
const auth = getStoredAuth();
if (!auth.token) {
  window.location.href = 'index.html';
} else {
  state.user = auth.user || 'User';
  state.roles = auth.roles || [];
  
  if (state.roles.includes('ADMIN')) {
    state.primaryRole = 'ADMIN';
    state.isAdmin = true;
  } else if (state.roles.includes('CHECKER')) {
    state.primaryRole = 'CHECKER';
    state.isChecker = true;
  } else if (state.roles.includes('MAKER')) {
    state.primaryRole = 'MAKER';
    state.isMaker = true;
  } else {
    state.primaryRole = 'USER';
    state.isUser = true;
  }
}

// Formatting Helpers
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2
});

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return currencyFormatter.format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch (_) {
    return dateStr;
  }
}

// Alert & Toast Notifications
function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

function showAlert(type, message) {
  const banner = document.getElementById('globalAlert');
  const msgEl = document.getElementById('alertMessage');
  const iconEl = document.getElementById('alertIcon');
  if (!banner || !msgEl) return;

  banner.className = `alert-banner ${type}`;
  msgEl.textContent = message;
  iconEl.textContent = type === 'error' ? '⚠️' : (type === 'success' ? '✓' : 'ℹ️');
  banner.style.display = 'flex';
}

function dismissAlert() {
  const banner = document.getElementById('globalAlert');
  if (banner) banner.style.display = 'none';
}

// Modal Handlers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

let confirmCallback = null;
function showConfirm(title, message, okText, onConfirm) {
  document.getElementById('confirmTitle').textContent = title || 'Confirm Action';
  document.getElementById('confirmMessage').textContent = message || 'Are you sure you want to proceed?';
  const okBtn = document.getElementById('confirmOkBtn');
  okBtn.textContent = okText || 'Confirm';
  confirmCallback = onConfirm;
  openModal('confirmModal');
}

document.getElementById('confirmOkBtn').addEventListener('click', () => {
  closeModal('confirmModal');
  if (confirmCallback) {
    confirmCallback();
    confirmCallback = null;
  }
});

// Setup Dynamic Navigation Based on Role
function buildSidebarNavigation() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';

  const navItems = [];

  // Common: Dashboard
  navItems.push({ id: 'dashboard', icon: '⌂', label: 'Dashboard' });

  // Admin Specific
  if (state.isAdmin) {
    navItems.push({ id: 'customers', icon: '👥', label: 'Customers' });
    navItems.push({ id: 'accounts', icon: '▣', label: 'Bank Accounts' });
    navItems.push({ id: 'transfer', icon: '↗', label: 'Transfer Funds' });
    navItems.push({ id: 'transactions', icon: '↔', label: 'Transactions' });
    navItems.push({ id: 'beneficiaries', icon: '♧', label: 'Beneficiaries' });
    navItems.push({ id: 'consents', icon: '📜', label: 'Consents' });
    navItems.push({ id: 'users', icon: '🔒', label: 'System Users' });
  } else if (state.isMaker) {
    navItems.push({ id: 'accounts', icon: '▣', label: 'Bank Accounts' });
    navItems.push({ id: 'transfer', icon: '↗', label: 'Execute Transfer' });
    navItems.push({ id: 'transactions', icon: '↔', label: 'Transactions' });
    navItems.push({ id: 'beneficiaries', icon: '♧', label: 'Beneficiaries' });
    navItems.push({ id: 'consents', icon: '📜', label: 'Consents' });
  } else if (state.isChecker) {
    navItems.push({ id: 'consents', icon: '📜', label: 'Consent Queue' });
    navItems.push({ id: 'transactions', icon: '↔', label: 'Transactions' });
    navItems.push({ id: 'accounts', icon: '▣', label: 'Accounts' });
  } else {
    // Normal User
    navItems.push({ id: 'accounts', icon: '▣', label: 'My Accounts' });
    navItems.push({ id: 'transfer', icon: '↗', label: 'Pay / Transfer' });
    navItems.push({ id: 'transactions', icon: '↔', label: 'My Transactions' });
    navItems.push({ id: 'beneficiaries', icon: '♧', label: 'My Payees' });
    navItems.push({ id: 'consents', icon: '📜', label: 'My Consents' });
  }

  // Common: Profile
  navItems.push({ id: 'profile', icon: '👤', label: 'Profile' });

  navItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = `nav-item ${item.id === 'dashboard' ? 'active' : ''}`;
    btn.dataset.page = item.id;
    btn.innerHTML = `<span>${item.icon}</span> ${item.label}`;
    btn.addEventListener('click', () => openPage(item.id));
    nav.appendChild(btn);
  });
}

function openPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');

  const titles = {
    dashboard: 'Dashboard Overview',
    customers: 'Customer Directory',
    accounts: state.isUser ? 'My Accounts' : 'Bank Accounts',
    transfer: state.isMaker ? 'Execute Transfer' : 'Transfer Money',
    transactions: 'Transaction History',
    beneficiaries: 'Beneficiary Payees',
    consents: 'Open Banking Consents',
    users: 'System Users & Roles',
    profile: 'User Profile'
  };

  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation event bindings
document.querySelectorAll('[data-open]').forEach(btn => {
  btn.addEventListener('click', () => openPage(btn.dataset.open));
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearAuth();
  window.location.href = 'index.html';
});

document.getElementById('refreshDataBtn').addEventListener('click', () => {
  loadAllData();
  toast('Synchronizing live banking data...');
});

// Load All Banking Data
async function loadAllData() {
  try {
    // 1. Fetch Customers
    if (state.isAdmin || state.isChecker || state.isMaker) {
      try {
        state.customers = await apiRequest('/api/customers');
      } catch (err) {
        console.warn('Customer list load error:', err.message);
        state.customers = [];
      }
    } else {
      // Normal User: find self customer
      try {
        const allCust = await apiRequest('/api/customers');
        const match = allCust.find(c => c.email && c.email.toLowerCase() === state.user.toLowerCase());
        if (match) {
          state.customers = [match];
          state.myCustomerId = match.id;
        } else if (allCust.length > 0) {
          state.customers = [allCust[0]];
          state.myCustomerId = allCust[0].id;
        }
      } catch (_) {
        state.customers = [];
      }
    }

    // 2. Fetch Accounts
    try {
      if (state.isUser && state.myCustomerId) {
        state.accounts = await apiRequest(`/api/accounts/customer/${state.myCustomerId}`);
      } else {
        state.accounts = await apiRequest('/api/accounts');
      }
    } catch (err) {
      console.warn('Account list load error:', err.message);
      state.accounts = [];
    }

    // 3. Fetch Transactions
    try {
      state.transactions = await apiRequest('/api/transactions');
      if (state.isUser && state.accounts.length > 0) {
        const myAccIds = new Set(state.accounts.map(a => a.id));
        state.transactions = state.transactions.filter(t => t.account && myAccIds.has(t.account.id));
      }
    } catch (err) {
      console.warn('Transaction list load error:', err.message);
      state.transactions = [];
    }

    // 4. Fetch Beneficiaries
    try {
      state.beneficiaries = await apiRequest('/api/beneficiaries');
      if (state.isUser && state.myCustomerId) {
        state.beneficiaries = state.beneficiaries.filter(b => b.customer && b.customer.id === state.myCustomerId);
      }
    } catch (err) {
      console.warn('Beneficiary list load error:', err.message);
      state.beneficiaries = [];
    }

    // 5. Fetch Consents
    try {
      state.consents = await apiRequest('/api/consents');
      if (state.isUser && state.myCustomerId) {
        state.consents = state.consents.filter(c => c.customer && c.customer.id === state.myCustomerId);
      }
    } catch (err) {
      console.warn('Consent list load error:', err.message);
      state.consents = [];
    }

    // 6. Fetch Users (Admin Only)
    if (state.isAdmin) {
      try {
        state.users = await apiRequest('/api/users');
      } catch (err) {
        console.warn('Users list load error:', err.message);
        state.users = [];
      }
    }

    renderUI();
  } catch (err) {
    console.error('Data loading error:', err);
    showAlert('error', err.message || 'Unable to load banking data. Please refresh.');
  }
}

// Master Render Function
function renderUI() {
  renderProfile();
  renderDashboard();
  renderCustomers();
  renderAccounts();
  renderTransactions();
  renderBeneficiaries();
  renderConsents();
  if (state.isAdmin) renderUsers();
  populateDropdowns();
}

function renderProfile() {
  document.getElementById('profileName').textContent = state.user;
  document.getElementById('welcomeName').textContent = state.user.split(/[ @]/)[0];
  document.getElementById('avatar').textContent = (state.user.charAt(0) || 'U').toUpperCase();

  const rolePill = `<span class="role-badge ${state.primaryRole.toLowerCase()}">${state.primaryRole}</span>`;
  document.getElementById('profileRoles').innerHTML = rolePill;

  // Profile Page details
  document.getElementById('profDetailName').textContent = state.user;
  document.getElementById('profDetailUsername').textContent = state.user;
  document.getElementById('profDetailRoles').textContent = state.roles.join(', ');
  document.getElementById('profDetailCustomerId').textContent = state.myCustomerId ? `#${state.myCustomerId}` : 'All Customers (Admin/Staff)';
}

// ================= DASHBOARD RENDERING =================
function renderDashboard() {
  const statsContainer = document.getElementById('roleDashboardStats');
  const quickActionsContainer = document.getElementById('dashboardQuickActions');
  const eyebrow = document.getElementById('dashRoleEyebrow');
  const subheading = document.getElementById('dashSubheading');

  // Pending Consents calculation
  const pendingConsents = state.consents.filter(c => c.status === 'PENDING').length;
  const approvedConsents = state.consents.filter(c => c.status === 'APPROVED').length;
  const rejectedConsents = state.consents.filter(c => c.status === 'REJECTED').length;

  // Total balance
  const totalBalance = state.accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  const totalCredit = state.transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalDebit = state.transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  if (state.isAdmin) {
    eyebrow.textContent = 'SYSTEM ADMINISTRATOR CONSOLE';
    subheading.textContent = 'Institutional governance, account administration, and consent oversight.';

    statsContainer.innerHTML = `
      <div class="admin-stats-grid">
        <div class="stat-box primary-stat">
          <span>Total Customers</span>
          <strong>${state.customers.length}</strong>
          <small>Registered Accounts</small>
        </div>
        <div class="stat-box primary-stat">
          <span>Total Bank Accounts</span>
          <strong>${state.accounts.length}</strong>
          <small>Active & Suspended</small>
        </div>
        <div class="stat-box">
          <span>Ledger Balance</span>
          <strong>${formatCurrency(totalBalance)}</strong>
          <small>Combined Holdings</small>
        </div>
        <div class="stat-box">
          <span>Transactions</span>
          <strong>${state.transactions.length}</strong>
          <small>All-time Audit Log</small>
        </div>
        <div class="stat-box pending">
          <span>Pending Consents</span>
          <strong>${pendingConsents}</strong>
          <small>Awaiting Verification</small>
        </div>
        <div class="stat-box approved">
          <span>Approved Consents</span>
          <strong>${approvedConsents}</strong>
          <small>Active Open Banking</small>
        </div>
        <div class="stat-box rejected">
          <span>Rejected Consents</span>
          <strong>${rejectedConsents}</strong>
          <small>Disapproved Requests</small>
        </div>
        <div class="stat-box">
          <span>Beneficiaries</span>
          <strong>${state.beneficiaries.length}</strong>
          <small>Registered Payees</small>
        </div>
      </div>
    `;

    quickActionsContainer.innerHTML = `
      <button onclick="openModal('addCustomerModal')"><span>👥</span><strong>New Customer</strong><small>Create profile</small></button>
      <button onclick="openModal('addAccountModal')"><span>▣</span><strong>New Account</strong><small>Open bank account</small></button>
      <button onclick="openPage('consents')"><span>📜</span><strong>Consents</strong><small>Review authorizations</small></button>
      <button onclick="openPage('users')"><span>🔒</span><strong>System Users</strong><small>Manage roles</small></button>
    `;
  } else if (state.isChecker) {
    eyebrow.textContent = 'COMPLIANCE & CHECKER WORKSPACE';
    subheading.textContent = 'Authorization queue for Open Banking consents and transaction auditing.';

    statsContainer.innerHTML = `
      <div class="admin-stats-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="stat-box pending">
          <span>Pending Approvals</span>
          <strong>${pendingConsents}</strong>
          <small>Require Action</small>
        </div>
        <div class="stat-box approved">
          <span>Approved Consents</span>
          <strong>${approvedConsents}</strong>
          <small>Authorized</small>
        </div>
        <div class="stat-box rejected">
          <span>Rejected Consents</span>
          <strong>${rejectedConsents}</strong>
          <small>Disapproved</small>
        </div>
      </div>
    `;

    quickActionsContainer.innerHTML = `
      <button onclick="openPage('consents')"><span>📜</span><strong>Review Consents</strong><small>Approve / Reject</small></button>
      <button onclick="openPage('transactions')"><span>↔</span><strong>Audit Ledger</strong><small>View transactions</small></button>
      <button onclick="openPage('accounts')"><span>▣</span><strong>Inspect Accounts</strong><small>Check balances</small></button>
      <button onclick="loadAllData()"><span>↻</span><strong>Sync Records</strong><small>Refresh queue</small></button>
    `;
  } else if (state.isMaker) {
    eyebrow.textContent = 'OPERATIONS & MAKER WORKSPACE';
    subheading.textContent = 'Execute funds transfers and debit/credit ledger operations.';

    statsContainer.innerHTML = `
      <div class="summary-grid">
        <div class="balance-card">
          <div class="balance-head"><span>Managed Balance</span><span class="dots">•••</span></div>
          <div class="balance">${formatCurrency(totalBalance)}</div>
          <div class="balance-foot"><span>${state.accounts.length} Active Accounts</span><b>Real-Time Ledger</b></div>
        </div>
        <div class="metric-card">
          <div class="metric-icon income">↙</div>
          <span>Total Deposits</span>
          <strong>${formatCurrency(totalCredit)}</strong>
          <b class="up">Credit Operations</b>
          <div class="mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="metric-card">
          <div class="metric-icon expense">↗</div>
          <span>Total Withdrawals</span>
          <strong>${formatCurrency(totalDebit)}</strong>
          <b class="down">Debit Operations</b>
          <div class="mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    `;

    quickActionsContainer.innerHTML = `
      <button onclick="openPage('transfer')"><span>↗</span><strong>New Transfer</strong><small>Credit / Debit</small></button>
      <button onclick="openModal('addBeneficiaryModal')"><span>♧</span><strong>Add Payee</strong><small>Register beneficiary</small></button>
      <button onclick="openModal('addConsentModal')"><span>📜</span><strong>Request Consent</strong><small>Open Banking</small></button>
      <button onclick="openPage('transactions')"><span>↔</span><strong>Ledger History</strong><small>Audit trail</small></button>
    `;
  } else {
    // Normal User
    eyebrow.textContent = 'RETAIL ONLINE BANKING';
    subheading.textContent = 'Manage your personal accounts, transfers, and third-party consents.';

    statsContainer.innerHTML = `
      <div class="summary-grid">
        <div class="balance-card">
          <div class="balance-head"><span>Available Balance</span><span class="dots">•••</span></div>
          <div class="balance">${formatCurrency(totalBalance)}</div>
          <div class="balance-foot"><span>Across ${state.accounts.length} Account(s)</span><b>Verified</b></div>
        </div>
        <div class="metric-card">
          <div class="metric-icon income">↙</div>
          <span>Total Inflow</span>
          <strong>${formatCurrency(totalCredit)}</strong>
          <b class="up">Credits</b>
          <div class="mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="metric-card">
          <div class="metric-icon expense">↗</div>
          <span>Total Outflow</span>
          <strong>${formatCurrency(totalDebit)}</strong>
          <b class="down">Debits</b>
          <div class="mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    `;

    quickActionsContainer.innerHTML = `
      <button onclick="openPage('transfer')"><span>↗</span><strong>Send Money</strong><small>Transfer funds</small></button>
      <button onclick="openModal('addBeneficiaryModal')"><span>♧</span><strong>Add Payee</strong><small>Save beneficiary</small></button>
      <button onclick="openModal('addConsentModal')"><span>📜</span><strong>New Consent</strong><small>Grant access</small></button>
      <button onclick="openPage('transactions')"><span>↔</span><strong>My History</strong><small>Recent statements</small></button>
    `;
  }

  // Render Dashboard Accounts list
  const dashAccList = document.getElementById('dashboardAccountsList');
  if (state.accounts.length === 0) {
    dashAccList.innerHTML = '<div class="empty-state"><span>▣</span><h4>No Accounts Found</h4><p>No active accounts recorded.</p></div>';
  } else {
    dashAccList.innerHTML = state.accounts.slice(0, 4).map(acc => `
      <div class="account-row">
        <div class="account-icon ${acc.accountType === 'CURRENT' ? 'blue' : ''}">▣</div>
        <div class="account-name">
          <strong>${acc.accountNumber}</strong>
          <span>${acc.customer ? acc.customer.name : 'Unknown'} • ${acc.accountType || 'SAVINGS'}</span>
        </div>
        <div class="account-balance">
          <strong>${formatCurrency(acc.balance)}</strong>
          <span class="badge ${acc.status ? acc.status.toLowerCase() : 'active'}">${acc.status || 'ACTIVE'}</span>
        </div>
      </div>
    `).join('');
  }

  // Render Dashboard Recent Transactions
  const dashTxList = document.getElementById('dashboardRecentTxns');
  if (state.transactions.length === 0) {
    dashTxList.innerHTML = '<div class="empty-state"><span>↔</span><h4>No Transactions</h4><p>No recent activity recorded.</p></div>';
  } else {
    dashTxList.innerHTML = state.transactions.slice(0, 5).map(tx => {
      const isCredit = tx.type === 'CREDIT';
      const icon = isCredit ? '↙' : '↗';
      const cls = isCredit ? 'income' : 'expense';
      const sign = isCredit ? '+' : '-';
      const amtCls = isCredit ? 'positive' : 'negative';

      return `
        <div class="transaction">
          <div class="tx-icon ${cls}">${icon}</div>
          <div class="tx-info">
            <strong>${tx.description || (isCredit ? 'Credit Deposit' : 'Debit Payment')}</strong>
            <span>${tx.transactionReference || 'TXN'} • ${formatDate(tx.timestamp)}</span>
          </div>
          <div class="amount ${amtCls}"><b>${sign} ${formatCurrency(tx.amount)}</b></div>
          <div class="status">${tx.transactionStatus || 'SUCCESS'}</div>
        </div>
      `;
    }).join('');
  }
}

// ================= CUSTOMERS MANAGEMENT =================
function renderCustomers() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  const search = (document.getElementById('customerSearchInput')?.value || '').toLowerCase();
  const filtered = state.customers.filter(c => {
    return (
      (c.name && c.name.toLowerCase().includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search)) ||
      (c.phone && c.phone.toLowerCase().includes(search)) ||
      (c.address && c.address.toLowerCase().includes(search))
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><span>👥</span><h4>No Customers Found</h4><p>No matching customer records.</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td><b>#${c.id}</b></td>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.phone || '-'}</td>
      <td>${c.address || '-'}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="startEditCustomer(${c.id})" title="Edit Customer">✎ Edit</button>
          <button class="btn-icon danger" onclick="confirmDeleteCustomer(${c.id}, '${c.name.replace(/'/g, "\\'")}')" title="Delete Customer">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

document.getElementById('customerSearchInput')?.addEventListener('input', renderCustomers);

document.getElementById('openAddCustomerModal')?.addEventListener('click', () => {
  document.getElementById('addCustomerForm').reset();
  openModal('addCustomerModal');
});

document.getElementById('addCustomerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newCustName').value.trim();
  const email = document.getElementById('newCustEmail').value.trim();
  const phone = document.getElementById('newCustPhone').value.trim();
  const address = document.getElementById('newCustAddress').value.trim();

  try {
    await apiRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, address })
    });
    closeModal('addCustomerModal');
    toast('Customer registered successfully');
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
});

function startEditCustomer(id) {
  const c = state.customers.find(item => item.id === id);
  if (!c) return;

  document.getElementById('editCustId').value = c.id;
  document.getElementById('editCustName').value = c.name;
  document.getElementById('editCustEmail').value = c.email;
  document.getElementById('editCustPhone').value = c.phone || '';
  document.getElementById('editCustAddress').value = c.address || '';
  openModal('editCustomerModal');
}

document.getElementById('editCustomerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editCustId').value;
  const name = document.getElementById('editCustName').value.trim();
  const email = document.getElementById('editCustEmail').value.trim();
  const phone = document.getElementById('editCustPhone').value.trim();
  const address = document.getElementById('editCustAddress').value.trim();

  try {
    await apiRequest(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, phone, address })
    });
    closeModal('editCustomerModal');
    toast('Customer updated successfully');
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
});

function confirmDeleteCustomer(id, name) {
  showConfirm(
    'Delete Customer Record',
    `Are you sure you want to delete customer "${name}" (#${id})? Associated accounts and data may be affected.`,
    'Delete Customer',
    async () => {
      try {
        await apiRequest(`/api/customers/${id}`, { method: 'DELETE' });
        toast('Customer removed successfully');
        loadAllData();
      } catch (err) {
        showAlert('error', err.message);
      }
    }
  );
}

// ================= ACCOUNTS MANAGEMENT =================
function renderAccounts() {
  const grid = document.getElementById('accountsGrid');
  if (!grid) return;

  const search = (document.getElementById('accountSearchInput')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('accountTypeFilter')?.value || '';
  const statusFilter = document.getElementById('accountStatusFilter')?.value || '';

  const filtered = state.accounts.filter(a => {
    const matchesSearch = (
      (a.accountNumber && a.accountNumber.toLowerCase().includes(search)) ||
      (a.customer && a.customer.name && a.customer.name.toLowerCase().includes(search))
    );
    const matchesType = !typeFilter || a.accountType === typeFilter;
    const matchesStatus = !statusFilter || a.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Toggle Add Account button visibility
  const addAccBtn = document.getElementById('openAddAccountModal');
  if (addAccBtn) {
    addAccBtn.style.display = state.isAdmin ? 'inline-block' : 'none';
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><span>▣</span><h4>No Bank Accounts Found</h4><p>Try modifying your search or filters.</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(a => `
    <div class="account-large ${a.accountType === 'CURRENT' ? 'secondary-card' : ''}">
      <div class="account-large-top">
        <span>${a.accountType || 'SAVINGS'} ACCOUNT</span>
        <span class="badge ${a.status ? a.status.toLowerCase() : 'active'}">${a.status || 'ACTIVE'}</span>
      </div>
      <h3>${a.accountNumber}</h3>
      <p>Holder: ${a.customer ? a.customer.name : 'Unknown'} • Added: ${formatDate(a.createdAt)}</p>
      <strong>${formatCurrency(a.balance)}</strong>
      <div class="account-details">
        <div>
          <span>CUSTOMER EMAIL</span>
          <b>${a.customer ? a.customer.email : '-'}</b>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn-icon" onclick="filterTransactionsByAccount('${a.accountNumber}')" style="color:white; background:rgba(255,255,255,0.2); border:0;">View Txns</button>
          ${state.isAdmin ? `
            <button class="btn-icon" onclick="startEditAccount(${a.id}, '${a.accountNumber}', '${a.accountType}', '${a.status}')" style="color:white; background:rgba(255,255,255,0.2); border:0;">Status</button>
            <button class="btn-icon danger" onclick="confirmDeleteAccount(${a.id}, '${a.accountNumber}')" style="border:0;">✕</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

document.getElementById('accountSearchInput')?.addEventListener('input', renderAccounts);
document.getElementById('accountTypeFilter')?.addEventListener('change', renderAccounts);
document.getElementById('accountStatusFilter')?.addEventListener('change', renderAccounts);

document.getElementById('openAddAccountModal')?.addEventListener('click', () => {
  document.getElementById('addAccountForm').reset();
  openModal('addAccountModal');
});

document.getElementById('addAccountForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const customerId = document.getElementById('newAccCustomer').value;
  const accountNumber = document.getElementById('newAccNumber').value.trim();
  const accountType = document.getElementById('newAccType').value;
  const balance = parseFloat(document.getElementById('newAccBalance').value || '0');

  try {
    await apiRequest('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ customerId: Number(customerId), accountNumber, accountType, initialBalance: balance })
    });
    closeModal('addAccountModal');
    toast('Bank account created successfully');
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
});

function startEditAccount(id, accNum, type, status) {
  document.getElementById('editAccId').value = id;
  document.getElementById('editAccNumber').value = accNum;
  document.getElementById('editAccType').value = type || 'SAVINGS';
  document.getElementById('editAccStatus').value = status || 'ACTIVE';
  openModal('editAccountModal');
}

document.getElementById('editAccountForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editAccId').value;
  const accountType = document.getElementById('editAccType').value;
  const status = document.getElementById('editAccStatus').value;

  try {
    await apiRequest(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ accountType, status })
    });
    closeModal('editAccountModal');
    toast('Account status updated');
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
});

function confirmDeleteAccount(id, accNum) {
  showConfirm(
    'Delete Bank Account',
    `Are you sure you want to close and remove account "${accNum}" (#${id})?`,
    'Delete Account',
    async () => {
      try {
        await apiRequest(`/api/accounts/${id}`, { method: 'DELETE' });
        toast('Account closed and removed');
        loadAllData();
      } catch (err) {
        showAlert('error', err.message);
      }
    }
  );
}

// ================= TRANSFERS & TRANSACTIONS =================
document.getElementById('transferForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const accountId = document.getElementById('transferAccountSelect').value;
  const type = document.getElementById('transferTypeSelect').value;
  const amount = parseFloat(document.getElementById('transferAmount').value);
  const description = document.getElementById('transferDescription').value.trim();

  if (!accountId || isNaN(amount) || amount <= 0) {
    showAlert('warning', 'Please provide a valid account and transfer amount.');
    return;
  }

  const submitBtn = document.getElementById('transferSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing Transfer...';

  try {
    const res = await apiRequest(`/api/accounts/${accountId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ type, amount, description })
    });

    toast(`Transaction successful! Ref: ${res.transactionReference || 'Recorded'}`);
    document.getElementById('transferForm').reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Transfer →';
    await loadAllData();
    openPage('transactions');
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Transfer →';
    showAlert('error', err.message);
  }
});

function renderTransactions() {
  const tbody = document.getElementById('transactionsTableBody');
  if (!tbody) return;

  const search = (document.getElementById('txnSearchInput')?.value || '').toLowerCase();
  const accFilter = document.getElementById('txnAccountFilter')?.value || '';
  const typeFilter = document.getElementById('txnTypeFilter')?.value || '';

  const filtered = state.transactions.filter(t => {
    const matchesSearch = (
      (t.transactionReference && t.transactionReference.toLowerCase().includes(search)) ||
      (t.description && t.description.toLowerCase().includes(search))
    );
    const matchesAcc = !accFilter || (t.account && String(t.account.id) === accFilter);
    const matchesType = !typeFilter || t.type === typeFilter;
    return matchesSearch && matchesAcc && matchesType;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><span>↔</span><h4>No Transactions Recorded</h4><p>No matching transactions in ledger.</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const isCredit = t.type === 'CREDIT';
    const sign = isCredit ? '+' : '-';
    const color = isCredit ? '#15803d' : '#b91c1c';
    const bg = isCredit ? '#dcfce7' : '#fee2e2';

    return `
      <tr>
        <td><code>${t.transactionReference || 'TXN-' + t.id}</code></td>
        <td><b>${t.account ? t.account.accountNumber : '-'}</b></td>
        <td>
          <span style="background:${bg}; color:${color}; padding:3px 8px; border-radius:12px; font-weight:700; font-size:10px;">
            ${t.type}
          </span>
        </td>
        <td><strong style="color:${color}">${sign} ${formatCurrency(t.amount)}</strong></td>
        <td><span class="badge active">${t.transactionStatus || 'COMPLETED'}</span></td>
        <td>${t.description || '-'}</td>
        <td>${formatDate(t.timestamp)}</td>
      </tr>
    `;
  }).join('');
}

document.getElementById('txnSearchInput')?.addEventListener('input', renderTransactions);
document.getElementById('txnAccountFilter')?.addEventListener('change', renderTransactions);
document.getElementById('txnTypeFilter')?.addEventListener('change', renderTransactions);

function filterTransactionsByAccount(accountNumber) {
  openPage('transactions');
  const acc = state.accounts.find(a => a.accountNumber === accountNumber);
  if (acc) {
    const sel = document.getElementById('txnAccountFilter');
    if (sel) {
      sel.value = String(acc.id);
      renderTransactions();
    }
  }
}

// ================= BENEFICIARIES MANAGEMENT =================
function renderBeneficiaries() {
  const grid = document.getElementById('beneficiariesGrid');
  if (!grid) return;

  const search = (document.getElementById('beneficiarySearchInput')?.value || '').toLowerCase();
  const filtered = state.beneficiaries.filter(b => {
    return (
      (b.name && b.name.toLowerCase().includes(search)) ||
      (b.bankName && b.bankName.toLowerCase().includes(search)) ||
      (b.accountNumber && b.accountNumber.toLowerCase().includes(search))
    );
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><span>♧</span><h4>No Beneficiaries Added</h4><p>Add a beneficiary to initiate quick transfers.</p></div>';
    return;
  }

  const canDelete = state.isAdmin || state.isChecker;

  grid.innerHTML = filtered.map(b => `
    <div class="beneficiary">
      <div class="person-avatar">${(b.name.charAt(0) || 'P').toUpperCase()}</div>
      <div>
        <strong>${b.name}</strong>
        <span>${b.bankName} • ${b.accountNumber} ${b.ifscCode ? '• IFSC: ' + b.ifscCode : ''}</span>
      </div>
      <div>
        ${canDelete ? `
          <button class="btn-icon danger" onclick="confirmDeleteBeneficiary(${b.id}, '${b.name.replace(/'/g, "\\'")}')" title="Delete Beneficiary">✕</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

document.getElementById('beneficiarySearchInput')?.addEventListener('input', renderBeneficiaries);

document.getElementById('openAddBeneficiaryModal')?.addEventListener('click', () => {
  document.getElementById('addBeneficiaryForm').reset();
  openModal('addBeneficiaryModal');
});

document.getElementById('addBeneficiaryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  let customerId = document.getElementById('newBenCustomer')?.value;
  if (!customerId && state.myCustomerId) customerId = state.myCustomerId;

  const name = document.getElementById('newBenName').value.trim();
  const accountNumber = document.getElementById('newBenAccount').value.trim();
  const bankName = document.getElementById('newBenBank').value.trim();
  const ifscCode = document.getElementById('newBenIfsc').value.trim();

  try {
    await apiRequest('/api/beneficiaries', {
      method: 'POST',
      body: JSON.stringify({ customerId: Number(customerId), name, accountNumber, bankName, ifscCode })
    });
    closeModal('addBeneficiaryModal');
    toast('Beneficiary added successfully');
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
});

function confirmDeleteBeneficiary(id, name) {
  showConfirm(
    'Delete Beneficiary Payee',
    `Remove payee "${name}" from registered beneficiaries?`,
    'Delete Payee',
    async () => {
      try {
        await apiRequest(`/api/beneficiaries/${id}`, { method: 'DELETE' });
        toast('Beneficiary deleted successfully');
        loadAllData();
      } catch (err) {
        showAlert('error', err.message);
      }
    }
  );
}

// ================= CONSENTS MANAGEMENT =================
function renderConsents() {
  const tbody = document.getElementById('consentsTableBody');
  if (!tbody) return;

  const search = (document.getElementById('consentSearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('consentStatusFilter')?.value || '';

  const filtered = state.consents.filter(c => {
    const matchesSearch = (
      (c.purpose && c.purpose.toLowerCase().includes(search)) ||
      (c.customer && c.customer.name && c.customer.name.toLowerCase().includes(search)) ||
      String(c.id).includes(search)
    );
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><span>📜</span><h4>No Consents Found</h4><p>No open banking consent records match your criteria.</p></td></tr>';
    return;
  }

  const canAuthorize = state.isAdmin || state.isChecker;

  tbody.innerHTML = filtered.map(c => {
    const isPending = c.status === 'PENDING';
    const isApproved = c.status === 'APPROVED';
    const isRejected = c.status === 'REJECTED';

    let badgeClass = 'pending';
    if (isApproved) badgeClass = 'approved';
    if (isRejected) badgeClass = 'rejected';

    let actionContent = '';
    if (isPending) {
      if (canAuthorize) {
        actionContent = `
          <div class="table-actions">
            <button class="btn-sm btn-approve" onclick="approveConsent(${c.id})">✓ Approve</button>
            <button class="btn-sm btn-reject" onclick="rejectConsent(${c.id})">✕ Reject</button>
          </div>
        `;
      } else {
        actionContent = '<span style="color:#94a3b8; font-size:10px;">Pending Checker Review</span>';
      }
    } else {
      actionContent = `<span style="color:#64748b; font-size:10px; font-weight:600;">Resolved (${c.status})</span>`;
    }

    return `
      <tr>
        <td><code>CNS-${c.id}</code></td>
        <td><strong>${c.customer ? c.customer.name : 'Unknown'}</strong></td>
        <td>${c.purpose}</td>
        <td><span class="badge ${badgeClass}">${c.status}</span></td>
        <td>${formatDate(c.createdAt)}</td>
        <td>${formatDate(c.approvedAt || c.rejectedAt)}</td>
        <td>${actionContent}</td>
      </tr>
    `;
  }).join('');
}

document.getElementById('consentSearchInput')?.addEventListener('input', renderConsents);
document.getElementById('consentStatusFilter')?.addEventListener('change', renderConsents);

document.getElementById('openAddConsentModal')?.addEventListener('click', () => {
  document.getElementById('addConsentForm').reset();
  openModal('addConsentModal');
});

document.getElementById('addConsentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  let customerId = document.getElementById('newConsentCustomer')?.value;
  if (!customerId && state.myCustomerId) customerId = state.myCustomerId;

  const purpose = document.getElementById('newConsentPurpose').value.trim();

  try {
    await apiRequest('/api/consents', {
      method: 'POST',
      body: JSON.stringify({ customerId: Number(customerId), purpose })
    });
    closeModal('addConsentModal');
    toast('Consent request submitted (Status: PENDING)');
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
});

async function approveConsent(id) {
  try {
    await apiRequest(`/api/consents/${id}/approve`, { method: 'POST' });
    toast(`Consent #${id} approved successfully`);
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
}

async function rejectConsent(id) {
  try {
    await apiRequest(`/api/consents/${id}/reject`, { method: 'POST' });
    toast(`Consent #${id} rejected`);
    loadAllData();
  } catch (err) {
    showAlert('error', err.message);
  }
}

// ================= SYSTEM USERS MANAGEMENT (ADMIN) =================
function renderUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (state.users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><span>🔒</span><h4>No Users Found</h4></td></tr>';
    return;
  }

  tbody.innerHTML = state.users.map(u => {
    const rolesStr = (u.roles || []).map(r => `<span class="role-badge ${r.toLowerCase()}">${r}</span>`).join(' ');
    return `
      <tr>
        <td><strong>${u.username}</strong></td>
        <td>${u.displayName || '-'}</td>
        <td>${rolesStr}</td>
        <td><span class="badge approved">${u.status || 'ACTIVE'}</span></td>
        <td>${formatDate(u.createdAt)}</td>
      </tr>
    `;
  }).join('');
}

// ================= DROPDOWN POPULATION =================
function populateDropdowns() {
  // Accounts for transfer
  const transferSelect = document.getElementById('transferAccountSelect');
  if (transferSelect) {
    transferSelect.innerHTML = '<option value="">Select Account</option>' +
      state.accounts.map(a => `
        <option value="${a.id}">${a.accountNumber} - ${a.customer ? a.customer.name : 'Unknown'} (${formatCurrency(a.balance)})</option>
      `).join('');
  }

  // Accounts for transaction filter
  const txnAccFilter = document.getElementById('txnAccountFilter');
  if (txnAccFilter) {
    txnAccFilter.innerHTML = '<option value="">All Accounts</option>' +
      state.accounts.map(a => `
        <option value="${a.id}">${a.accountNumber}</option>
      `).join('');
  }

  // Customers for new account
  const newAccCust = document.getElementById('newAccCustomer');
  if (newAccCust) {
    newAccCust.innerHTML = '<option value="">Select Customer</option>' +
      state.customers.map(c => `
        <option value="${c.id}">${c.name} (${c.email})</option>
      `).join('');
  }

  // Customers for beneficiary
  const newBenCust = document.getElementById('newBenCustomer');
  if (newBenCust) {
    newBenCust.innerHTML = '<option value="">Select Customer</option>' +
      state.customers.map(c => `
        <option value="${c.id}">${c.name} (${c.email})</option>
      `).join('');
  }

  // Customers for consent
  const newConsentCust = document.getElementById('newConsentCustomer');
  if (newConsentCust) {
    newConsentCust.innerHTML = '<option value="">Select Customer</option>' +
      state.customers.map(c => `
        <option value="${c.id}">${c.name} (${c.email})</option>
      `).join('');
  }
}

// Export Customers CSV Helper
function exportCustomersCSV() {
  if (state.customers.length === 0) {
    toast('No customers to export');
    return;
  }
  let csv = 'ID,Name,Email,Phone,Address,CreatedAt\n';
  state.customers.forEach(c => {
    csv += `"${c.id}","${c.name}","${c.email}","${c.phone || ''}","${c.address || ''}","${c.createdAt || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `novabank-customers-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentDate').textContent =
    new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  buildSidebarNavigation();
  loadAllData();
});
