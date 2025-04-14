import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateReportSuspiciousDto } from 'src/dto/reportSuspicious.dto';
import { NotificationService } from 'src/services/notification.service';
import { ReportSuspiciousService } from 'src/services/reportSuspicious.service';
import { AppError } from 'src/utils/appError';
import commonUtil from 'src/utils/common.util';

@Controller('suspiciousActivity')
export class ReportSuspiciousController {
  constructor(
    private readonly reportSuspiciousService: ReportSuspiciousService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('/')
  @UsePipes(new ValidationPipe())
  async createReportSuspicious(
    @Req() req: Request,
    @Res() res: Response,
    @Body() pData: CreateReportSuspiciousDto,
  ): Promise<any> {
    try {
      const { user }: any = req;
      commonUtil.consoleLog(
        'ReportSuspiciousController:createReportSuspicious:start',
      );
      const dataToCreated: any = {
        ...pData,
        UID: commonUtil.generateUniqueId(),
        userId: user.UID,
      };
      commonUtil.consoleLog(
        'ReportSuspiciousController:createReportSuspicious:dataToCreated:',
        dataToCreated,
      );
      const data = await this.reportSuspiciousService.create(dataToCreated);
      this.notificationService.newSuspiciousActivityReported(data);
      return res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog(
        'PickupNoteController:createReportSuspicious:error',
        e,
      );
      if (e instanceof AppError) {
        return res.status(e.getStatusCode()).json(e);
      } else {
        return res
          .status(500)
          .json(
            new AppError(500).addServerError('Unable to process your request'),
          );
      }
    }
  }

  @Get('/')
  async getAllReports(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      const { query }: any = req;
      commonUtil.consoleLog('PickupNoteController:getAllReports:start', query);
      const data = await this.reportSuspiciousService.find(query);
      commonUtil.consoleLog('PickupNoteController:getAllReports:end');
      return res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('PickupNoteController:getAllReports:error', e);
      if (e instanceof AppError) {
        return res.status(e.getStatusCode()).json(e);
      } else {
        return res
          .status(500)
          .json(
            new AppError(500).addServerError('Unable to process your request'),
          );
      }
    }
  }
}
