import Plotly from 'plotly.js-dist-min';

export function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.classList.add('hidden');
            });

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const tabId = btn.getAttribute('data-tab');
            if (tabId) {
                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                    targetContent.classList.add('active');
                    if (tabId === 'tab-graph') {
                        const canvas = document.getElementById('plotly-canvas');
                        if (canvas) {
                            Plotly.Plots.resize(canvas);
                        }
                    }
                }
            }
        });
    });
}
