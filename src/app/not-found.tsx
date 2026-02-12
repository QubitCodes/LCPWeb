import StatusPage from '@/components/ui/StatusPage';

/**
 * Global 404 page — displayed when no route matches.
 * Uses the reusable StatusPage component.
 */
export default function NotFound() {
    return (
        <StatusPage
            code={404}
            title="Page Not Found"
            description="The page you're looking for doesn't exist or may have been moved. Check the URL or head back to the dashboard."
        />
    );
}
