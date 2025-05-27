const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar-wrapper');
const toggleIcon = document.getElementById('toggleIcon');
const sidebarLogo = document.getElementById('sidebarLogoFull');
const sidebarIcon = document.getElementById('sidebarLogoIcon');

const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

function enableTooltips(enable) {
    const links = document.querySelectorAll('#sidebar-wrapper .list-group-item-sidebar');
    links.forEach(link => {
        if (enable) {
            new bootstrap.Tooltip(link, {
                placement: 'right'
            });
        } else {
            const tooltip = bootstrap.Tooltip.getInstance(link);
            if (tooltip) tooltip.dispose();
        }
    });
}

function updateSidebarState(collapsed) {
    if (collapsed) {
        sidebar.classList.add('collapsed');
        toggleIcon.classList.replace('gicon-chevron_left', 'gicon-chevron_right');
        sidebarLogo.classList.add('d-none');
        sidebarIcon.classList.remove('d-none');
        enableTooltips(true);
    } else {
        sidebar.classList.remove('collapsed');
        toggleIcon.classList.replace('gicon-chevron_right', 'gicon-chevron_left');
        sidebarLogo.classList.remove('d-none');
        sidebarIcon.classList.add('d-none');
        enableTooltips(false);
    }
    localStorage.setItem('sidebarCollapsed', collapsed);
}

updateSidebarState(isCollapsed);

toggleBtn.addEventListener('click', () => {
    const collapsed = !sidebar.classList.contains('collapsed');
    updateSidebarState(collapsed);
});