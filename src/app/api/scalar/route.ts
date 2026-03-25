import { ApiReference } from '@scalar/nextjs-api-reference';

const config = {
    spec: {
        url: '/api/docs-spec',
    },
};

// @ts-ignore
export const GET = ApiReference(config);
