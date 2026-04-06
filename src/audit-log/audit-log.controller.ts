import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('audit-logs')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs (admin only)' })
  @ApiResponse({ status: 200, description: 'Return paginated audit logs' })
  findAll(@Query() filterDto: FilterAuditLogDto) {
    return this.auditLogService.findAll(filterDto);
  }
}
