import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';

import validatorUtil from 'src/utils/validator.util';
import { CreateSettingDto, UpdateSettingDto } from './../dto/setting.dto';
import { SettingService } from './../services/setting.service';
import { AppError } from './../utils/appError';
import commonUtil from './../utils/common.util';

@Controller('/settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Post('/')
  @UsePipes(new ValidationPipe())
  async createSetting(
    @Body() createSettingDto: CreateSettingDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('SettingController:createSetting:start');
      const settingInfo = await this.settingService.getSettingByKey(
        createSettingDto.settingKey,
      );
      if (validatorUtil.isNotUndefinedAndNull(settingInfo)) {
        throw new AppError(400).addParamError('Setting already exists');
      }
      const data = await this.settingService.create(createSettingDto);
      commonUtil.consoleLog('SettingController:createSetting:end');
      res.status(HttpStatus.CREATED).json(data);
    } catch (e) {
      commonUtil.consoleLog('SettingController:createSetting:error', e);
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
  @Put('/:key')
  @UsePipes(new ValidationPipe())
  async updateSetting(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('SettingController:updateSetting:start', {
        key,
        updateSettingDto,
      });

      let settingInfo = await this.settingService.getSettingByKey(key);
      if (validatorUtil.isNullOrUndefined(settingInfo)) {
        throw new AppError(400).addParamError('Invalid setting');
      }
      const updatedBody: any = {
        settingValue: updateSettingDto.settingValue,
      };
      await this.settingService.update(key, updatedBody);
      settingInfo = settingInfo.toObject();
      settingInfo.settingValue = updateSettingDto.settingValue;
      return res.status(200).json(settingInfo);
    } catch (e) {
      commonUtil.consoleLog('SettingController:updateSetting:error', e);
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
  async getSettings(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      commonUtil.consoleLog('AppController:getSettings:start');
      const { query }: any = req;
      const data: any = await this.settingService.find(query);
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

  @Get('/:key')
  async getSettingByKey(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('AppController:getSettingByKey:start');
      const settingInfo = await this.settingService.getSettingByKey(key);
      if (validatorUtil.isNullOrUndefined(settingInfo)) {
        throw new AppError(400).addParamError('Invalid setting');
      }
      commonUtil.consoleLog('AppController:getSettingByKey:end');
      return res.status(200).json(settingInfo);
    } catch (e) {
      commonUtil.consoleLog('AppController:getSettingByKey:error', e);
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

  @Delete('/:key')
  async deleteSetting(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('SettingController:deleteSetting:start');
      const settingInfo = await this.settingService.getSettingByKey(key);
      if (validatorUtil.isNullOrUndefined(settingInfo)) {
        throw new AppError(400).addParamError('Invalid setting');
      }
      await this.settingService.delete(key);
      commonUtil.consoleLog('SettingController:deleteSetting:end');
      return res.status(200).json({});
    } catch (e) {
      commonUtil.consoleLog('SettingController:deleteSetting:error', e);
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
