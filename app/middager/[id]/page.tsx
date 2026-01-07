'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DinnerForm } from '@/components/dinners/DinnerForm';
import { ChevronLeft, Edit2, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { formatQty } from '@/lib/utils/format';

export default function DinnerDetailPage({ params }: { params: { id: string } }) {
    const { data: dinner, error, mutate } = useSWR(`/api/dinners/${params.id}`, fetcher);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async (formData: any) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dinners/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                mutate();
                setIsEditModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to update dinner', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/dinners/${params.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                router.push('/middager');
            }
        } catch (err) {
            console.error('Failed to delete dinner', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (!dinner && !error) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (error || !dinner) return <div className="p-8 text-center text-destructive">Kunne ikke laste middag</div>;

    return (
        <>
            <PageHeader title={dinner.name}>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(true)} aria-label="Rediger">
                        <Edit2 size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setIsDeleteModalOpen(true)} aria-label="Slett">
                        <Trash2 size={20} />
                    </Button>
                </div>
            </PageHeader>

            <div className="p-6 space-y-6">
                <Link href="/middager" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft size={16} /> Tilbake til oversikt
                </Link>

                {dinner.notes && (
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notater</h2>
                        <p className="bg-accent p-4 rounded-radius">{dinner.notes}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingredienser</h2>
                    <div className="divide-y border rounded-radius overflow-hidden">
                        {dinner.ingredients.map((ing: any) => (
                            <div key={ing.id} className="flex justify-between p-3 bg-background">
                                <span>{ing.name}</span>
                                <span className="text-muted-foreground">
                                    {formatQty(ing.quantity)} {ing.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Rediger middag"
                fullScreen
            >
                <DinnerForm
                    initialData={{
                        name: dinner.name,
                        notes: dinner.notes ?? '',
                        icon: dinner.icon ?? '',
                        ingredients: dinner.ingredients.map((ing: any) => ({
                            name: ing.name,
                            quantity: ing.quantity.toString(),
                            unit: ing.unit,
                        })),
                    }}
                    onSubmit={handleUpdate}
                    loading={loading}
                />
            </Modal>
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Slett middag?"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Er du sikker på at du vil slette denne middagen? Denne handlingen kan ikke angres.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                            Avbryt
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? <Loader2 className="animate-spin" /> : 'Slette'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
