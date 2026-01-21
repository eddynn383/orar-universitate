import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function HomePage() {
    const session = await auth();

    // Redirect bazat pe rol
    if (session?.user) {
        const role = session.user.role;

        if (role === 'PROFESOR' || role === 'STUDENT') {
            redirect('/dashboard');
        } else if (role === 'ADMIN' || role === 'SECRETAR') {
            redirect('/utilizatori');
        }
    }

    // Default pentru utilizatori neautentificați sau cu rol USER
    redirect('/orar');
}