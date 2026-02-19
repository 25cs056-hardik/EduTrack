import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full transition-all duration-300 hover:bg-secondary"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
            {theme === "light" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-1000" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
