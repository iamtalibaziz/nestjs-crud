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
import { PickupNoteService } from './../services/pickupNote.service';

// Utils
import commonUtil from './../utils/common.util';
import { AppError } from './../utils/appError';
import {
  CreatePickupNoteDto,
  UpdatePickupNoteDto,
} from 'src/dto/pickupNote.dto';
import validatorUtil from 'src/utils/validator.util';

// Dto

@Controller('pickupNotes')
export class PickupNoteController {
  constructor(private readonly pickupNoteService: PickupNoteService) {}

  @Get('/')
  async getPickupNotes(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const { query }: any = req;
      commonUtil.consoleLog('PickupNoteController:getPickupNote:start', query);
      const pickupNotes = await this.pickupNoteService.find(query);
      commonUtil.consoleLog('PickupNoteController:getPickupNote:end');
      return res.status(HttpStatus.OK).json(pickupNotes);
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
  async createPickupNote(
    @Body() createPickupNoteDto: CreatePickupNoteDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('PickupNoteController:pickupNotes:start');
      const dataToCreated: any = {
        ...createPickupNoteDto,
        UID: commonUtil.generateUniqueId(),
      };
      commonUtil.consoleLog(
        'PickupNoteController:createPickupNote:dataToCreated:',
        dataToCreated,
      );
      const data: any = await this.pickupNoteService.create(dataToCreated);
      commonUtil.consoleLog('PickupNoteController:createPickupNote:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('PickupNoteController:createPickupNote:error', e);
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
  async updatePickupNote(
    @Param('id') id: string,
    @Body() updatePickupNoteDto: UpdatePickupNoteDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('PickupNoteController:updatePickupNote:start', {
        id,
        updatePickupNoteDto,
      });
      const pickupNoteInfo: any = await this.pickupNoteService.findOne({
        UID: id,
      });
      if (validatorUtil.isNullOrUndefined(pickupNoteInfo)) {
        throw new AppError(400).addParamError('Invalid pickup note');
      }
      const updatedBody: any = {
        latitude: updatePickupNoteDto.latitude,
        longitude: updatePickupNoteDto.longitude,
        note: updatePickupNoteDto.note,
      };
      await this.pickupNoteService.update(id, updatedBody);
      pickupNoteInfo.latitude = updatePickupNoteDto.latitude;
      pickupNoteInfo.longitude = updatePickupNoteDto.longitude;
      pickupNoteInfo.note = updatePickupNoteDto.note;
      return res.status(200).json(pickupNoteInfo);
    } catch (e) {
      commonUtil.consoleLog('PickupNoteController:updatePickupNote:error', e);
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
  async deletePickupNote(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('PickupNoteController:deletePickupNote:start');
      const pickupNoteInfo: any = await this.pickupNoteService.findOne({
        UID: id,
      });
      if (validatorUtil.isNullOrUndefined(pickupNoteInfo)) {
        throw new AppError(400).addParamError('Invalid pickup note');
      }
      await this.pickupNoteService.delete(id);
      commonUtil.consoleLog('PickupNoteController:deletePickupNote:end');
      res.status(200).json({});
    } catch (e) {
      commonUtil.consoleLog('PickupNoteController:deletePickupNote:error', e);
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
  async getPickupNoteById(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('PickupNoteController:getPickupNoteById:start');
      const data = await this.pickupNoteService.findOne({ UID: id });
      commonUtil.consoleLog('PickupNoteController:getPickupNoteById:end');
      if (validatorUtil.isNullOrUndefined(data)) {
        throw new AppError(400).addParamError('Pickup note not found');
      }
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('PickupNoteController:getPickupNoteById:error', e);
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
