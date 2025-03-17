import { Controller, Get } from '@nestjs/common';
import { DbTestService } from './db-test.service';

@Controller('db-test')
export class DbTestController {
  constructor(private readonly dbTestService: DbTestService) {}

  @Get()
  async test() {
    return this.dbTestService.testConnection();
  }
}
