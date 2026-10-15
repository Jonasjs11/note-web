import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSubject } from "../../app/SubjectContext";
import { useLanguage } from "../../app/LanguageContext";
import { useUiTranslation } from "../../i18n/useUiTranslation";
import { searchContent } from "../../search/searchIndex";
import type { SearchResult, SearchResultKind } from "../../search/searchIndex";

type SearchScope = "subject" | "all";
export default function NoteSearch() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = useUiTranslation();
    const { selectedSubject, selectedPresentation } = useSubject();
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [scope, setScope] = useState<SearchScope>("subject");
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listboxId = useId();

    const results = useMemo(() => searchContent(query, {
        language, subject: scope === "subject" ? selectedSubject : undefined,
    }), [language, query, scope, selectedSubject]);

    useEffect(() => {
        function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setIsOpen(true);
                inputRef.current?.focus();
            }
        }
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);
    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    function openResult(result: SearchResult) {
        navigate(result.url);
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
    }
    const safeActiveIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);
    const activeResult = results[safeActiveIndex];
    function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
            return;
        }
        if (results.length === 0) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex(current => (current + 1) % results.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex(current => (current - 1 + results.length) % results.length);
        } else if (event.key === "Enter") {
            event.preventDefault();
            openResult(results[safeActiveIndex]);
        }
    }
    return (
        <div ref={rootRef} className="note-search">
            <div className="note-search__input-shell">
                <SearchIcon />
                <input ref={inputRef} className="note-search__input" type="search"
                    value={query}
                    placeholder={t("search.placeholder", { subject: selectedPresentation.title })}
                    aria-label={t("search.label")}
                    role="combobox" aria-autocomplete="list" aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-activedescendant={activeResult ? createResultId(listboxId, activeResult.id) : undefined}
                    onFocus={() => setIsOpen(true)}
                    onChange={event => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleInputKeyDown} />
                <kbd className="note-search__shortcut">{readShortcutLabel()}</kbd>
            </div>
            {isOpen && (
                <div className="note-search__panel">
                    <div className="note-search__scope-row">
                        <span className="note-search__scope-label">{t("search.in")}</span>
                        <div className="note-search__scope-options" aria-label={t("search.scope")}>
                            <button type="button"
                                className={scope === "subject"
                                    ? "note-search__scope-button note-search__scope-button--active"
                                    : "note-search__scope-button"}
                                aria-pressed={scope === "subject"}
                                onClick={() => { setScope("subject"); setActiveIndex(0); }}>
                                {selectedPresentation.title}
                            </button>
                            <button type="button"
                                className={scope === "all"
                                    ? "note-search__scope-button note-search__scope-button--active"
                                    : "note-search__scope-button"}
                                aria-pressed={scope === "all"}
                                onClick={() => { setScope("all"); setActiveIndex(0); }}>
                                {t("search.allSubjects")}
                            </button>
                        </div>
                    </div>
                    <div id={listboxId} className="note-search__results" role="listbox"
                        aria-label={t("search.results")}>
                        {!query.trim() ? <SearchMessage>{t("search.hint")}</SearchMessage>
                            : results.length === 0 ? <SearchMessage>{t("search.none")}</SearchMessage>
                                : <GroupedResults results={results} activeIndex={safeActiveIndex}
                                    listboxId={listboxId} onActivate={setActiveIndex}
                                    onOpen={openResult} />}
                    </div>
                </div>
            )}
        </div>
    );
}
function GroupedResults({ results, activeIndex, listboxId, onActivate, onOpen }: {
    results: SearchResult[];
    activeIndex: number;
    listboxId: string;
    onActivate: (index: number) => void;
    onOpen: (result: SearchResult) => void;
}) {
    const t = useUiTranslation();
    const groups: SearchResultKind[] = ["note", "concept"];
    return groups.map(kind => {
        const groupResults = results.map((result, index) => ({ result, index }))
            .filter(({ result }) => result.kind === kind);
        if (!groupResults.length) return null;
        const kindLabel = kind === "note" ? t("search.notes") : t("search.concepts");
        return (
            <section key={kind} className="note-search__group">
                <div className="note-search__group-title">{kindLabel}</div>
                {groupResults.map(({ result, index }) => {
                    const isActive = index === activeIndex;
                    return (
                        <button key={result.id} id={createResultId(listboxId, result.id)}
                            type="button" role="option" aria-selected={isActive}
                            className={isActive
                                ? "note-search__result note-search__result--active"
                                : "note-search__result"}
                            onPointerMove={() => onActivate(index)} onClick={() => onOpen(result)}>
                            <span className="note-search__result-heading">
                                <span className="note-search__result-title">{result.title}</span>
                                <span className="note-search__result-kind">{kindLabel}</span>
                            </span>
                            <span className="note-search__result-path">{result.breadcrumb}</span>
                            <span className="note-search__result-snippet">{result.snippet}</span>
                        </button>
                    );
                })}
            </section>
        );
    });
}
function SearchMessage({ children }: { children: string }) {
    return <div className="note-search__message">{children}</div>;
}
function SearchIcon() {
    return (
        <svg className="note-search__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15.5 15.5 4 4" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}
function createResultId(listboxId: string, resultId: string): string {
    return `${listboxId}-${resultId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function readShortcutLabel(): string {
    if (typeof navigator === "undefined") return "Ctrl K";
    return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
}
