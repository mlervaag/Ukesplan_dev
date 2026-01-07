'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Repeat, Loader2, Plus } from 'lucide-react';
import useSWR from 'swr';
import { useState } from 'react';
import { TemplateList } from '@/components/todos/TemplateList';
import { TemplateForm } from '@/components/todos/TemplateForm';
import { Button } from '@/components/ui/Button';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.') as any;
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }
    return res.json();
};

export default function FasteGjoremalPage() {
    const { data, mutate, isLoading, error } = useSWR('/api/todo-templates', fetcher);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

    const isUnauthorized = error?.status === 401;

    const handleEdit = (template: any) => {
        setSelectedTemplate(template);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedTemplate(null);
        setIsFormOpen(true);
    };

    if (error && !isUnauthorized) {
        return (
            <div className="p-8 text-center text-destructive">
                Kunne ikke laste faste gjøremål.
            </div>
        );
    }

    return (
        <>
            <PageHeader title="Faste gjøremål">
                <Button variant="ghost" size="icon" onClick={handleAdd}>
                    <Plus size={20} />
                </Button>
            </PageHeader>

            <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
                {isLoading && !data ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : !data || data.length === 0 ? (
                    <EmptyState
                        icon={Repeat}
                        title="Ingen faste gjøremål"
                        description="Legg til oppgaver som gjentar seg hver uke eller annenhver uke."
                    />
                ) : (
                    <TemplateList
                        templates={data}
                        onEdit={handleEdit}
                    />
                )}
            </div>

            <TemplateForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                template={selectedTemplate}
                onSaved={() => mutate()}
            />
        </>
    );
}
