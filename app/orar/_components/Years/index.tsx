"use client";
import { useState } from 'react';
import { Input } from '@/components/Input';
import { Counter } from '@/components/Counter';
import { Field, FieldGroup, FieldLabel } from '@/components/Field';

type CounterProps = {
    name?: string;
    startCount?: number;
    showNextValue?: boolean;
};

const Years = ({ startCount = 2025 }: CounterProps) => {
    const [startYear, setStartYear] = useState(startCount);
    const [endYear, setEndYear] = useState(startCount + 1);

    const handleStartYearChange = (value: number) => {
        setStartYear(value);
        setEndYear(value + 1); // Always keep end year 1 year ahead
    };

    const handleEndYearChange = (value: number) => {
        setEndYear(value);
        setStartYear(value - 1); // Always keep start year 1 year behind
    };

    return (
        <div className="flex items-center gap-4">
            <FieldGroup className='flex-row gap-4'>
                <Field className="w-1/2">
                    <FieldLabel htmlFor="start-year">
                        Anul inceperii
                    </FieldLabel>
                    <Counter
                        id="start-year"
                        name="start"
                        value={startYear}
                        onChange={handleStartYearChange}
                    />
                </Field>
                <div className="flex items-end py-3">
                    -
                </div>
                <Field className="w-1/2">
                    <FieldLabel htmlFor="end-year">
                        Anul incheierii
                    </FieldLabel>
                    <Counter
                        id="end-year"
                        name="end"
                        value={endYear}
                        onChange={handleEndYearChange}
                    />
                </Field>
            </FieldGroup>
        </div>
    );
}

export { Years }