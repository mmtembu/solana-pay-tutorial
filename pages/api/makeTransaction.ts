import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction, Keypair } from "@solana/web3.js";
import { NextApiResponse, NextApiRequest } from "next";
import { couponAddress, shopAddress, usdcAddress } from "../../lib/addresses";
import calculatePrice from "../../lib/calculatePrice";
import base58 from "bs58";

export type MakeTransactionInputData = {
     account: string,
}

type MakeTransactionGetResponse = {
    label: string,
    icon: string,
}

export type MakeTransactionOutputData = {
    transaction: string,
    message: string,
}

type ErrorOutput = {
    error: string,
}

function get(res: NextApiResponse<MakeTransactionGetResponse>){
    res.status(200).json({
        label: "Kota Tribe",
        icon: "https://freesvg.org/img/FrenchFries.png",
    })
}

async function post(
    req: NextApiRequest,
    res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
){
    try{
        const amount = calculatePrice(req.query)
        if(amount.toNumber() === 0){
            res.status(400).json({ error: "Can't checkout with charge of 0" })
            return
        }

        const {reference} = req.query
        if(!reference){
            res.status(400).json({ error: "No reference provider" })
            return
        }

        const { account } = req.body as MakeTransactionInputData
        if(!account){
            res.status(400).json({ error: "No account provided" })
        }

        const shopPrivateKey = process.env.SHOP_PRIVATE_KEY as string
        if(!shopPrivateKey){
            res.status(500).json({ error: "Shop private key not available"})
        }

        const shopKeyPair = Keypair.fromSecretKey(base58.decode(shopPrivateKey))

        const buyerPublicKey = new PublicKey(account)
        const shopPublicKey = shopKeyPair.publicKey

        const network = WalletAdapterNetwork.Devnet
        const endpoint = clusterApiUrl(network)
        const connection = new Connection(endpoint)

        const buyerCouponAddress = await getOrCreateAssociatedTokenAccount(
            connection,
            shopKeyPair,
            couponAddress,
            buyerPublicKey,
        ).then(account => account.address)

        const buyerCouponAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            shopKeyPair,
            couponAddress,
            buyerPublicKey,
        )

        const shopCouponAddress = await getAssociatedTokenAddress(couponAddress, shopPublicKey)
        
        const buyerGetsCouponDiscount = buyerCouponAccount.amount >= 5

        const usdcMint = await getMint(connection, usdcAddress)

        const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey)

        const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, shopPublicKey)

        const {blockhash} = await (connection.getLatestBlockhash('finalized'))

        const transaction = new Transaction({
            recentBlockhash: blockhash, 
            feePayer: buyerPublicKey,
        })

        const amountToPay = buyerGetsCouponDiscount ? amount.dividedBy(2) : amount
        
        const transferInstruction = createTransferCheckedInstruction(
            buyerUsdcAddress,
            usdcAddress,
            shopUsdcAddress,
            buyerPublicKey,
            amountToPay.toNumber() * (10 ** (usdcMint).decimals),
            usdcMint.decimals,
        )

        transferInstruction.keys.push({
            pubkey: new PublicKey(reference),
            isSigner: false,
            isWritable: false,
        })

        const couponInstruction = buyerGetsCouponDiscount ?

        createTransferCheckedInstruction(
            buyerCouponAccount.address,
            couponAddress,
            shopCouponAddress,
            buyerPublicKey,
            5,
            0
        ):
        createTransferCheckedInstruction(
            shopCouponAddress,
            couponAddress,
            buyerCouponAccount.address,
            shopPublicKey,
            1,
            0,
        )

        couponInstruction.keys.push({
            pubkey: shopPublicKey,
            isSigner: true,
            isWritable: false,
        })

        transaction.add(transferInstruction, couponInstruction)

        transaction.partialSign(shopKeyPair)

        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false
        })

        const base64 = serializedTransaction.toString('base64')

        const message = buyerGetsCouponDiscount ? "50% Discount! 🍟" : "Thanks for your order! 🍟"

        res.status(200).json({
            transaction: base64,
            message,
        })
    }catch(err){
        console.log(err);

        res.status(500).json({error: "error creating transaction", })
        return
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MakeTransactionGetResponse | MakeTransactionOutputData | ErrorOutput>
){
    if(req.method === "GET"){
        return get(res)
    }else if(req.method === "POST"){
        return await post(req, res)
    }else {
        return res.status(405).json({ error: "Method not allowed" })
    }
}