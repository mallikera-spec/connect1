import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * useSortable - generic client-side sort hook
 * @param {Array} data - the array to sort
 * @param {string} defaultKey - default sort key
 * @param {'asc'|'desc'} defaultDir - default direction
 * @returns { sorted, sortKey, sortDir, toggleSort }
 */
export function useSortable(data = [], defaultKey = '', defaultDir = 'asc') {
    const [sortKey, setSortKey] = useState(defaultKey);
    const [sortDir, setSortDir] = useState(defaultDir);

    const toggleSort = (key) => {
        if (key === sortKey) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sorted = useMemo(() => {
        if (!sortKey || !data.length) return data;
        return [...data].sort((a, b) => {
            // Support dot-notation keys e.g. "project.name"
            const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
            let av = get(a, sortKey);
            let bv = get(b, sortKey);

            // Nulls always last
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;

            // Date strings
            if (typeof av === 'string' && /^\d{4}-\d{2}/.test(av)) {
                av = new Date(av).getTime();
                bv = new Date(bv).getTime();
            }

            // Numbers
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortDir === 'asc' ? av - bv : bv - av;
            }

            // Strings
            const cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    return { sorted, sortKey, sortDir, toggleSort };
}

/**
 * SortableHeader - renders a <th> that toggles sort on click
 * Props: sortKey, label, currentSortKey, sortDir, onSort, style
 */
export function SortableHeader({ sortKey, label, currentSortKey, sortDir, onSort, style = {}, ...rest }) {
    const isActive = currentSortKey === sortKey;
    const Icon = isActive
        ? (sortDir === 'asc' ? ChevronUp : ChevronDown)
        : ChevronsUpDown;

    return (
        <th
            onClick={() => onSort(sortKey)}
            style={{
                cursor: 'pointer',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                ...style,
            }}
            {...rest}
        >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {label}
                <Icon
                    size={13}
                    style={{ opacity: isActive ? 1 : 0.35, flexShrink: 0 }}
                />
            </span>
        </th>
    );
}
