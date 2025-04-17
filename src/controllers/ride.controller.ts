import {
  Controller,
  Get,
  Post,
  Put,
  // Delete,
  Res,
  Body,
  UsePipes,
  ValidationPipe,
  // Param,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';

// Services
import { RideService } from './../services/ride.service';

// Utils
import commonUtil from './../utils/common.util';
import validatorUtil from './../utils/validator.util';
import { AppError } from './../utils/appError';
import { RideStatus } from './../dataTypes/ride';

// Dto
import { RideRequestDto, RideStatusUpdateDto } from './../dto/ride.dto';
import { UserType } from './../dataTypes/user';
import { NotificationService } from 'src/services/notification.service';

@Controller('rides')
export class RideController {
  constructor(
    private readonly rideService: RideService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get('/')
  async getRides(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      const { query, user }: any = req;
      commonUtil.consoleLog('RideController:getRides:start', {
        query,
        userId: user.UID,
        userType: user.userType,
      });
      const data: any = await this.rideService.getRideRequests(query, user);
      commonUtil.consoleLog('RideController:getRides:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('RideController:getRides:error', e);
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
  async createRide(
    @Req() req: Request,
    @Body() rideRequestDto: RideRequestDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('RideController:createRide:start');
      const { user }: any = req;
      console.log('RideController:createRide:start:user:', user.UID);
      if (user.userType === UserType.STAFF) {
        throw new AppError(400).addParamError('Only student can book request');
      }
      const activeRideRequest: any =
        await this.rideService.getUserActiveRideRequest(user.UID);
      if (validatorUtil.isNotUndefinedAndNull(activeRideRequest)) {
        throw new AppError(400).addParamError(
          'You already have an active request',
        );
      }
      const updatedBody: any = {
        ...rideRequestDto,
        UID: commonUtil.generateUniqueId(),
        status: RideStatus.PENDING,
        userId: user.UID,
      };
      let data: any = await this.rideService.processRideRequest(updatedBody);
      data = data.toObject();
      const waitingNumber: any = await this.rideService.getWaitingNumber(data);
      data.waitingNumber = waitingNumber;
      commonUtil.consoleLog('RideController:createRide:end');
      this.notificationService.rideRequestCreated(data);
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('RideController:rideRequestDto:error', e);
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
  @Put('/:id/updateStatus')
  @UsePipes(new ValidationPipe())
  async updateStatus(
    @Req() req: Request,
    @Body() rideUpdateStatusDto: RideStatusUpdateDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('RideController:updateStatus:start');
      const { id }: any = req.params;
      const { user }: any = req;
      const updatedBody: any = {
        status: rideUpdateStatusDto.status,
      };
      const rideInfo: any = await this.rideService.getRideInfoById(id);
      if (validatorUtil.isNullOrUndefined(rideInfo)) {
        throw new AppError(400).addParamError('Invalid ride id');
      }
      const statusValues: any = Object.values(RideStatus);
      if (!statusValues.includes(updatedBody.status)) {
        throw new AppError(400).addParamError('Invalid status');
      }
      if (updatedBody.status === rideInfo.status) {
        throw new AppError(400).addParamError('Please set different status');
      }
      if (
        [
          RideStatus.DECLINED,
          RideStatus.CANCELLED,
          RideStatus.COMPLETED,
        ].includes(rideInfo.status)
      ) {
        throw new AppError(400).addParamError(
          'Sorry! you can not update the status of this request anymore',
        );
      }
      if ([RideStatus.PENDING].includes(updatedBody.status)) {
        throw new AppError(400).addParamError(
          'Sorry! you can not update this status',
        );
      }
      // Student action validation
      if (user.userType === UserType.USER) {
        if (updatedBody.status !== RideStatus.CANCELLED) {
          throw new AppError(400).addParamError(
            'Sorry! you can not update this status',
          );
        }
      }
      // Staff action validation
      if (user.userType === UserType.STAFF) {
        if (
          validatorUtil.isNotUndefinedAndNull(rideInfo.staffId) &&
          rideInfo.staffId !== user.UID
        ) {
          throw new AppError(400).addParamError(
            'Sorry! this request already assigned to other',
          );
        }
        if (updatedBody.status === RideStatus.ACCEPTED) {
          const activeRideForStaff: any =
            await this.rideService.getStaffActiveRideRequest(
              user.UID,
              rideInfo.UID,
            );
          if (validatorUtil.isNotUndefinedAndNull(activeRideForStaff)) {
            throw new AppError(400).addParamError(
              'Sorry! you can not update this status as you already have active request',
            );
          }
          updatedBody.staffId = user.UID;
        }
      }
      commonUtil.consoleLog(
        'RideController:updateStatus:updatedBody:',
        updatedBody,
      );
      await this.rideService.updateRideStatus(id, updatedBody);
      rideInfo.status = updatedBody.status;
      this.notificationService.rideRequestStatusChanged(rideInfo);
      commonUtil.consoleLog('RideController:updateStatus:end');
      res.status(200).json(rideInfo);
    } catch (e) {
      commonUtil.consoleLog('RideController:updateStatus:error', e);
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
