import { redirect } from 'next/navigation';

type ParamsProps = Promise<{
    yearId: string;
    learningType: string;
}>

export default async function YearPage({ params }: { params: ParamsProps }) {
    const { yearId, learningType } = await params
    const firstYear = 1
    const firstSemester = 1; // or use fetched data

    redirect(`/orar/${yearId}/${learningType}/an/${firstYear}/semestru/${firstSemester}`);
}