'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DinnerForm } from '@/components/dinners/DinnerForm';
import { DinnerCard } from '@/components/dinners/DinnerCard';
import { Utensils, Plus, Search, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MiddagerPage() {
    const { data: dinners, error, mutate } = useSWR('/api/dinners', fetcher);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const handleCreate = async (formData: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/dinners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                mutate();
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to create dinner', err);
        } finally {
            setLoading(false);
        }
    };

    const isLoading = !dinners && !error;

    const filteredDinners = dinners?.filter((d: any) =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <PageHeader title="Middager">
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-1" /> Ny
                </Button>
            </PageHeader>

            <div className="p-6 pb-20 space-y-4">
                {/* Search Field */}
                {dinners && dinners.length > 0 && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Søk i middager..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground w-11 h-11 flex items-center justify-center p-2"
                                aria-label="Tøm søk"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredDinners?.length > 0 ? (
                    <div className="grid gap-3">
                        {filteredDinners.map((dinner: any) => (
                            <DinnerCard
                                key={dinner.id}
                                id={dinner.id}
                                name={dinner.name}
                                icon={dinner.icon}
                                ingredientsCount={dinner.ingredients?.length ?? 0}
                            />
                        ))}
                    </div>
                ) : dinners?.length > 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Ingen middager matcher søket.
                    </div>
                ) : (
                    <EmptyState
                        icon={Utensils}
                        title="Ingen middager lagret"
                        description="Legg til dine favorittmiddager for å gjøre planleggingen raskere."
                        actionLabel="Legg til middag"
                        onAction={() => setIsModalOpen(true)}
                    />
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Ny middag"
                fullScreen
            >
                <DinnerForm onSubmit={handleCreate} loading={loading} />
            </Modal>
        </>
    );
}
