'use client';

import { useState } from 'react';
import { Control, Controller, FieldError } from 'react-hook-form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import countryList from 'react-select-country-list';

type CountrySelectProps = {
    name: 'country';
    label: string;
    control: Control<SignUpFormData>;
    error?: FieldError;
    placeholder?: string;
    required?: boolean;
};

const getCountryFlag = (code: string) =>
    String.fromCodePoint(
        ...code
            .toUpperCase()
            .split('')
            .map((letter) => 127397 + letter.charCodeAt(0))
    );

const countries: { label: string; value: string }[] =
    countryList().getData();

const CountrySelectField = ({
    name,
    label,
    control,
    error,
    placeholder = 'Select a country',
    required = false,
}: CountrySelectProps) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">
                {label}
            </Label>

            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `${label} is required` : false,
                }}
                render={({ field }) => (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                id={name}
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                aria-invalid={!!error}
                                className="w-full justify-between"
                                ref={field.ref}
                                onBlur={field.onBlur}
                            >
                                <span className="flex items-center gap-2">
                                    {field.value && (
                                        <span
                                            aria-hidden="true"
                                            className={`fi fi-${(
                                                countries.find((country) => country.label === field.value)
                                                    ?.value ?? ''
                                            ).toLowerCase()}`}
                                        />
                                    )}
                                    <span>{field.value || placeholder}</span>
                                </span>

                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] border-neutral-700 bg-neutral-950 p-0 text-neutral-100">
                            <Command className="bg-neutral-950 text-neutral-100">
                                <CommandInput placeholder="Search country..." />

                                <CommandList>
                                    <CommandEmpty>
                                        No country found.
                                    </CommandEmpty>

                                    <CommandGroup>
                                        {countries.map((country) => (
                                            <CommandItem
                                                key={country.value}
                                                value={country.label}
                                                className="cursor-pointer text-neutral-200 data-[selected=true]:bg-yellow-400/15 data-[selected=true]:text-yellow-400"
                                                onSelect={() => {
                                                    field.onChange(
                                                        country.label
                                                    );
                                                    setOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        field.value ===
                                                            country.label
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    )}
                                                />

                                                <span aria-hidden="true" className={`fi fi-${country.value.toLowerCase()} mr-2`}/>
                                                {country.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            />

            {error && (
                <p className="text-sm text-red-500">{error.message}</p>
            )}
        </div>
    );
};

export default CountrySelectField;