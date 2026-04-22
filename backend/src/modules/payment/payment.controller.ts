import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SepayAuthGuard } from 'src/guards/sepay.guard';
export interface SepayWebhook{
  id: string | number,
  code: string, 
  transferAmount : number,
  content: string
}
@Controller('apis/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}  
  @Post('/sepay')
  @UseGuards(SepayAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async patchPayment (@Body() body: SepayWebhook){
    await this.paymentService.patchPayment(body)
  }
  @Post('/sepay2')
  @UseGuards(SepayAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async patchSalary (@Body() body: SepayWebhook){
    await this.paymentService.patchSalary(body)
  }
}
