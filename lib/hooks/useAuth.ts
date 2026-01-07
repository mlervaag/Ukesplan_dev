import useSWR from 'swr';

export function useAuth() {
    const { data, error, mutate } = useSWR('/api/auth/status', async (url) => {
        // This is just a placeholder, the real validation is in middleware
        return { ok: true };
    });

    return {
        isLoading: !data && !error,
        isError: error,
        mutate,
    };
}
