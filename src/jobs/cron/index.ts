import { orderRepo } from '@/lib/order/order.repo';
import cron from 'node-cron';

export const initCronJobs = () => {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        console.log('Running Cleanup Job: Releasing expired stock...');
        try {
            // Release orders older than 30 minutes
            const result = await orderRepo.releaseExpiredOrders(30);
            if (result.success && result.data && result.data > 0) {
                console.log(`Cleanup Complete: Released stock for ${result.data} orders.`);
            }
        } catch (error) {
            console.error('Cleanup Job Failed:', error);
        }
    });
};