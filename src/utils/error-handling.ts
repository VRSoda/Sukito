// 에러 핸들링 및 로깅 유틸리티

// API 에러 분류
export function classifyApiError(error: any): {
    type: "auth" | "forbidden" | "notfound" | "network" | "unknown";
    status?: number;
    message: string;
} {
    if (!error.response) {
        return { type: "network", message: "Network error occurred" };
    }

    const status = error.response.status;
    if (status === 401) {
        return { type: "auth", status, message: "Unauthorized - Invalid credentials" };
    }
    if (status === 403) {
        return { type: "forbidden", status, message: "Forbidden - Access denied" };
    }
    if (status === 404) {
        return { type: "notfound", status, message: "Not found" };
    }

    return { type: "unknown", status, message: error.message || "Unknown error" };
}

// 자세한 에러 로깅
export function logDetailedError(context: string, error: any): void {
    console.group(`❌ ${context}`);
    console.error("Error:", error);
    if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
    }
    console.groupEnd();
}

// 사용자 친화적인 에러 메시지 생성
export function getUserFriendlyMessage(error: any): string {
    const classified = classifyApiError(error);
    const messages: Record<string, string> = {
        auth: "인증이 필요합니다",
        forbidden: "접근 권한이 없습니다",
        notfound: "요청한 리소스를 찾을 수 없습니다",
        network: "네트워크 연결을 확인하세요",
        unknown: "오류가 발생했습니다",
    };
    return messages[classified.type] || "알 수 없는 오류가 발생했습니다";
}
