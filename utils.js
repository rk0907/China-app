function formatMoney(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const n = parseFloat(amount);
  if (isNaN(n)) return '—';
  return 'GH₵' + n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return iso;
  }
}

function statusBadge(status) {
  const map = {
    'NEW': 'bg-blue-100 text-blue-800',
    'REVIEWING': 'bg-indigo-100 text-indigo-800',
    'SOURCING': 'bg-purple-100 text-purple-800',
    'OPTIONS_FOUND': 'bg-violet-100 text-violet-800',
    'QUOTED': 'bg-amber-100 text-amber-800',
    'CUSTOMER_ACCEPTED': 'bg-teal-100 text-teal-800',
    'AWAITING_PAYMENT': 'bg-orange-100 text-orange-800',
    'PAYMENT_SUBMITTED': 'bg-yellow-100 text-yellow-800',
    'PAYMENT_CONFIRMED': 'bg-green-100 text-green-800',
    'READY_TO_PURCHASE': 'bg-emerald-100 text-emerald-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'ON_HOLD': 'bg-gray-100 text-gray-800'
  };
  const cls = map[status] || 'bg-gray-100 text-gray-700';
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}">${status.replace(/_/g, ' ')}</span>`;
}

function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-opacity ${
    type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  }`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function qs(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type, filename: file.name });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
