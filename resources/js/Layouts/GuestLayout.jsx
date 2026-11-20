import { GraduationCap } from 'lucide-react';
import { Toaster } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Props: title, description (optional), children */
export default function GuestLayout({ title, description, children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <GraduationCap className="size-6" aria-hidden />
                </div>
                <span className="text-lg font-semibold">Personal Teacher Assistant</span>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-xl">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>

            <Toaster richColors position="top-right" />
        </div>
    );
}