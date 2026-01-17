document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== 'mitra') {
    window.location.href = "../login.html";
    return;
  }

  fetchCancellations(currentUser.id).then(() => {
    // Check if there's a tab param in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      const tabMap = {
        'pending': 1, // index of buttons
        'refunded': 2
      };
      const buttons = document.querySelectorAll('.cr-tab');
      if (tabMap[tab] && buttons[tabMap[tab]]) {
        filterData(tab, buttons[tabMap[tab]]);
      }
    }
  });
});

async function fetchCancellations(mitraId) {
  try {
    const res = await fetch(`/mitra/cancellations/${mitraId}`);
    if (!res.ok) throw new Error("Gagal mengambil data");

    window.allCancellations = await res.json();
    renderList(window.allCancellations);
  } catch (err) {
    console.error(err);
    document.getElementById('data-container').innerHTML = '<div style="text-align:center; padding:40px; color: #888">Gagal memuat data.</div>';
  }
}

function renderList(data) {
  const container = document.getElementById('data-container');
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:20px;">Tidak ada data pembatalan.</div>';
    return;
  }

  data.forEach(item => {
    const resDate = new Date(item.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const reqDate = new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    let badgeHtml = '';
    let actionsHtml = '';
    let statusTag = '';

    if (item.status === 'pending') {
      badgeHtml = `<div class="cr-badge cr-badge--pending">Menunggu Persetujuan</div>`;
      actionsHtml = `
                <div class="cr-actions">
                  <div class="cr-actions__prompt">
                    <span class="cr-prompt-text">Konfirmasi refund untuk customer?</span>
                  </div>
                  <div class="cr-actions__buttons">
                    <button class="cr-btn cr-btn--approve" onclick="handleAction('${item.id}', 'refunded')">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Konfirmasi Refund
                    </button>
                  </div>
                </div>`;
    } else if (item.status === 'refunded') {
      badgeHtml = `<div class="cr-badge cr-badge--cancelled">Dibatalkan (Refund Sukses)</div>`;
      statusTag = `<div class="cr-footer-status"><div class="cr-status-tag cr-status-tag--refunded">Dana Dikembalikan</div></div>`;
    } else if (item.status === 'rejected_by_policy') {
      badgeHtml = `<div class="cr-badge cr-badge--rejected">Dibatalkan (Uang Hangus)</div>`;
      statusTag = `<div class="cr-footer-status"><div class="cr-status-tag cr-status-tag--rejected">Tanpa Refund</div></div>`;
    }

    const cardHtml = `
          <div class="cr-card" id="card-${item.id}">
            <div class="cr-card__header">
              <div class="cr-card__meta">
                <h3 class="cr-card__venue">${item.studio_name}</h3>
                <div class="cr-card__submeta">
                  <span class="cr-card__id">ID Booking: #${item.booking_id}</span>
                  <span class="cr-card__separator">•</span>
                  <span class="cr-card__package">${item.customer_name}</span>
                </div>
              </div>
              ${badgeHtml}
            </div>

            <div class="cr-info-grid">
              <div class="cr-info-item">
                <span class="cr-label">Tanggal Reservasi</span>
                <span class="cr-value">${resDate}</span>
              </div>
              <div class="cr-info-item">
                <span class="cr-label">Total Harga</span>
                <span class="cr-value">${formatRupiah(item.total_price)}</span>
              </div>
              <div class="cr-info-item">
                <span class="cr-label">Jumlah Refund</span>
                <span class="cr-value" style="color: ${item.refund_amount > 0 ? '#10b981' : '#ef4444'}">
                    ${item.refund_amount > 0 ? formatRupiah(item.refund_amount) : 'Rp. 0 (Hangus)'}
                </span>
              </div>
            </div>

            <div class="cr-reason">
              <span class="cr-reason__label">Alasan Pembatalan:</span>
              <span class="cr-reason__text">${item.reason}</span>
            </div>
            
            ${item.refund_amount > 0 ? `
            <div class="cr-bank-details" style="background: #f0fdf4; border: 1px dashed #10b981; border-radius: 8px; padding: 12px; margin-top: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #065f46; margin-bottom: 8px;">TUJUAN REFUND:</div>
              <div style="font-size: 13px; color: #059669;">
                <b>Bank:</b> ${item.bank_name}<br>
                <b>No Rekening:</b> ${item.account_number}<br>
                <b>Atas Nama:</b> ${item.account_name}
              </div>
            </div>` : ''}

            <div class="cr-timestamp" style="margin-top: 12px; font-size: 11px; color: #999;">Diajukan: ${reqDate}</div>

            ${actionsHtml}
            ${statusTag}
          </div>
        `;

    container.insertAdjacentHTML('beforeend', cardHtml);
  });
}

function filterData(status, tabElement) {
  document.querySelectorAll('.cr-tab').forEach(t => t.classList.remove('cr-tab--active'));
  tabElement.classList.add('cr-tab--active');

  let filteredData;
  if (status === 'all') {
    filteredData = window.allCancellations;
  } else if (status === 'refunded') {
    // "Sudah Diproses" should include both refunded and rejected/forfeited
    filteredData = window.allCancellations.filter(item => item.status === 'refunded' || item.status === 'rejected_by_policy');
  } else {
    filteredData = window.allCancellations.filter(item => item.status === status);
  }
  renderList(filteredData);
}

async function handleAction(id, newStatus) {
  if (!confirm(`Konfirmasi bahwa refund telah diproses ke rekening pelanggan?`)) return;

  try {
    const res = await fetch(`/cancellations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      alert("Status berhasil diperbarui!");
      fetchCancellations(JSON.parse(localStorage.getItem("currentUser")).id);
    }
  } catch (err) {
    alert("Gagal memperbarui status");
  }
}
