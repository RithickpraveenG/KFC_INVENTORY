"use client";

import { useState, useEffect } from "react";
import { DEFAULT_PROJECT_NAME } from "@/lib/project-config";

export function ProjectTitle() {
    const [title, setTitle] = useState(DEFAULT_PROJECT_NAME);

    useEffect(() => {
        const updateTitle = () => {
            const savedTitle = localStorage.getItem("projectName");
            if (savedTitle) {
                setTitle(savedTitle);
            } else {
                setTitle(DEFAULT_PROJECT_NAME);
            }
        };

        updateTitle();
        window.addEventListener("storage", updateTitle);
        return () => window.removeEventListener("storage", updateTitle);
    }, []);

    return <span className="font-bold text-sm md:text-lg uppercase tracking-tight text-foreground truncate block">{title}</span>;
}
