import {
  Controller,
  Get,
  Res,
  Req,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';

// Services
import { ServiceAreaService } from './../services/serviceArea.service';

// Utils
import commonUtil from './../utils/common.util';
import { AppError } from './../utils/appError';
import validatorUtil from 'src/utils/validator.util';

//DTO
import {
  CreateServiceAreaDto,
  UpdateServiceAreaDto,
} from 'src/dto/serviceArea.dto';

// Dto

@Controller('serviceArea')
export class ServiceAreaController {
  constructor(private readonly serviceAreaService: ServiceAreaService) {}

  @Get('/')
  async getServiceArea(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const { query }: any = req;
      commonUtil.consoleLog(
        'ServiceAreaController:getServiceArea:start',
        query,
      );
      const serviceAreas = await this.serviceAreaService.find(query);
      if (serviceAreas.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'No service areas found within the geofence' });
      }
      commonUtil.consoleLog('ServiceAreaController:getServiceArea:end');
      return res.status(HttpStatus.OK).json(serviceAreas);
    } catch (e) {
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

  @Post('/')
  @UsePipes(new ValidationPipe())
  async createServiceArea(
    @Body() createServiceAreaDto: CreateServiceAreaDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('ServiceAreaController:createServiceArea:start');
      const dataToCreated: any = {
        ...createServiceAreaDto,
        UID: commonUtil.generateUniqueId(),
      };
      commonUtil.consoleLog(
        'ServiceAreaController:createServiceArea:dataToCreated:',
        dataToCreated,
      );
      const data: any = await this.serviceAreaService.create(dataToCreated);
      commonUtil.consoleLog('ServiceAreaController:createServiceArea:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('ServiceAreaController:createServiceArea:error', e);
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

  @Put('/:id')
  @UsePipes(new ValidationPipe())
  async updateServiceArea(
    @Param('id') id: string,
    @Body() updateServiceAreaDto: UpdateServiceAreaDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog(
        'ServiceAreaController:UpdateServiceAreaDto:start',
        {
          id,
          UpdateServiceAreaDto,
        },
      );
      const serviceAreaInfo: any = await this.serviceAreaService.findOne({
        UID: id,
      });
      if (validatorUtil.isNullOrUndefined(serviceAreaInfo)) {
        throw new AppError(400).addParamError('Invalid service area');
      }
      const updatedBody: any = {
        name: updateServiceAreaDto.name,
      };
      await this.serviceAreaService.update(id, updatedBody);
      return res.status(200).json(serviceAreaInfo);
    } catch (e) {
      commonUtil.consoleLog('ServiceAreaController:updateServiceArea:error', e);
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

  @Delete('/:id')
  async deleteServiceArea(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('ServiceAreaController:deleteServiceArea:start');
      const serviceAreaInfo: any = await this.serviceAreaService.findOne({
        UID: id,
      });
      if (validatorUtil.isNullOrUndefined(serviceAreaInfo)) {
        throw new AppError(400).addParamError('Invalid service area');
      }
      await this.serviceAreaService.delete(id);
      commonUtil.consoleLog('ServiceAreaController:deleteServiceArea:end');
      res.status(200).json({});
    } catch (e) {
      commonUtil.consoleLog('ServiceAreaController:deleteServiceArea:error', e);
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

  @Get('/:id')
  async getServiceAreaById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('ServiceAreaController:getServiceAreaById:start');
      const data = await this.serviceAreaService.findOne({ UID: id });
      commonUtil.consoleLog('ServiceAreaController:getServiceAreaById:end');
      if (validatorUtil.isNullOrUndefined(data)) {
        throw new AppError(400).addParamError('Pickup note not found');
      }
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog(
        'ServiceAreaController:getServiceAreaById:error',
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
