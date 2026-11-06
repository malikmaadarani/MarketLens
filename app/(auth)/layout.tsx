import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import 'flag-icons/css/flag-icons.min.css';
import logo from '@/components/logo.png';

const Layout = ({children}: {children : React.ReactNode}) => {
    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo flex items-center gap-3">
                    <Image
                        src={logo}
                        alt=""
                        className="h-10 w-10 shrink-0 object-contain"
                    />
                    <span className="text-xl font-bold leading-none text-white">
                        MarketLens
                    </span>
                </Link>

                <div className="py-6 lg:pb-8 flex-1">
                    {children}
                </div>
            </section>

            <section className="auth-right-section"> 
                <div className="z-10 relative lg:mt-45 lg:mb-16">
                    <blockquote className="auth-blockquote">
                        MarketLance turned my watchlist into a winninglist. The alerts are so accurate, I can finally sleep at night knowing I won't miss a trade.
                    </blockquote>
                    <div className="flex items-center justify-between">
                        <div>
                            <cite className="auth-blockquote-author">- John Doe</cite>
                            <p className="max-md:text-xs text-gray-500">Retail Investor</p>
                        </div>
                    </div>
                    <div className="flex itemns-center gap-0.5">
                        {[1,2,3,4,5].map((star) => (
                            <Image src="/assets/icons/star.svg" alt="star" key={star} width={20} height={20} className="h-5 w-5" />
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}
export default Layout
