// 1) SIMPLE TYPES
export type ResponseType = "auto" | "json" | "blob" | "text" | "arrayBuffer";

export type ApiTemplateArguments = {
    baseUrl: string;
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    payload?: Record<string, any>;
    isAuthenticationRequired?: boolean;
    token?: string | null;
    isFormData?: boolean;
    responseType?: ResponseType | null;
};

// 2) CONTENT-TYPE RULES (you can maintain this list)
const CONTENT_TYPE_PATTERNS = {
    json: [
        "application/json",
        "+json"
    ],
    blob: [
        "application/pdf",
        "application/octet-stream",
        "application/zip",
        "application/vnd",
        "image/"
    ],
    text: ["text/", "application/xml", "text/xml"],
};

// HELPERS
// ✅ Common Error Message Extractor 
function getErrorMessage(errorData: any, fallbackMessage: string) {
    if (!errorData) return fallbackMessage;
    if (typeof errorData === "string") return errorData;
    if (typeof errorData === "object") {
        return (
            errorData.message ||
            errorData.error ||
            errorData.detail ||
            errorData.msg ||
            errorData.title ||
            fallbackMessage
        );
    }
    return fallbackMessage;
}

// ✅ Common Error Creator (already present)
function makeApiError(message: string, status: number, data: any) {
    const err: any = new Error(message);
    err.name = "ApiError";
    err.status = status;
    err.data = data;
    return err;
}


// -------------------------
// A) PREPARE REQUEST (headers + body)
// -------------------------
function prepareRequest(args: ApiTemplateArguments) {
    const {
        method,
        payload,
        isAuthenticationRequired,
        token,
        isFormData,
    } = args;

    // Headers
    const headers: Record<string, string> = {};

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    if (isAuthenticationRequired) {
        if (!token) throw new Error("Token is required but not available");
        headers["Authorization"] = `Bearer ${token}`;
    }

    type CrossBody = string | FormData | undefined;
    let body: CrossBody = undefined;

    if (method !== "GET") {
        if (isFormData) {
            const formData = new FormData();

            Object.entries(payload ?? {}).forEach(([key, value]) => {
                if (value === undefined || value === null) return;

                const appendValue = (v: any) => {
                    if (v === undefined || v === null) return;

                    const isBrowserFile = typeof File !== "undefined" && v instanceof File;
                    const isBrowserBlob = typeof Blob !== "undefined" && v instanceof Blob;
                    const isReactNativeFile = v && typeof v === "object" && typeof v.uri === "string";

                    if (isBrowserFile || isBrowserBlob || isReactNativeFile) {
                        formData.append(key, v);
                        return;
                    }

                    if (typeof v === "object") {
                        formData.append(key, JSON.stringify(v));
                        return;
                    }

                    formData.append(key, String(v));
                };

                if (Array.isArray(value)) value.forEach(appendValue);
                else appendValue(value);
            });

            body = formData;
        } else {
            body = JSON.stringify(payload);
        }
    }

    return { headers, body };
}

// -------------------------
// B) AUTO RESPONSE TYPE DETECTION
// -------------------------
function detectResponseType(response: Response): Exclude<ResponseType, "auto"> {
    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    const matchesAny = (patterns: string[]) => {
        for (const pattern of patterns) {
            const isMatch = pattern.endsWith("/")
                ? contentType.startsWith(pattern)
                : contentType.includes(pattern);
            if (isMatch) return true;
        }
        return false;
    };

    if (matchesAny(CONTENT_TYPE_PATTERNS.json)) return "json";
    if (matchesAny(CONTENT_TYPE_PATTERNS.blob)) return "blob";
    if (matchesAny(CONTENT_TYPE_PATTERNS.text)) return "text";

    // fallback (keep as you had)
    return "text";
}

// -------------------------
// C) PARSE SUCCESS RESPONSE (single switch)
// -------------------------
async function parseResponse(response: Response, finalType: Exclude<ResponseType, "auto">) {

    // organization-level failure check (only for JSON)
    const throwIfOperationFailed = (data: any) => {
        if (data?.type === "FALSE") {
            const message = getErrorMessage(data, "Operation failed");
            throw makeApiError(message, 400, data);
        }
    };

    const getFilenameFromResponse = () => {
        const cd = response.headers.get("content-disposition");
        if (!cd) return null;
        const match = /filename="([^"]+)"/i.exec(cd);
        return match?.[1] ?? null;
    };

    switch (finalType) {
        case "json": {
            const data = await response.json();
            throwIfOperationFailed(data);
            return data;
        }

        case "blob": {
            const fileName = getFilenameFromResponse();

            const anyRes: any = response;

            if (typeof anyRes.blob === "function") {
                const blob = await anyRes.blob();
                blob.filename = fileName;
                return blob;
            }

            if (typeof anyRes.arrayBuffer === "function") {
                return anyRes.arrayBuffer();
            }

            return response.text();
        }

        case "arrayBuffer": {
            const anyRes: any = response;
            if (typeof anyRes.arrayBuffer === "function") return anyRes.arrayBuffer();
            return response.text();
        }

        case "text":
        default:
            return response.text();
    }
}


// -------------------------
// D) MAIN TEMPLATE
// -------------------------
export async function apiTemplate(args: ApiTemplateArguments) {
    const {
        baseUrl,
        endpoint,
        method = "GET",
        responseType = "auto",
    } = args;

    if (!baseUrl) throw new Error("Base URL not found");

    const fullUrl = `${baseUrl}${endpoint}`;

    const normalizedArgs: ApiTemplateArguments = {
        ...args,
        method,
        payload: args.payload ?? {},
        isAuthenticationRequired: args.isAuthenticationRequired ?? false,
        token: args.token ?? null,
        isFormData: args.isFormData ?? false,
    };

    const { headers, body } = prepareRequest(normalizedArgs);

    const response = await fetch(fullUrl, { method, headers, body });

    if (!response.ok) {
        let errorData: any = null;
        const ct = (response.headers.get("content-type") || "").toLowerCase();

        try {
            if (ct.includes("application/json") || ct.includes("+json")) {
                errorData = await response.json();
            }
            else {
                errorData = await response.text();
            }
        } catch {
            errorData = null;
        }

        const message = getErrorMessage(errorData, `API error (${response.status})`);
        throw makeApiError(message, response.status, errorData);
    }

    let finalType: Exclude<ResponseType, "auto">;

    if (responseType && responseType !== "auto") {
        finalType = responseType;
    } else {
        finalType = detectResponseType(response);
    }

    return parseResponse(response, finalType);
}
