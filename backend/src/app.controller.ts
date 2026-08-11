import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'ok',
      message: 'Backend funcionando 🚀',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }
}