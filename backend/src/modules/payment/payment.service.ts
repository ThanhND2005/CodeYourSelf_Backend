import { Inject, Injectable, InternalServerErrorException, Param } from '@nestjs/common';
import * as mysql from 'mysql2/promise'
import { SepayWebhook } from './payment.controller';
@Injectable()
export class PaymentService {
    constructor(@Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool) { }
    private formatToUUID(idString: string): string {
        return idString.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    }
    async patchPayment(data : SepayWebhook) {
        try {
            const {transferAmount, content} = data
            const paymentid = content.split(' ')[0]
            const formatId = this.formatToUUID(paymentid)
            await this.db.query(
                `UPDATE Payment SET status='SUCCESS' WHERE paymentId=? AND amount=?`, [formatId, transferAmount]
            )
        } catch (error) {
           console.error(error)
           throw new InternalServerErrorException('loi') 
        }
    }
    async patchSalary(data : SepayWebhook) {
        try {
            const {transferAmount,content} = data
            const salaryId = content.split(' ')[1]
            const formatId = this.formatToUUID(salaryId)
            await this.db.query(
                `UPDATE  Salary SET status='PAID' WHERE salaryId=? AND amount=?`, [formatId, transferAmount]
            )
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException('loi') 
        }
    }
}
