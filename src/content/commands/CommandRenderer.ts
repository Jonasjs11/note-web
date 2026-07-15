import type { ReactNode } from "react";

export interface CommandRenderer {
    render(
        arguments_: string[],
    ): ReactNode;
}