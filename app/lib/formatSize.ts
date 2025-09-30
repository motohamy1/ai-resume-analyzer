export const formatSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes < 0) {
        throw new Error("formatSize expects a non-negative finite number of bytes");
    }

    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;

    const formatValue = (value: number): string => {
        if (value >= 100) return value.toFixed(0);
        if (value >= 10) return value.toFixed(1);
        return value.toFixed(2);
    };

    if (bytes >= GB) {
        return `${Number(formatValue(bytes / GB))} GB`;
    }

    if (bytes >= MB) {
        return `${Number(formatValue(bytes / MB))} MB`;
    }

    return `${Number(formatValue(bytes / KB))} KB`;
};