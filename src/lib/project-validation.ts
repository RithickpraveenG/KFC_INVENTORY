/**
 * Validates a project name based on the following rules:
 * - Up to 100 characters long.
 * - Must be lowercase.
 * - Allowed characters: letters, digits, '.', '_', '-'.
 * - Cannot contain the sequence '---'.
 */
export function validateProjectName(name: string): { isValid: boolean; error?: string } {
    if (name.length > 100) {
        return { isValid: false, error: "Project name must be at most 100 characters long." };
    }
    if (name !== name.toLowerCase()) {
        return { isValid: false, error: "Project name must be lowercase." };
    }

    // Allowed characters: a-z, 0-9, ., _, -
    const allowedCharsRegex = /^[a-z0-9._-]+$/;
    if (!allowedCharsRegex.test(name)) {
        return { isValid: false, error: "Project name can only include lowercase letters, digits, '.', '_', and '-'." };
    }

    if (name.includes("---")) {
        return { isValid: false, error: "Project name cannot contain the sequence '---'." };
    }

    return { isValid: true };
}
