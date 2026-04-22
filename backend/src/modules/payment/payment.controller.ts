import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('apis/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  
}
