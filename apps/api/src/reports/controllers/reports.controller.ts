import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AccountId, Auth, CoreUserContext, CurrentAuth } from '../../common';
import { CreateReportDto, ListReportsQueryDto } from '../dtos';
import { ReportsService } from '../services';

@ApiTags('Reportes')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('catalog')
  @Auth()
  catalog() {
    return this.service.catalog();
  }

  @Get()
  @Auth()
  list(@AccountId() accountId: string, @Query() q: ListReportsQueryDto) {
    return this.service.list(accountId, q.page, q.limit);
  }

  @Post()
  @Auth()
  request(@CurrentAuth() user: CoreUserContext, @Body() dto: CreateReportDto) {
    return this.service.request(user, dto);
  }

  @Get(':id')
  @Auth()
  get(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(accountId, id);
  }

  @Get(':id/download')
  @Auth()
  async download(@AccountId() accountId: string, @Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const file = await this.service.file(accountId, id);
    if (!file) throw new NotFoundException('El reporte aún no está listo');
    res.setHeader('content-type', file.mimeType);
    res.setHeader('content-disposition', `attachment; filename="${file.fileName}"`);
    if (file.sha256) res.setHeader('x-content-sha256', file.sha256);
    res.send(file.buffer);
  }
}
