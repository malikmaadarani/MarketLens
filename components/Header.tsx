import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import SearchCommand from "@/components/SearchCommand";
import { searchStocks } from "@/lib/actions/finnhub.actions";

const Header = async ({user}: {user: User}) => {
    const initialStocks = (await searchStocks()).slice(0, 5);

    return (
        <header className="sticky top-0 header">
            <SearchCommand initialStocks={initialStocks} hideTrigger />
            <div className="container header-wrapper">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/assets/icons/stock.svg" alt="MarketLens logo" width={200} height={50} className="h-8 w-auto cursor-pointer"/>
                    <span className="text-xl font-bold text-gray-100">MarketLens</span>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems />
                </nav>
                <UserDropdown user={user}/>
            </div>
        </header>
    )
}
export default Header
