import { useEffect } from 'react';

let closed = false;

export function useCloseSplash() {
    useEffect(() => {
        if (closed) return;
        closed = true;

        const attempt = (n) =>
            fetch('/native/splash/close', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            })
                .then((res) => {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                })
                .catch((err) => {
                    console.error('splash close failed:', err);
                    if (n < 3) setTimeout(() => attempt(n + 1), 500);
                    else closed = false; 
                });

        attempt(1);
    }, []);
}