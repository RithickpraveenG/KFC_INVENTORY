export const isValidProjectName = (name: string): boolean => {
    // Rules:
    // 1. Not empty
    // 2. Max 30 characters
    // 3. Lowercase letters, numbers, '.', '_', and '-' only.
    // 4. No triple hyphens '---'
    const regex = /^[a-z0-9._-]+$/;
    return name.length > 0 && name.length <= 30 && regex.test(name) && !name.includes("---");
};

export const DEFAULT_PROJECT_NAME = "KOVAI INVENTORY";
