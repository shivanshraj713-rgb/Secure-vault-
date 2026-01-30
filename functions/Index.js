const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');

admin.initializeApp();

// Set Admin Claim
exports.setAdmin = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthorized');
    
    await admin.auth().setCustomUserClaims(context.auth.uid, { admin: true });
    return { success: true };
});

// Verify Payment
exports.verifyPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Unauthorized');
    
    const { paymentId, plan } = data;
    
    try {
        // Verify with Stripe
        const payment = await stripe.paymentIntents.retrieve(paymentId);
        
        if (payment.status === 'succeeded') {
            // Update user premium status
            const db = admin.firestore();
            await db.collection('users').doc(context.auth.uid).update({
                isPremium: true,
                premiumSince: admin.firestore.FieldValue.serverTimestamp(),
                premiumPlan: plan
            });
            
            // Create premium record
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + (plan === 'yearly' ? 12 : 1));
            
            await db.collection('premium').doc(context.auth.uid).set({
                userId: context.auth.uid,
                plan: plan,
                amount: payment.amount,
                paymentId: paymentId,
                upgradedAt: new Date().toISOString(),
                expiryDate: expiryDate.toISOString()
            });
            
            return { success: true };
        }
        
        return { success: false, error: 'Payment failed' };
    } catch (error) {
        console.error('Payment verification error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Auto-clean Old Files
exports.cleanOldFiles = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage();
    
    // Find files older than 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const oldFiles = await db.collection('files')
        .where('createdAt', '<', sixtyDaysAgo)
        .where('isPremium', '==', false)
        .get();
    
    const deletePromises = [];
    
    oldFiles.forEach(doc => {
        const file = doc.data();
        // Delete from storage
        deletePromises.push(
            storage.bucket().file(file.storagePath).delete()
        );
        // Delete from Firestore
        deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    console.log(`Cleaned ${oldFiles.size} old files`);
    
    return null;
});

// Send Notification to Users
exports.sendNotification = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }
    
    const { target, title, message } = data;
    
    // Get FCM tokens based on target
    let userQuery = admin.firestore().collection('users');
    
    if (target === 'premium') {
        userQuery = userQuery.where('isPremium', '==', true);
    } else if (target === 'free') {
        userQuery = userQuery.where('isPremium', '==', false);
    }
    
    const usersSnapshot = await userQuery.get();
    const tokens = [];
    
    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.fcmToken) {
            tokens.push(userData.fcmToken);
        }
    });
    
    // Send notifications
    if (tokens.length > 0) {
        const payload = {
            notification: {
                title: title,
                body: message
            }
        };
        
        await admin.messaging().sendToDevice(tokens, payload);
    }
    
    return { success: true, sentTo: tokens.length };
});

// Check Premium Status (Scheduled)
exports.checkPremiumExpiry = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    
    const expiredPremiums = await db.collection('premium')
        .where('expiryDate', '<', now)
        .get();
    
    const updatePromises = [];
    
    expiredPremiums.forEach(doc => {
        const premiumData = doc.data();
        updatePromises.push(
            db.collection('users').doc(premiumData.userId).update({
                isPremium: false
            })
        );
        updatePromises.push(doc.ref.delete());
    });
    
    await Promise.all(updatePromises);
    console.log(`Processed ${expiredPremiums.size} expired premiums`);
    
    return null;
});
