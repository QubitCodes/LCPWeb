import { headers, cookies } from 'next/headers';
import { cache } from 'react';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

/**
 * QubitRequest: A unified request handling utility for Next.js.
 * Provides global-style access to inputs, files, and metadata.
 */

// --- Types & Interfaces ---

export interface AuthData {
    /** The authentication strategy used (e.g., 'bearer', 'session') */
    type: 'session' | 'bearer' | 'basic' | 'oauth2' | string;
    /** The raw token or session identifier */
    token: string;
}

export interface UrlInfo {
    /** The full request URL */
    full: string;
    /** The path/endpoint without domain or query */
    endpoint: string;
    /** The domain/hostname */
    domain: string;
    /** Boolean indicating if connection is HTTPS */
    secure: boolean;
    /** The protocol and host (e.g., https://example.com) */
    base: string;
    /** The raw search/query string */
    search: string;
}

export interface RequestMatcher {
    /** Check if the current path matches a wildcard pattern (e.g., '/admin/*') */
    (pattern: string): boolean;
    /** Check if the current path matches a regular expression */
    regex: (pattern: string | RegExp) => boolean;
}

export interface QubitRequest {
    /** Authentication metadata if present, otherwise false */
    readonly auth: AuthData | false;
    /** Extensive information about the current URL */
    readonly url: UrlInfo;
    /** Dynamic route parameters (e.g., from [id] folders) */
    readonly params: Record<string, any>;
    /** Parsed query string parameters */
    readonly query: Record<string, string>;
    /** The raw query string */
    readonly search: string;
    /** HTTP Method used for the request */
    readonly method: string;
    /** Client IP address */
    readonly ip: string;
    /** Detection for mobile devices based on User-Agent */
    readonly isMobile: boolean;

    /** Path matching utility */
    matches: RequestMatcher;

    /** Get all data from body and query string combined */
    all: () => Record<string, any>;
    /** Get a specific input value with an optional default */
    input: <T = any>(key: string, defaultValue?: T) => T;
    /** Cast input value to a boolean */
    boolean: (key: string) => boolean;
    /** Cast input value to a number or null if invalid */
    number: (key: string) => number | null;
    /** Check if a key exists in the request data */
    has: (key: string) => boolean;
    /** Check if a key exists and is not an empty string or null */
    filled: (key: string) => boolean;

    /** Retrieve an uploaded file */
    file: (key: string) => UploadedFile | null;
    /** Retrieve an array of uploaded files (for multi-upload) */
    files: (key: string) => UploadedFile[];

    /** Retrieve a specific request header */
    header: (key: string) => string | null;
    /** Retrieve a specific cookie value */
    cookie: (key: string) => string | undefined;

    /** Check if the client prefers a JSON response */
    wantsJson: () => boolean;
    /** Check if the request was made via AJAX/Fetch */
    isAjax: () => boolean;
}

// --- File Handling Class ---

export class UploadedFile {
    constructor(private _file: File) { }

    /** Original filename provided by the client */
    get clientName(): string { return this._file.name; }
    /** Size of the file in bytes */
    get size(): number { return this._file.size; }
    /** Mime-type of the file */
    get type(): string { return this._file.type; }
    /** The underlying Web File object */
    get raw(): File { return this._file; }

    /**
     * Saves the file to the local filesystem.
     * Note: Cloud storage support (S3/Cloudinary) is coming soon.
     */
    async save(destination: string, newName?: string): Promise<{ path: string; name: string }> {
        const fileName = newName || this._file.name;
        const targetFolder = path.join(process.cwd(), destination);
        const targetPath = path.join(targetFolder, fileName);

        await fs.mkdir(targetFolder, { recursive: true });
        const buffer = Buffer.from(await this._file.arrayBuffer());
        await fs.writeFile(targetPath, buffer);

        return { path: targetPath, name: fileName };
    }
}

// --- Internal Store ---

const getContext = cache(() => ({
    _data: {} as Record<string, any>,
    _params: {} as Record<string, any>,
}));

/** @internal Seeds the context with request data */
export const setRequestData = (data: any) => { getContext()._data = data; };
/** @internal Seeds the context with route params */
export const setParams = (p: any) => { getContext()._params = p; };

// --- The Main request() function ---

/**
 * Returns a QubitRequest instance for the current execution context.
 * Must be awaited in Server Components and Actions.
 */
export const request = async (): Promise<QubitRequest> => {
    const ctx = getContext();
    const h = await headers();
    const c = await cookies();

    const rawUrl = h.get('x-url') || 'http://localhost';
    const url = new URL(rawUrl);
    const userAgent = h.get('user-agent') || '';

    const getRawInput = (key: string) => ctx._data[key] ?? url.searchParams.get(key);

    const authType = h.get('x-auth-type');
    const authToken = h.get('x-auth-token');

    return {
        get auth() {
            return authType && authToken ? { type: authType, token: authToken } : false;
        },

        get url() {
            return {
                full: rawUrl,
                endpoint: url.pathname,
                domain: url.hostname,
                secure: url.protocol === 'https:',
                base: `${url.protocol}//${url.host}`,
                search: url.search,
            };
        },

        get params() { return ctx._params; },
        get query() { return Object.fromEntries(url.searchParams); },
        get search() { return url.search; },
        get method() { return h.get('x-method') || 'GET'; },
        get ip() { return h.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'; },
        get isMobile() { return /mobile/i.test(userAgent); },

        matches: (() => {
            const fn = (pattern: string) => {
                const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
                return new RegExp(`^${escaped}$`).test(url.pathname);
            };
            fn.regex = (pattern: string | RegExp) => {
                const re = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
                return re.test(url.pathname);
            };
            return fn as RequestMatcher;
        })(),

        all: () => ({ ...Object.fromEntries(url.searchParams), ...ctx._data }),

        input: (key, def = undefined) => getRawInput(key) ?? def,

        has: (key) => getRawInput(key) !== undefined,

        filled: (key) => {
            const val = getRawInput(key);
            return val !== undefined && val !== null && val !== '';
        },

        boolean: (key) => {
            const val = getRawInput(key);
            return val === 'true' || val === '1' || val === true || val === 1 || val === 'on';
        },

        number: (key) => {
            const val = parseFloat(getRawInput(key));
            return isNaN(val) ? null : val;
        },

        file: (k) => {
            const v = ctx._data[k];
            const f = Array.isArray(v) ? v[0] : v;
            return f && 'arrayBuffer' in f ? new UploadedFile(f) : null;
        },

        files: (k) => {
            const v = ctx._data[k];
            if (!v) return [];
            return (Array.isArray(v) ? v : [v]).filter(f => 'arrayBuffer' in f).map(f => new UploadedFile(f));
        },

        header: (key) => h.get(key),
        cookie: (key) => c.get(key)?.value,

        wantsJson: () => h.get('accept')?.includes('application/json') ?? false,
        isAjax: () => h.get('x-requested-with') === 'XMLHttpRequest' || h.get('accept')?.includes('application/json') === true,
    };
};

// --- Execution Wrappers ---

/**
 * Higher-order function to wrap Server Actions for QubitRequest support.
 */
export function Action(handler: (req: QubitRequest) => Promise<any>) {
    return async (formData: FormData) => {
        const data: Record<string, any> = {};
        for (const key of Array.from(formData.keys())) {
            const values = formData.getAll(key);
            data[key] = (values.length > 1 || key.endsWith('[]')) ? values : values[0];
        }
        setRequestData(data);
        return handler(await request());
    };
}

/**
 * Higher-order function to wrap API Route Handlers for QubitRequest support.
 */
export function Api(handler: (req: QubitRequest) => Promise<NextResponse>) {
    return async (req: NextRequest, { params }: { params?: any } = {}) => {
        if (params) setParams(await params);
        let data = {};
        try {
            const contentType = req.headers.get('content-type');
            if (contentType?.includes('application/json')) data = await req.json();
        } catch { }
        setRequestData(data);
        return handler(await request());
    };
}