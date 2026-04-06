import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';

export interface AuditLogEntry {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'CANCEL';
  entityType: string;
  entityId: string;
  changes?: { before?: any; after?: any };
  ipAddress?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create(entry);
      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
    }
  }

  async findAll(
    filterDto: FilterAuditLogDto,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const { entityType, fromDate, toDate, page = 1, limit = 10 } = filterDto;

    const qb = this.auditLogRepository.createQueryBuilder('audit');

    if (entityType) {
      qb.andWhere('audit.entityType = :entityType', { entityType });
    }

    if (fromDate) {
      qb.andWhere('audit.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('audit.createdAt <= :toDate', { toDate });
    }

    qb.orderBy('audit.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }
}
