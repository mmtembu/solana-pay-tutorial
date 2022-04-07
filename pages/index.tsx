import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import CouponBook from '../components/CouponBook'
import Products from '../components/Products'
import SiteHeading from '../components/SiteHeading'

export default function HomePage() {

  const { publicKey } = useWallet();

  return (
    // <div className="bg-fixed bg-kota-lg w-full h-screen">
    <div className="bg-kota-background">
      <div className="flex flex-col gap-8 max-w-4xl items-stretch m-auto pt-24">
        <SiteHeading>Kota Tribe</SiteHeading>

        <div className='basis-1/4'>
          <WalletMultiButton className='!bg-gray-900 hover:scale-105'/>
        </div>

        {publicKey && <CouponBook/>}

        <Products submitTarget='/checkout' enabled={publicKey !== null} />

        </div>
      </div>
  )
}
