import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { couponAddress } from "../lib/addresses";

export default function CouponBook(){
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [couponBalance, setCouponBalance] = useState(0)

    async function getCouponBalance(){
        if(!publicKey){
            setCouponBalance(0)
            return
        }

        try{
            const userCouponAddress = await getAssociatedTokenAddress(couponAddress, publicKey)
            const userCouponAccount = await getAccount(connection, userCouponAddress)
            const coupons = userCouponAccount.amount > 5 ? 5 : Number(userCouponAccount.amount)

            console.log("balance is", coupons)
            setCouponBalance(coupons)
        }catch(e){
            if(e instanceof TokenAccountNotFoundError){
                console.log(`uSER ${publicKey} doesn't have a coupon account yet!`)
                setCouponBalance(0)
            }else{
                console.log("Error getting coupon balance",e)
            }
        }
    }

    useEffect(() => {
        getCouponBalance()
    }, [publicKey])
    
    const notCollected = 5 - couponBalance

    return (
        <>
            <div className="flex flex-col bg-gray-900 text-white rounded-md p-1 items-center">
                <p>Collect 5 items to receive a 50% discount of your next purchase!</p>
                <p className="flex flex-row gap-1 place-self-center">
                    {[...Array(couponBalance)].map((_, i) => <span key={i}>🍟</span>)}
                    {[...Array(notCollected)].map((_,i) => <span key={i}>⚪</span>)}
                </p>
            </div>
        </>
    )
}