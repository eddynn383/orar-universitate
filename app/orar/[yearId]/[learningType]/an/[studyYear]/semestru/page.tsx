import { redirect } from 'next/navigation';

type ParamsProps = Promise<{ yearId: string, studyYear: string }>

export default async function SemestersPage({ params }: { params: ParamsProps }) {
    const { yearId, studyYear } = await params

    const firstSemester = 1; // or use fetched data

    redirect(`/orar/${yearId}/an/${studyYear}/semestru/${firstSemester}`);
}