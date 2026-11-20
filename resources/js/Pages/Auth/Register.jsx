import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/GuestLayout';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout title="Create your account" description="Set up your teaching workspace in a minute.">
            <Head title="Register" />

            <form onSubmit={submit} className="space-y-4" noValidate>
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name" type="text" autoComplete="name" autoFocus
                        value={data.name} onChange={(e) => setData('name', e.target.value)}
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email" type="email" autoComplete="username"
                        value={data.email} onChange={(e) => setData('email', e.target.value)}
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password" type="password" autoComplete="new-password"
                        value={data.password} onChange={(e) => setData('password', e.target.value)}
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm password</Label>
                    <Input
                        id="password_confirmation" type="password" autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        aria-invalid={!!errors.password_confirmation}
                    />
                    {errors.password_confirmation && (
                        <p className="text-sm text-destructive">{errors.password_confirmation}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
                    Create account
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Already registered?{' '}
                    <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                        Log in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}