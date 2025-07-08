function populateSidebar(activePage = '') {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const mainPageContent = document.getElementById('mainPageContent');

    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebarWrapper.classList.add('collapsed');
    } else {
        sidebarWrapper.classList.remove('collapsed');
    }

    sidebarWrapper.style.transition = 'none';
    mainPageContent.style.transition = 'none';
    if (isCollapsed) {
        sidebarWrapper.classList.add('collapsed');
    } else {
        sidebarWrapper.classList.remove('collapsed');
    }
    sidebarWrapper.offsetHeight;
    sidebarWrapper.style.transition = '';
    mainPageContent.offsetHeight;
    mainPageContent.style.transition = '';

    const links = [
        { href: '/dashboard', icon: 'gicon-home', text: 'Dashboard', key: 'dashboard' },
        { href: '/companydetails', icon: 'gicon-business', text: 'Company Details', key: 'companydetails' },
        { href: '/productlisting', icon: 'gicon-shopping_bag', text: 'Product Listing', key: 'productlisting' },
        { href: '/billing', icon: 'gicon-receipt_long', text: 'Billing', key: 'billing' },
        { href: '/billlogs', icon: 'gicon-auto_stories', text: 'Bill Logs', key: 'billlogs' },
        { href: '/analytics', icon: 'gicon-insights', text: 'Analytics', key: 'analytics' },
        { href: '/customers', icon: 'gicon-group', text: 'Customers', key: 'customers' },
        { href: '/transactions', icon: 'gicon-account_balance_wallet', text: 'Transactions', key: 'transactions' },
    ];

    const sidebarItems = links.map(link => {
        if (link.key === activePage) {
            return createSidebarLabel(link.icon, link.text);
        } else {
            return createSidebarLink(link.href, link.icon, link.text);
        }
    }).join('');

    const sidebarHTML = `
        <div class="sidebar-heading p-3 d-flex justify-content-between align-items-center">
            <img id="sidebarLogoFull" src="images/inventuraxLogoWhite.png" alt="Full Logo" class="img-fluid">
            <img id="sidebarLogoIcon" src="images/inventuraxIconWhite.png" alt="Icon Logo" class="img-fluid d-none">
        </div>
        <div class="sidebar-content">
            <div class="list-group list-group-flush flex-grow-1">
                ${sidebarItems}
            </div>
        </div>
        <div class="text-center p-3 sidebar-toggle-wrapper">
            <button class="btn btn-outline-light w-100" id="toggleSidebar">
                <i class="gsymbols-round gicon-chevron_left" id="toggleIcon"></i>
            </button>
        </div>
    `;

    document.getElementById('sidebar-wrapper').innerHTML = sidebarHTML;
    reinitializeSidebarFunctions();
}

function createSidebarLink(href, iconClass, text) {
    return `
        <a href="${href}" class="list-group-item list-group-item-sidebar" title="${text}">
            <i class="gsymbols-round ${iconClass} fs-5"></i><span class="link-text">${text}</span>
        </a>
    `;
}

function createSidebarLabel(iconClass, text) {
    return `
        <div class="list-group-item list-group-item-sidebar active disabled" title="${text}" style="pointer-events: none;">
            <i class="gsymbols-round ${iconClass} fs-5"></i><span class="link-text">${text}</span>
        </div>
    `;
}

function reinitializeSidebarFunctions() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const toggleIcon = document.getElementById('toggleIcon');
    const sidebarLogo = document.getElementById('sidebarLogoFull');
    const sidebarIcon = document.getElementById('sidebarLogoIcon');
    const sidebar = document.getElementById('sidebar-wrapper');

    function enableTooltips(enable) {
        const links = document.querySelectorAll('#sidebar-wrapper .list-group-item-sidebar');
        links.forEach(link => {
            if (enable) {
                new bootstrap.Tooltip(link, { placement: 'right' });
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

    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    updateSidebarState(isCollapsed);

    toggleBtn.addEventListener('click', () => {
        const collapsed = !sidebar.classList.contains('collapsed');
        updateSidebarState(collapsed);
    });
}