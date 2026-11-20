import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function hideAppLoader() {
    const loader = document.getElementById('app-loader');
    if (!loader) return;

    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            loader.classList.add('is-hidden');
            loader.addEventListener('transitionend', () => loader.remove(), { once: true });
        }),
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
        hideAppLoader();
    },
    progress: {
        color: '#4B5563',
    },
});
