import {
  Controller,
  Get,
  Res,
  Req,
  Put,
  Post,
  Body,
  ValidationPipe,
  UsePipes,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';

// Services
import { UserService } from './../services/user.service';

// Utils
import commonUtil from './../utils/common.util';
// import validatorUtil from './../utils/validator.util';
import { AppError } from './../utils/appError';
import validatorUtil from './../utils/validator.util';
import {
  ChangePasswordDto,
  CreateDeviceTokenRequestDto,
  CreateUserRequestDto,
  UpdateUserProfileRequestDto,
} from 'src/dto/user.dto';
import { AuthService } from './../services/auth.service';
import { UserStatus, UserType } from './../dataTypes/user';
import { AdminGuard } from './../guards/admin.guard';

// Dto

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get('/')
  @UseGuards(AdminGuard)
  async getUsers(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      commonUtil.consoleLog('UserController:getUsers:start');
      const { params }: any = req;
      const data: any = await this.userService.find(params);
      commonUtil.consoleLog('UserController:getUsers:end');
      res.status(200).json({ data });
    } catch (e) {
      commonUtil.consoleLog('UserController:getUsers:error', e);
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
  @Get('/me')
  async getMe(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      commonUtil.consoleLog('UserController:getMe:start');
      const { user }: any = req;
      let data: any = await this.userService.getUserByUID(user.UID);
      data = data.toObject();
      delete data.password;

      commonUtil.consoleLog('UserController:getMe:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('UserController:getMe:error', e);
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
  async getUserById(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      commonUtil.consoleLog('UserController:getUserById:start');
      const { params }: any = req;
      let userInfo: any = await this.userService.getUserByUID(params.id);
      if (validatorUtil.isNullOrUndefined(userInfo)) {
        throw new AppError(400).addParamError('Invalid user');
      }
      userInfo = userInfo.toObject();
      delete userInfo.password;
      commonUtil.consoleLog('UserController:getUserById:end');
      res.status(200).json(userInfo);
    } catch (e) {
      commonUtil.consoleLog('UserController:getUserById:error', e);
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
  @Put('/updateProfile')
  @UsePipes(new ValidationPipe())
  async updateUserProfile(
    @Body() updateUserProfileDto: UpdateUserProfileRequestDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<any> {
    try {
      let { user }: any = req;
      commonUtil.consoleLog('UserController:updateUserProfile:start', {
        updateUserProfileDto,
      });

      const updatedBody: any = {
        fullName: updateUserProfileDto.fullName,
        phone: updateUserProfileDto.phone,
      };
      await this.userService.update(user.UID, updatedBody);
      user.fullName = updateUserProfileDto.fullName;
      user.phone = updateUserProfileDto.phone;

      user = user.toObject();
      delete user.password;

      return res.status(200).json(user);
    } catch (e) {
      commonUtil.consoleLog('UserController:updateUserProfile:error', e);
      if (e instanceof AppError) {
        return res.status(e.getStatusCode()).json(e);
      } else {
        return res
          .status(500)
          .json(
            new AppError(500).addServerError('Unable to update user profile'),
          );
      }
    }
  }

  @Put('/changePassword')
  async changePassword(
    @Body() changePassword: ChangePasswordDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const { user }: any = req;
      commonUtil.consoleLog('UserController:changePassword:start', {
        changePassword,
      });
      const isPasswordMatch = await this.authService.compareUserPassword(
        changePassword.currentPassword,
        user.password,
      );
      if (!isPasswordMatch) {
        throw new AppError(400).addParamError('Current password is incorrect');
      }
      const hashedNewPassword = await this.authService.generateUserPassword(
        changePassword.newPassword,
      );
      await this.userService.update(user.UID, { password: hashedNewPassword });
      return res.status(200).json({ message: 'Password changed successfully' });
    } catch (e) {
      commonUtil.consoleLog('UserController:changePassword:error', e);
      if (e instanceof AppError) {
        return res.status(e.getStatusCode()).json(e);
      } else {
        return res
          .status(500)
          .json(new AppError(500).addServerError('Unable to change password'));
      }
    }
  }

  @Post('/')
  @UseGuards(AdminGuard)
  @UsePipes(new ValidationPipe())
  async createUser(
    @Body() createUserRequestDto: CreateUserRequestDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('UserController:createUser:start', {
        createUserRequestDto,
      });

      const userInfo = await this.userService.getUserByEmail(
        createUserRequestDto.email,
      );
      if (validatorUtil.isNotUndefinedAndNull(userInfo)) {
        throw new AppError(400).addParamError(
          'User with this email already exists',
        );
      }

      const createBody: any = {
        ...createUserRequestDto,
        UID: commonUtil.generateUniqueId(),
        password: await this.authService.generateUserPassword(
          createUserRequestDto.password,
        ),
        userType: UserType.STAFF,
        status: UserStatus.ACTIVE,
      };
      let newUser = await this.userService.create(createBody);
      newUser = newUser.toObject();
      delete newUser.password;

      return res.status(200).json(newUser);
    } catch (e) {
      commonUtil.consoleLog('UserController:createUser:error', e);
      if (e instanceof AppError) {
        return res.status(e.getStatusCode()).json(e);
      } else {
        return res
          .status(500)
          .json(new AppError(500).addServerError('Unable to create user'));
      }
    }
  }

  @Post('/deviceToken')
  @UsePipes(new ValidationPipe())
  async addUserDeviceToken(
    @Body() createDeviceTokenRequestDto: CreateDeviceTokenRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('UserController:addUserDeviceToken:start', {
        createDeviceTokenRequestDto,
      });
      const { user }: any = req;
      if (
        !['android', 'ios'].includes(createDeviceTokenRequestDto.deviceType)
      ) {
        throw new AppError(400).addParamError(
          'Device type must be either android or ios',
        );
      }
      let deviceTokenInfo: any = await this.userService.getUserDeviceToken(
        user.UID,
      );
      if (validatorUtil.isNullOrUndefined(deviceTokenInfo)) {
        deviceTokenInfo = await this.userService.insertUserDeviceToken(
          user.UID,
          createDeviceTokenRequestDto.deviceToken,
          createDeviceTokenRequestDto.deviceType,
        );
        commonUtil.consoleLog('UserController:addUserDeviceToken:created');
      } else {
        if (
          deviceTokenInfo.deviceToken !==
            createDeviceTokenRequestDto.deviceToken ||
          deviceTokenInfo.deviceType !== createDeviceTokenRequestDto.deviceType
        ) {
          await this.userService.updateUserDeviceToken(
            user.UID,
            createDeviceTokenRequestDto.deviceToken,
            createDeviceTokenRequestDto.deviceType,
          );
          deviceTokenInfo.deviceToken = createDeviceTokenRequestDto.deviceToken;
          deviceTokenInfo.deviceType = createDeviceTokenRequestDto.deviceType;
          commonUtil.consoleLog('UserController:addUserDeviceToken:updated');
        }
      }
      return res.status(200).json(deviceTokenInfo);
    } catch (e) {
      commonUtil.consoleLog('UserController:addUserDeviceToken:error', e);
      if (e instanceof AppError) {
        return res.status(e.getStatusCode()).json(e);
      } else {
        return res
          .status(500)
          .json(
            new AppError(500).addServerError('Unable to update device token'),
          );
      }
    }
  }

  @Delete('/deviceToken')
  @UsePipes(new ValidationPipe())
  async deleteUserDeviceToken(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('UserController:deleteUserDeviceToken:start');
      const { user }: any = req;
      await this.userService.deleteUserDeviceToken(user.UID);
      commonUtil.consoleLog('UserController:deleteUserDeviceToken:created');
      return res.status(200).json({});
    } catch (e) {
      commonUtil.consoleLog('UserController:deleteUserDeviceToken:error', e);
      if (e instanceof AppError) {
        return res.status(e.getStatusCode()).json(e);
      } else {
        return res
          .status(500)
          .json(
            new AppError(500).addServerError('Unable to update device token'),
          );
      }
    }
  }
}
