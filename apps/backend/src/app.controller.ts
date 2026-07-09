import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/module-1-multitenant-admin/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
