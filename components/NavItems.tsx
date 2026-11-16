"use client";

import {NAV_ITEMS} from "@/lib/constants";
import {usePathname} from "next/navigation";
import Link from "next/link";

const NavItems = ({ onSearch }: { onSearch?: () => void }) => {
    const pathname= usePathname()
    const isActive: (path: string) => boolean = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    }

    return (
        <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
            {NAV_ITEMS.map( ({href, label}) => {


                return <li key={href}>
                    {href === '/search' ? (
                        <button
                            type="button"
                            className="hover:text-yellow-500 transition-colors cursor-pointer"
                            onClick={() => {
                                onSearch?.();
                                document.dispatchEvent(new Event('open-stock-search'));
                            }}
                        >
                            {label}
                        </button>
                    ) : (
                    <Link href={href} className={`hover:text-yellow-500 transition-colors ${
                        isActive(href) ? 'text-gray-100' : ''}`}>
                        {label}
                    </Link>
                    )}
                </li>
            })}
        </ul>
    )
}
export default NavItems;
