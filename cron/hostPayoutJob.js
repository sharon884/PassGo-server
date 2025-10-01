const cron = require('node-cron');
const mongoose = require('mongoose');
const Event = require('../models/eventModel');
const PaidTicket = require('../models/paidTicketModel');
const Wallet = require('../models/walletModel');
const Transaction = require('../models/transactionModel');
const { createNotification } = require('../Services/notifications/notificationServices'); 


const PLATFORM_FEE_RATE = 0.10; // 10% platform fee
const ADMIN_WALLET_USER_ID = process.env.SUPER_ADMIN_ID; 


const settleEventPayout = async () => {
    console.log(`[Cron] Starting host payout settlement at ${new Date().toISOString()}`);

 
    if (!ADMIN_WALLET_USER_ID) {
        console.error("[Cron ERROR] CRITICAL: SUPER_ADMIN_ID is not defined in environment variables. Aborting job.");
        return;
    }

    const eventsToSettle = await Event.find({
        date: { $lt: new Date() },        
        advancePaid: true,                
        isCancelled: false,               
        isApproved: true,                 
        status: { $nin: ['draft', 'pending_payment', 'requested', 'rejected', 'cancelled', 'settled'] }, 
    }).lean(); 

    if (eventsToSettle.length === 0) {
        console.log('[Cron] No events found for settlement.');
        return;
    }

    console.log(`[Cron] Found ${eventsToSettle.length} events to settle.`);

    // Process events sequentially to manage transaction load
    for (const event of eventsToSettle) {
        let session;
        try {
            session = await mongoose.startSession();
            session.startTransaction();

            const eventId = event._id;
            const hostId = event.host;
            const eventTitle = event.title;

            const isPaidEvent = event.eventType !== 'free';
            let totalSalesRevenue = 0;
            
            if (isPaidEvent) {
                const salesResult = await PaidTicket.aggregate([
                    { $match: { eventId: eventId, status: 'paid' } }, 
                    { $group: { _id: null, totalSales: { $sum: "$finalAmount" } } }
                ]).session(session);
                
                totalSalesRevenue = salesResult.length > 0 ? salesResult[0].totalSales : 0;
            } else {
                 console.log(`[Cron] Event ${eventTitle} is a FREE event. Sales Revenue: 0.`);
                 totalSalesRevenue = 0; 
            }
            
            const advanceRefundAmount = event.advancePaymentAmountPaid || 0; 
            
            const platformFee = Math.round(totalSalesRevenue * PLATFORM_FEE_RATE); 
            const netTicketPayout = totalSalesRevenue - platformFee;
            
            const totalHostPayout = netTicketPayout + advanceRefundAmount;

            if (totalHostPayout <= 0) {
               
                 await Event.updateOne({ _id: eventId }, { $set: { status: 'settled' } }).session(session);
                 await session.commitTransaction();
                 session.endSession();
                 console.log(`[Cron] Event ${eventTitle} settled with zero or negative payout. Skipping wallet updates.`);
                 continue; 
            }
            
            const adminWallet = await Wallet.findOneAndUpdate(
                { walletType: 'admin' }, 
                { $inc: { balance: -totalHostPayout } }, 
                { new: true, session: session }
            );

            if (!adminWallet) {
                throw new Error("Admin Wallet not found. Transaction aborted.");
            }
            if (adminWallet.balance < 0) {
                throw new Error("Admin wallet insufficient funds for payout. Transaction aborted.");
            }

        
            const hostWallet = await Wallet.findOneAndUpdate(
                { user: hostId, walletType: 'host' }, 
                { $inc: { balance: totalHostPayout } }, 
                { new: true, upsert: true, session: session } 
            );

            if (!hostWallet) {
                throw new Error(`Host Wallet not found and could not be created for host ID: ${hostId}`);
            }

            const transactions = [];

    
            transactions.push({
                userId: ADMIN_WALLET_USER_ID, 
                eventId: eventId,
                amount: totalHostPayout,
                type: "transfer", 
                method: "wallet",
                role: "admin",
                walletType: "admin",
                status: "success",
                description: `Event payout DEBIT to host for ${eventTitle}.`,
                balanceAfterTransaction: adminWallet.balance,
            });

            transactions.push({
                userId: hostId,
                eventId: eventId,
                amount: totalHostPayout,
                type: "event_payout", 
                method: "wallet",
                role: "host",
                walletType: "host",
                status: "success",
                description: `Final payout (Net Revenue + Advance Refund) for ${eventTitle}.`,
                balanceAfterTransaction: hostWallet.balance,
            });

            if (platformFee > 0) {
                transactions.push({
                    userId: ADMIN_WALLET_USER_ID,
                    eventId: eventId,
                    amount: platformFee,
                    type: "commission",
                    method: "internal", 
                    role: "admin",
                    walletType: "admin",
                    status: "success",
                    description: `10% Platform commission collected from ${eventTitle} sales revenue.`,
                    balanceAfterTransaction: adminWallet.balance, 
                });
            }

            await Transaction.insertMany(transactions, { session });
            
            await Event.updateOne(
                { _id: eventId },
                { $set: { status: 'settled' } } 
            ).session(session);

            await session.commitTransaction();
            console.log(`[Cron] ✅ Successfully settled event: ${eventTitle} (Payout: ${totalHostPayout})`);

            await createNotification(req.io , { 
                userId: hostId,
                role: "host",
                roleRef : "User",
                type: "payout_complete",
                title: "Event Payout Complete",
                message: `Your final settlement for '${eventTitle}' (₹${totalHostPayout}) has been credited to your wallet.`,
                reason: "event_payout",
                iconType: "success",
                eventId: eventId,
                link: `/host/wallet`,
            });

            
            await createNotification(req.io , { 
                userId: ADMIN_WALLET_USER_ID ,
                role: "admin",
                roleRef : "Admin",
                type: "commission",
                title: "Event Payout Completed and commision eared platform ",
                message: `10% Platform commission collected from ${eventTitle} sales revenue.`,
                reason: "event_payout",
                iconType: "success",
                eventId: eventId,
                link: `/host/wallet`,
            });



        } catch (error) {
            if (session) {
                await session.abortTransaction();
            }
            console.error(`[Cron ERROR] ❌ Failed to settle event ${eventTitle}. Transaction rolled back. Error:`, error.message);
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }
    console.log('[Cron] Host payout settlement job finished.');
};

const startHostPayoutJob = () => {

    cron.schedule('0 0 * * *', settleEventPayout, {
        timezone: "Asia/Kolkata" 
    });
    console.log('[Cron] Host Payout Job Scheduled: Runs daily at midnight IST/specified timezone.');
};

module.exports = { startHostPayoutJob, settleEventPayout };