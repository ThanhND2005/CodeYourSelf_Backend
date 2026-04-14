import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  console.log('1')
  const app = await NestFactory.create(AppModule, {
  logger: ['log', 'error', 'warn', 'debug', 'verbose'],
});
  app.enableCors({
    origin :true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  console.log('2')
  app.use(cookieParser())
  console.log('3')
  await app.listen(process.env.PORT ?? 3000,'0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
