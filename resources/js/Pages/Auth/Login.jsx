import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/GuestLayout';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout title="Welcome back" description="Sign in to open your teaching workspace.">
            <Head title="Log in" />

            <form onSubmit={submit} className="space-y-4" noValidate>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email" type="email" autoComplete="username" autoFocus
                        value={data.email} onChange={(e) => setData('email', e.target.value)}
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password" type="password" autoComplete="current-password"
                        value={data.password} onChange={(e) => setData('password', e.target.value)}
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={data.remember} onCheckedChange={(v) => setData('remember', !!v)} />
                    <Label htmlFor="remember" className="font-normal text-muted-foreground">Keep me signed in</Label>
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
                    Log in
                </Button>
            </form>
        </GuestLayout>
    );
}