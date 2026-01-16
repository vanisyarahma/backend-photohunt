      function renderEmptyState(container, message) {
        container.innerHTML = `
            <div class="mitra-dashboard-list-item mitra-dashboard-item-simple" style="justify-content:center;">
            <span class="text-italic text-sm">${message}</span>
            </div>
        `;
      }

      const accountData = {
        mitraName: "Selfie Time Studio",
        stats: { today: 5, pending: 3, cancellation: 4, revenue: 460000 },
        cancellationRequests: [
          {
            id: "res_016", location: "Selfie Time, Mal Lippo Cikarang",
            package: "Paket Couple", date: "25/12/2025", time: "14:00",
            total: 45000, refund: 45000, reason: "Ada acara keluarga mendadak", submitted: "15/12/2025, 14.30.00",
          },
        ],
        upcomingSchedule: [
          { location: "Selfie Time, Mal Lippo Cikarang", date: "Rabu, 17 Des 2025", time: "13:00", status: "confirmed", statusLabel: "Terkonfirmasi" },
          { location: "Selfie Time, Mal Lippo Cikarang", date: "Kamis, 18 Des 2025", time: "10:00", status: "waiting", statusLabel: "Menunggu" },
          { location: "Selfie Time, Mal Lippo Cikarang", date: "Minggu, 21 Des 2025", time: "11:00", status: "waiting", statusLabel: "Menunggu" },
        ],
      };

      const formatRupiah = (number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);

      function checkNotifications(currentCancelCount) {
          const STORAGE_KEY = 'ph_seen_cancel_count';
          let lastSeenCount = parseInt(localStorage.getItem(STORAGE_KEY)) || 0;
          
          const badge = document.getElementById("ph-notif-badge");
          const card = document.getElementById("ph-card-cancel");

          if (currentCancelCount > lastSeenCount) {
              const diff = currentCancelCount - lastSeenCount;
              badge.textContent = `${diff} baru`;
              badge.style.display = "block";
              
              card.classList.add("accent-orange");
          } else {
              badge.style.display = "none";
              
              card.classList.remove("accent-orange");
          }
      }

      function markCancelAsRead() {
          const STORAGE_KEY = 'ph_seen_cancel_count';
          const badge = document.getElementById("ph-notif-badge");
          const card = document.getElementById("ph-card-cancel");
          
          localStorage.setItem(STORAGE_KEY, accountData.stats.cancellation);
          
          badge.style.display = "none";
          
          card.classList.remove("accent-orange");
          
          console.log("Notifikasi dibaca, warna kembali ke default (abu).");
      }

      function renderDashboard(data) {
        document.getElementById("ph-mitra-name").textContent = `Selamat datang, ${data.mitraName}`;
        document.getElementById("ph-stats-today").textContent = data.stats.today;
        document.getElementById("ph-stats-pending").textContent = data.stats.pending;
        document.getElementById("ph-stats-cancel").textContent = data.stats.cancellation;
        document.getElementById("ph-stats-revenue").textContent = formatRupiah(data.stats.revenue);

        checkNotifications(data.stats.cancellation);

        document.getElementById("ph-title-cancel-count").textContent = `Pengajuan Pembatalan (${data.cancellationRequests.length})`;
        const cancelContainer = document.getElementById("ph-list-cancel-requests");
        cancelContainer.innerHTML = "";
        
        if (data.cancellationRequests.length === 0) {
              renderEmptyState(cancelContainer, "Tidak ada pengajuan pembatalan");
        } else {
            const itemsToShow = data.cancellationRequests.slice(0, 2); 
            itemsToShow.forEach((item) => {
            cancelContainer.innerHTML += `
                    <div class="mitra-dashboard-list-item mitra-dashboard-item-orange" data-id="${item.id}">
                        <div class="mitra-dashboard-item-top">
                            <span class="mitra-dashboard-location">${item.location}</span>
                            <span class="mitra-dashboard-tag">ID: ${item.id}</span>
                        </div>
                        <div class="mitra-dashboard-text-row">${item.package} • ${item.date} • ${item.time}</div>
                        <div class="mitra-dashboard-text-row">Total: <span class="text-bold">${formatRupiah(item.total)}</span></div>
                        <div class="mitra-dashboard-text-row text-danger">Refund: ${formatRupiah(item.refund)}</div>
                        <div class="mitra-dashboard-text-row text-italic">Alasan: ${item.reason}</div>
                    </div>`;
            });
            if(data.cancellationRequests.length > 2) {
                 cancelContainer.innerHTML += `<div style="text-align:center; font-size:12px; color:var(--md-text-muted); margin-top:8px;">+ ${data.cancellationRequests.length - 2} pengajuan lainnya...</div>`;
            }
        }

        const scheduleContainer = document.getElementById("ph-list-schedule");
        scheduleContainer.innerHTML = "";
        data.upcomingSchedule.forEach((item) => {
          const statusClass = item.status === "confirmed" ? "status-confirmed" : "status-waiting";
          scheduleContainer.innerHTML += `
                    <div class="mitra-dashboard-list-item mitra-dashboard-item-simple">
                        <div>
                            <div class="mitra-dashboard-location">${item.location}</div>
                            <div class="mitra-dashboard-date-group">
                                <span>${item.date}</span>
                                <span>${item.time}</span>
                            </div>
                        </div>
                        <div class="mitra-dashboard-status-pill ${statusClass}">${item.statusLabel}</div>
                    </div>`;
        });

        const historyContainer = document.getElementById("ph-list-history");
        historyContainer.innerHTML = "";
        data.historyCancellations.forEach((item) => {
          historyContainer.innerHTML += `
                    <div class="mitra-dashboard-list-item mitra-dashboard-item-red">
                        <div class="mitra-dashboard-item-top">
                            <span class="mitra-dashboard-location">${item.location}</span>
                            <span class="text-danger text-sm">${item.reqDate}</span>
                        </div>
                        <div class="mitra-dashboard-text-row">${item.bookDate}</div>
                        <div class="mitra-dashboard-text-row text-italic">Alasan: ${item.reason}</div>
                    </div>`;
        });
      }
    
      document.getElementById("ph-btn-profile").addEventListener("click", () => {
          window.location.href = ".html";
          console.log("Navigasi ke: Profil"); 
      });
      
      document.getElementById("ph-card-today").addEventListener("click", () => {
          window.location.href = "reservasi-mitra.html";
          console.log("Navigasi ke: Reservasi Hari Ini");
      });

      document.getElementById("ph-card-pending").addEventListener("click", () => {
          window.location.href = "reservasi-mitra.html";  
          console.log("Navigasi ke: Menunggu Konfirmasi");
      });

      document.getElementById("ph-card-cancel").addEventListener("click", () => {
          markCancelAsRead(); 
          window.location.href = "pembatalan-mitra.html";
          console.log("Navigasi ke: Pengajuan Pembatalan");
      });

      document.getElementById("ph-card-revenue").addEventListener("click", () => {
        window.location.href = "transaksi-mitra.html";
        console.log("Navigasi ke: Total Pendapatan");
      });

      document.getElementById("ph-action-studio").addEventListener("click", () => {
          window.location.href = "kelola-studio.html";
          console.log("Navigasi ke: Kelola Studio");
      });

      document.getElementById("ph-action-reservation").addEventListener("click", () => {
          window.location.href = "reservasi-mitra.html";
          console.log("Navigasi ke: Kelola Studio");
      });

      document.getElementById("ph-action-transaction").addEventListener("click", () => {
          window.location.href = "transaksi-mitra.html";
          console.log("Navigasi ke: Kelola Studio");
      });

      document.getElementById("ph-action-cancellation").addEventListener("click", () => {
          window.location.href = "pembatalan-mitra.html";
          console.log("Navigasi ke: Kelola Studio");
      });
      
      document.getElementById("ph-btn-view-all-cancel").addEventListener("click", () => {
          window.location.href = "pembatalan-mitra.html";
          console.log("Navigasi ke: Kelola Studio");
      });

      document.addEventListener("DOMContentLoaded", () => {
        renderDashboard(accountData);
      });
