import { Controller, Get, Res, Req } from '@nestjs/common';
import { Response } from 'express';

// Utils
import commonUtil from './../utils/common.util';
import { AppError } from './../utils/appError';

// Services
import { AppService } from '../services/app.service';
import { SettingService } from '../services/setting.service';
import { RideRequestListType, RideStatus } from './../dataTypes/ride';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly settingService: SettingService,
  ) {}

  @Get()
  getHello(): string {
    return 'API is running fine';
  }

  @Get('/health')
  health(): string {
    return 'API health is running fine';
  }

  @Get('/settings')
  async getSettings(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      commonUtil.consoleLog('AppController:getSettings:start');
      const { params }: any = req;
      const data: any = await this.settingService.find(params);
      commonUtil.consoleLog('AppController:getSettings:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('AppController:getSettings:error', e);
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
  @Get('/metaInfo')
  async getMetaInfo(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      commonUtil.consoleLog('AppController:getMetaInfo:start');
      const data: any = {
        rideStatus: RideStatus,
        rideListType: RideRequestListType,
      };
      commonUtil.consoleLog('AppController:getMetaInfo:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('AppController:getMetaInfo:error', e);
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
  @Get('/discoverSafetyResources')
  async getDiscoverSafetyResources(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('AppController:getDiscoverSafetyResources:start');
      const data: any = {};
      commonUtil.consoleLog('AppController:getDiscoverSafetyResources:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog(
        'AppController:getDiscoverSafetyResources:error',
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
}
