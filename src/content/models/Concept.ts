export interface Concept {
    id: string;
    title: string;

    aliases: string[];

    shortDefinition: string;
    notation?: string;
    formalDefinition?: string;

    illustration?: string;
    prerequisites: string[];
}