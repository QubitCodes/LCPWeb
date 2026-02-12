import { Payment, Order, Company, User } from '../models';
import { AuditService } from '../services/AuditService';
import { Op } from 'sequelize';

/**
 * PaymentController
 * Handles all payment-related business logic including listing,
 * approving, and rejecting manual payments.
 */
export class PaymentController {

    /**
     * List all payments with pagination, filtering, and joined relations.
     * @param filters - Query filters (status, provider, page, limit)
     * @param actor - The authenticated user performing the request
     */
    static async list(filters: any, actor: any) {
        const page = Number(filters.page || 1);
        const limit = Number(filters.limit || 10);
        const offset = (page - 1) * limit;

        const whereClause: any = {};

        // Filter by status
        if (filters.status) {
            whereClause.status = filters.status;
        }

        // Filter by provider
        if (filters.provider) {
            whereClause.provider = filters.provider;
        }

        // Search by order ID or transaction ID
        if (filters.search) {
            whereClause[Op.or] = [
                { provider_transaction_id: { [Op.iLike]: `%${filters.search}%` } }
            ];
        }

        const { count, rows } = await Payment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        { model: Company, as: 'company', attributes: ['id', 'name'] },
                        { model: User, as: 'ordered_by', attributes: ['id', 'first_name', 'last_name', 'email'] }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            success: true,
            data: rows,
            code: 100,
            misc: {
                total: count,
                page,
                limit,
                pages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get a single payment by ID with full details.
     * @param id - Payment UUID
     */
    static async getById(id: string) {
        const payment = await Payment.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [
                        { model: Company, as: 'company', attributes: ['id', 'name'] },
                        { model: User, as: 'ordered_by', attributes: ['id', 'first_name', 'last_name', 'email'] }
                    ]
                }
            ]
        });

        if (!payment) {
            return { success: false, message: 'Payment not found', code: 310 };
        }

        return { success: true, data: payment, code: 100 };
    }

    /**
     * Approve a pending manual payment.
     * Updates payment status to APPROVED and linked order status to PAID.
     * @param id - Payment UUID
     * @param adminId - The admin approving the payment
     */
    static async approve(id: string, adminId: string) {
        const payment = await Payment.findByPk(id, {
            include: [{ model: Order, as: 'order' }]
        });

        if (!payment) {
            return { success: false, message: 'Payment not found', code: 310 };
        }

        if ((payment as any).status !== 'PENDING') {
            return { success: false, message: `Payment already ${(payment as any).status}`, code: 400 };
        }

        // Update payment status
        await (payment as any).update({ status: 'APPROVED' });

        // Update linked order to PAID
        if ((payment as any).order) {
            await (payment as any).order.update({ status: 'PAID' });
        }

        // Audit log
        await AuditService.log({
            userId: adminId,
            action: 'APPROVE_PAYMENT',
            entityType: 'PAYMENT',
            entityId: id,
            details: { amount: (payment as any).amount, order_id: (payment as any).order_id }
        });

        return { success: true, message: 'Payment approved successfully', code: 103 };
    }

    /**
     * Reject a pending manual payment.
     * @param id - Payment UUID
     * @param adminId - The admin rejecting the payment
     * @param reason - Reason for rejection
     */
    static async reject(id: string, adminId: string, reason?: string) {
        const payment = await Payment.findByPk(id);

        if (!payment) {
            return { success: false, message: 'Payment not found', code: 310 };
        }

        if ((payment as any).status !== 'PENDING') {
            return { success: false, message: `Payment already ${(payment as any).status}`, code: 400 };
        }

        await (payment as any).update({ status: 'REJECTED' });

        // Audit log
        await AuditService.log({
            userId: adminId,
            action: 'REJECT_PAYMENT',
            entityType: 'PAYMENT',
            entityId: id,
            details: { amount: (payment as any).amount, reason }
        });

        return { success: true, message: 'Payment rejected', code: 103 };
    }
}
