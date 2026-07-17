import {
    useLanguage,
} from "../app/LanguageContext";

const homeText = {
    en: {
        title: "Physics & Mathematics Notes",
        welcome: "Welcome!",
    },

    da: {
        title: "Noter i fysik og matematik",
        welcome: "Velkommen!",
    },
} as const;

export default function Home() {
    const {
        language,
    } = useLanguage();

    const text = homeText[language];

    return (
        <>
            <h1>{text.title}</h1>
            <p>{text.welcome}</p>
        </>
    );
}
