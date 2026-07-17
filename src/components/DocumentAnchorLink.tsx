import {
    Link,
    useLocation,
} from "react-router-dom";

import type {
    LinkProps,
} from "react-router-dom";

type DocumentAnchorLinkProps =
    Omit<LinkProps, "to"> & {
        anchorId: string;
    };

export default function DocumentAnchorLink({
    anchorId,
    children,
    ...linkProps
}: DocumentAnchorLinkProps) {
    const location = useLocation();

    /*
     * Accept both:
     *
     * tab-quantities
     * #tab-quantities
     *
     * and always produce:
     *
     * #tab-quantities
     */
    const normalizedAnchorId =
        anchorId.replace(/^#+/, "");

    return (
        <Link
            {...linkProps}
            to={{
                pathname: location.pathname,
                search: location.search,
                hash: `#${normalizedAnchorId}`,
            }}
        >
            {children}
        </Link>
    );
}