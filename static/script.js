let chart;

const THEME_KEY = 'scem-theme';

/* ================= THEME (light / dark toggle) ================= */

function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-toggle-icon');
    const label = document.getElementById('theme-toggle-label');
    if (icon) icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    if (label) label.innerText = theme === 'dark' ? 'Light mode' : 'Dark mode';
    updateChartThemeColors(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
}

function initTheme() {
    applyTheme(getPreferredTheme());
}

function updateClock() {
    const digitalClock = document.getElementById('digital-clock');
    if (digitalClock) {
        digitalClock.innerText = new Date().toLocaleTimeString('id-ID') + ' WIB';
    }
}

/* ================= NAVIGATION ================= */

function switchPage(evt, pageName) {
    if (evt) evt.preventDefault();

    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('d-none'));
    document.querySelectorAll('.nav-link-item').forEach(link => link.classList.remove('active'));

    const activeSec = document.getElementById(`page-${pageName}`);
    if (activeSec) activeSec.classList.remove('d-none');

    const titleElem = document.getElementById('current-page-title');
    const titles = {
        'home': 'Home',
        'dashboard': 'Main Dashboard',
        'about': 'About Us',
        'faq': 'FAQ & Bantuan'
    };
    if (titleElem) titleElem.innerText = titles[pageName] || 'SCEM';

    const clickedIsNavLink = evt && evt.currentTarget && evt.currentTarget.classList.contains('nav-link-item');
    if (clickedIsNavLink) {
        evt.currentTarget.classList.add('active');
    } else {
        const navLink = document.querySelector(`.nav-link-item[onclick*="'${pageName}'"]`);
        if (navLink) navLink.classList.add('active');
    }

    document.getElementById('sidebar-wrapper')?.classList.remove('show');
    document.getElementById('sidebar-backdrop')?.classList.remove('show');

    if (pageName === 'dashboard' && chart) {
        chart.resize();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar-wrapper')?.classList.toggle('show');
    document.getElementById('sidebar-backdrop')?.classList.toggle('show');
}

/* ================= CHART ================= */

function themeColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
        text: styles.getPropertyValue('--text-primary').trim(),
        muted: styles.getPropertyValue('--text-secondary').trim(),
        border: styles.getPropertyValue('--border').trim(),
        surface: styles.getPropertyValue('--surface').trim(),
        accent: styles.getPropertyValue('--accent').trim(),
        danger: styles.getPropertyValue('--danger').trim(),
    };
}

function initChart() {
    const ctx = document.getElementById('tempChart');
    if (!ctx) return;
    const c = themeColors();

    chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Suhu (°C)',
                    data: [],
                    yAxisID: 'ySuhu',
                    borderColor: c.accent,
                    backgroundColor: c.accent + '22',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: c.accent,
                    pointHitRadius: 12,
                },
                {
                    label: 'Kelembapan (%)',
                    data: [],
                    yAxisID: 'yKelembapan',
                    borderColor: '#6366F1',
                    backgroundColor: '#6366F122',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#6366F1',
                    pointHitRadius: 12,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: c.muted,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        font: { family: 'IBM Plex Sans', size: 13 }
                    }
                },
                tooltip: {
                    backgroundColor: c.surface,
                    titleColor: c.text,
                    bodyColor: c.muted,
                    borderColor: c.border,
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        label: (item) => {
                            const unit = item.dataset.yAxisID === 'ySuhu' ? '°C' : '%';
                            return `${item.dataset.label}: ${item.formattedValue}${unit}`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: null,
                    },
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        drag: { enabled: false },
                        mode: 'x',
                    },
                    limits: {
                        x: { minRange: 5 }
                    }
                },
                annotation: {
                    annotations: {
                        thresholdLine: {
                            type: 'line',
                            yScaleID: 'ySuhu',
                            yMin: 29,
                            yMax: 29,
                            borderColor: c.danger,
                            borderWidth: 1,
                            borderDash: [6, 4],
                            label: {
                                display: true,
                                content: 'Batas 29°C',
                                position: 'end',
                                backgroundColor: c.danger,
                                color: '#fff',
                                font: { size: 10, weight: '600' },
                                padding: 4
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: c.muted, maxRotation: 0, autoSkip: true },
                    grid: { color: c.border, display: false }
                },
                ySuhu: {
                    position: 'left',
                    ticks: { color: c.muted, callback: (v) => v + '°C' },
                    grid: { color: c.border },
                    title: { display: true, text: 'Suhu', color: c.muted }
                },
                yKelembapan: {
                    position: 'right',
                    ticks: { color: c.muted, callback: (v) => v + '%' },
                    grid: { display: false },
                    title: { display: true, text: 'Kelembapan', color: c.muted }
                }
            }
        }
    });
}

function updateChartThemeColors(theme) {
    if (!chart) return;
    const c = themeColors();
    chart.options.plugins.legend.labels.color = c.muted;
    chart.options.plugins.tooltip.backgroundColor = c.surface;
    chart.options.plugins.tooltip.titleColor = c.text;
    chart.options.plugins.tooltip.bodyColor = c.muted;
    chart.options.plugins.tooltip.borderColor = c.border;
    chart.options.plugins.annotation.annotations.thresholdLine.borderColor = c.danger;
    chart.options.plugins.annotation.annotations.thresholdLine.label.backgroundColor = c.danger;
    chart.options.scales.x.ticks.color = c.muted;
    chart.options.scales.x.grid.color = c.border;
    chart.options.scales.ySuhu.ticks.color = c.muted;
    chart.options.scales.ySuhu.grid.color = c.border;
    chart.options.scales.ySuhu.title.color = c.muted;
    chart.options.scales.yKelembapan.ticks.color = c.muted;
    chart.options.scales.yKelembapan.title.color = c.muted;
    chart.data.datasets[0].borderColor = c.accent;
    chart.data.datasets[0].backgroundColor = c.accent + '22';
    chart.data.datasets[0].pointHoverBackgroundColor = c.accent;
    chart.update('none');
}

function resetChartZoom() {
    if (chart && chart.resetZoom) chart.resetZoom();
}

/* ================= DATA POLLING ================= */

async function loadData() {
    try {
        const response = await fetch('/api/data');
        const resData = await response.json();

        const data = resData.sensor_data;
        const waStatus = resData.wa_status;

        const waBadge = document.getElementById('wa-badge');
        const waTime = document.getElementById('wa-time');
        if (waBadge && waStatus) {
            waBadge.innerText = waStatus.status;
            if (waStatus.status === 'Berhasil Terkirim') {
                waBadge.className = 'badge bg-success-flat mb-1 text-white';
            } else if (waStatus.status === 'Gagal Terkirim') {
                waBadge.className = 'badge bg-danger-flat mb-1 text-white';
            } else {
                waBadge.className = 'badge bg-neutral-flat mb-1';
            }
            waTime.innerText = 'Terakhir: ' + waStatus.timestamp;
        }

        if (data && data.length > 0) {
            const lastData = data[data.length - 1];
            document.getElementById('val-suhu').innerText = lastData.suhu + ' °C';
            document.getElementById('val-kelembapan').innerText = lastData.kelembapan + ' %';

            const statusElem = document.getElementById('val-status');
            if (lastData.suhu < 26.0) {
                statusElem.innerText = "SEJUK";
                statusElem.className = "fw-bold text-success-flat brand-font";
            } else if (lastData.suhu <= 29.0) {
                statusElem.innerText = "HANGAT";
                statusElem.className = "fw-bold text-warning-flat brand-font";
            } else {
                statusElem.innerText = "PANAS / GERAH";
                statusElem.className = "fw-bold text-danger-flat brand-font";
            }

            if (chart) {
                const limitedData = data.slice(-40);
                chart.data.labels = limitedData.map(item => item.timestamp.split(' ')[1]);
                chart.data.datasets[0].data = limitedData.map(item => item.suhu);
                chart.data.datasets[1].data = limitedData.map(item => item.kelembapan);
                chart.update();
            }
        }
    } catch (err) {
        console.error("Gagal mengambil data dari API:", err);
    }
}

async function handleFaqSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-faq');
    const alertDiv = document.getElementById('faq-alert');

    btn.disabled = true;
    btn.innerText = "Sending...";

    const payload = {
        nama: document.getElementById('faq-nama').value,
        email: document.getElementById('faq-email').value,
        pertanyaan: document.getElementById('faq-pesan').value
    };

    try {
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success) {
            alertDiv.innerHTML = `<div class="alert bg-success-flat text-white border-0">${result.message}</div>`;
            document.getElementById('faq-form').reset();
        } else {
            alertDiv.innerHTML = `<div class="alert bg-danger-flat text-white border-0">Gagal: ${result.message}</div>`;
        }
    } catch (err) {
        alertDiv.innerHTML = `<div class="alert bg-danger-flat text-white border-0">Terjadi kesalahan koneksi!</div>`;
    } finally {
        btn.disabled = false;
        btn.innerText = "Kirim ke Gmail Admin";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initChart();
    updateClock();
    loadData();
    setInterval(updateClock, 1000);
    setInterval(loadData, 3000);

    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('reset-zoom-btn')?.addEventListener('click', resetChartZoom);
});