import { Controller, Get } from '@nestjs/common';
import { DbTestService } from './db-test.service';

@Controller('db-test')
export class DbTestController {
  constructor(private readonly dbTestService: DbTestService) {}

  @Get()
  async test(): Promise<{
    success: boolean;
    result?: { result: number }[];
    error?: string;
  }> {
    return this.dbTestService.testConnection();
  }

  @Get('users')
  async testUsers(): Promise<{
    success: boolean;
    result?: any[];
    error?: string;
  }> {
    return this.dbTestService.testUsers();
  }
}
