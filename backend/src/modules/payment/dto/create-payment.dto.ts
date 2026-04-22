export class CreatePaymentDto {}
export class SepayWebhookDto {
  id: string | number
  code: string
  transferAmount: number
  content: string
}