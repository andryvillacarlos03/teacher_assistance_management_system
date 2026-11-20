<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead

     <style>
        #app-loader {
            position: fixed; inset: 0; z-index: 9999;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 18px;
            background: #17324D; color: #fff;
            font-family: Inter, system-ui, sans-serif;
            transition: opacity .3s ease;
        }
        #app-loader.is-hidden { opacity: 0; pointer-events: none; }
        #app-loader .spinner {
            width: 36px; height: 36px; border-radius: 50%;
            border: 4px solid rgba(255,255,255,.2);
            border-top-color: #247A73;
            animation: app-spin 1s linear infinite;
        }
        @keyframes app-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
            #app-loader .spinner { animation-duration: 3s; }
        }
    </style>
    </head>
        <body class="font-sans antialiased">
            <div id="app-loader" role="status" aria-live="polite">
            <h1 style="margin:0;font-size:20px;font-weight:600;">Personal Teacher Assistant</h1>
            <div class="spinner"></div>
            <span style="font-size:14px;opacity:.75;">Loading your workspace…</span>
        </div>
        @inertia

        <script>
        (function () {
            const loader = document.getElementById('app-loader');
            const app = document.getElementById('app');
            if (!loader || !app) return;

            function hide() {
                if (!loader.isConnected) return;
                observer.disconnect();
                loader.classList.add('is-hidden');
                setTimeout(() => loader.remove(), 1000);
            }

            const observer = new MutationObserver(() => {
                if (app.childElementCount > 0) hide();
            });
            observer.observe(app, { childList: true });
            if (app.childElementCount > 0) hide();
            setTimeout(hide, 10000);
        })();
    </script>
    </body>
</html>
