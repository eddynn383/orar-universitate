"use client";
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { cn } from '@/lib/utils';

type CounterProps = {
    id?: string | undefined;
    className?: string | undefined;
    name?: string;
    value: number; // Changed from startCount to value (controlled)
    onChange?: (value: number) => void;
};

const Counter = ({ id, className, name, value, onChange }: CounterProps) => {
    const increment = () => {
        onChange?.(value + 1);
    };

    const decrement = () => {
        onChange?.(value - 1);
    };

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value) || 0;
        onChange?.(newValue);
    };

    return (
        <div className={cn("w-full flex items-center gap-2 border border-primary-300 rounded-lg p-1", className)}>
            <Button
                type="button"
                onClick={decrement}
                variant="ghost"
                size="icon-m"
            >
                <Minus className="w-4 h-4" />
            </Button>
            <Input
                id={id}
                type="number"
                sizes="M"
                value={value}
                name={name}
                onChange={handleCountChange}
                className="w-full text-center border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
                type="button"
                onClick={increment}
                variant="ghost"
                size="icon-m"
            >
                <Plus className="w-4 h-4" />
            </Button>
        </div>
    );
}

export { Counter }