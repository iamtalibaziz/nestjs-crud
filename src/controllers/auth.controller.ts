import {
  Controller,
  Res,
  Req,
  Post,
  Body,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';

// Services
import { UserService } from './../services/user.service';
import { AuthService } from './../services/auth.service';

// Utils
import commonUtil from './../utils/common.util';
import { AppError } from './../utils/appError';
import validatorUtil from './../utils/validator.util';

import {
  ForgotPasswordDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyRegisterRequestDto,
} from 'src/dto/auth.dto';
import { UserStatus, UserType } from './../dataTypes/user';
import { NotificationService } from './../services/notification.service';
import { OtpFor, OtpStatus } from './../dataTypes/otp';
import { OtpService } from './../services/otp.service';

// Dto

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly otpService: OtpService,
  ) {}

  @Post('/login')
  @UsePipes(new ValidationPipe())
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('AuthController:login:start');
      let userInfo = await this.userService.getUserByEmail(
        loginRequestDto.email,
      );
      // commonUtil.consoleLog('AuthController:login:userInfo:', userInfo);
      if (validatorUtil.isNullOrUndefined(userInfo)) {
        throw new AppError(400).addParamError('Invalid email or password');
      }
      const isPasswordMatch = await this.authService.compareUserPassword(
        loginRequestDto.password,
        userInfo.password,
      );
      if (!isPasswordMatch) {
        throw new AppError(400).addParamError('Invalid email or password');
      }
      userInfo = userInfo.toObject();
      delete userInfo.password;
      const responseData = {
        data: userInfo,
        accessToken: null,
        message: 'User loggedIn successfully',
      };
      if (userInfo.status === UserStatus.ACTIVE) {
        responseData.accessToken = this.authService.generateJWTToken(userInfo);
      } else {
        responseData.message = 'User is not verified yet';
      }
      commonUtil.consoleLog('AuthController:login:end');
      return res.status(HttpStatus.OK).json(responseData);
    } catch (e) {
      commonUtil.consoleLog('AuthController:login:error', e);
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

  @Post('/register')
  @UsePipes(new ValidationPipe())
  async register(
    @Body() registerRequestDto: RegisterRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog('AuthController:register:start');
      const userInfo = await this.userService.getUserByEmail(
        registerRequestDto.email,
      );
      if (validatorUtil.isNotUndefinedAndNull(userInfo)) {
        throw new AppError(400).addParamError(
          'User with this email already exists',
        );
      }
      const existingUserByStudentNumber =
        await this.userService.getUserByStudentNumber(
          registerRequestDto.studentNumber,
        );
      if (validatorUtil.isNotUndefinedAndNull(existingUserByStudentNumber)) {
        throw new AppError(400).addParamError(
          'User with this student number already exists',
        );
      }
      const otp = commonUtil.generateRandomNumber(6);
      const dataToCreated: any = {
        ...registerRequestDto,
        UID: commonUtil.generateUniqueId(),
        password: await this.authService.generateUserPassword(
          registerRequestDto.password,
        ),
        userType: UserType.USER,
        status: UserStatus.PENDING,
      };
      commonUtil.consoleLog(
        'AuthController:register:dataToCreated:',
        dataToCreated,
      );
      let data: any = await this.userService.create(dataToCreated);
      data = data.toObject();
      delete data.password;
      const otpInfo = await this.otpService.create({
        UID: commonUtil.generateUniqueId(),
        userId: data.UID,
        otp,
        otpFor: OtpFor.REGISTRATION,
      });
      this.notificationService.sendOtpForVerifyRegistration(data, otpInfo.otp);
      commonUtil.consoleLog('AuthController:register:end');
      res.status(200).json(data);
    } catch (e) {
      commonUtil.consoleLog('AuthController:register:error', e);
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

  @Post('/verifyRegister')
  @UsePipes(new ValidationPipe())
  async verifyRegister(
    @Body() verifyRegisterRequestDto: VerifyRegisterRequestDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog(
        'AuthController:verifyRegister:start',
        verifyRegisterRequestDto,
      );
      let userInfo = await this.userService.getUserByEmail(
        verifyRegisterRequestDto.email,
      );
      if (validatorUtil.isNullOrUndefined(userInfo)) {
        throw new AppError(400).addParamError(
          'User with this email does not exists',
        );
      }
      if (userInfo.status === UserStatus.ACTIVE) {
        throw new AppError(400).addParamError('User already verified');
      }
      const otpInfo = await this.otpService.getPendingUserOtpInfoByType(
        userInfo.UID,
        verifyRegisterRequestDto.otp,
        OtpFor.REGISTRATION,
      );
      if (validatorUtil.isNullOrUndefined(otpInfo)) {
        throw new AppError(400).addParamError('Invalid otp');
      }
      await this.userService.activateUser(userInfo.UID);
      await this.otpService.updateOtpStatusToActiveById(otpInfo.UID);
      userInfo = userInfo.toObject();
      userInfo.status = UserStatus.ACTIVE;
      delete userInfo.password;
      commonUtil.consoleLog('AuthController:verifyRegister:end');
      return res.status(200).json(userInfo);
    } catch (e) {
      commonUtil.consoleLog('AuthController:verifyRegister:error', e);
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

  @Post('/forgotPassword')
  @UsePipes(new ValidationPipe())
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      commonUtil.consoleLog(
        'AuthController:forgotPassword:start',
        forgotPasswordDto,
      );
      const user = await this.userService.getUserByEmail(
        forgotPasswordDto.email,
      );
      if (validatorUtil.isNullOrUndefined(user)) {
        throw new AppError(400).addParamError(
          'User with this email does not exists',
        );
      }
      const otp = commonUtil.generateRandomNumber(6);
      const otpInfo = await this.otpService.create({
        UID: commonUtil.generateUniqueId(),
        userId: user.UID,
        otp: otp,
        otpFor: OtpFor.FORGOT_PASSWORD,
      });
      this.notificationService.sendOtpForForgotPassword(user, otpInfo.otp);
      return res
        .status(200)
        .json({ message: 'OTP sent to your email for password reset.' });
    } catch (e) {
      commonUtil.consoleLog('AuthController:forgotPassword:error', e);
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

  @Post('/resetPassword')
  @UsePipes(new ValidationPipe())
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const { email, newPassword } = resetPasswordDto;
      console.log('AuthController:resetPassword:start');
      const user = await this.userService.getUserByEmail(email);
      if (validatorUtil.isNullOrUndefined(user)) {
        throw new AppError(400).addParamError(
          'User with this email does not exists',
        );
      }
      const otpInfo = await this.otpService.getPendingUserOtpInfoByType(
        user.UID,
        resetPasswordDto.otp,
        OtpFor.FORGOT_PASSWORD,
      );
      if (validatorUtil.isNullOrUndefined(otpInfo)) {
        throw new AppError(400).addParamError('Invalid otp');
      }
      const password = await this.authService.generateUserPassword(newPassword);
      await this.userService.updateUserPassword(user.UID, password);
      await this.otpService.updateOtpStatusToActiveById(otpInfo.UID);
      // if (user.status === UserStatus.PENDING) {
      //   await this.userService.activateUser(user.UID);
      // }
      return res.status(200).json({ message: 'Password reset successfully.' });
    } catch (e) {
      console.error('AuthController:resetPassword:error', e);
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

  @Post('/resendOtp/register')
  @UsePipes(new ValidationPipe())
  async resendOtpRegister(
    @Body() resendOtpDto: ResendOtpDto,
    @Res() res: Response,
  ): Promise<any> {
    try{
      const{ email} = resendOtpDto;
      console.log('AuthController:resendOtpRegister:start');
      const user = await this.userService.getUserByEmail(email);
      if (validatorUtil.isNullOrUndefined(user)) {
        throw new AppError(400).addParamError(
          'User with this email does not exists',
        );
      }
      if (user.status === UserStatus.ACTIVE) {
        throw new AppError(400).addParamError('User is already verified');
      }
      const otpInfo = await this.otpService.findOne({
        userId: user.UID,
        otpFor: OtpFor.REGISTRATION,
        status: OtpStatus.PENDING,
      });
      if (otpInfo && otpInfo.status === OtpStatus.PENDING) {
        console.log('Resending the same OTP:', otpInfo.otp);
        this.notificationService.sendOtpForVerifyRegistration(user, otpInfo.otp);
        return res.status(200).json({ message: 'OTP resent successfully' });
      }
      else{
        const otp = commonUtil.generateRandomNumber(6);

        const otpInfo = await this.otpService.create({
          UID: commonUtil.generateUniqueId(), 
          userId: user.UID, 
          otp, 
          otpFor: OtpFor.REGISTRATION, 
        });
        this.notificationService.sendOtpForVerifyRegistration(user, otpInfo.otp);
        commonUtil.consoleLog('AuthController:resendOtpRegister:end');
        return res.status(200).json({ message: 'New OTP generated and sent' });
      }
    } catch(e){
      commonUtil.consoleLog('AuthController:resendOtpRegister:error', e);
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

  @Post('/resendOtp/forgotPassword')
  @UsePipes(new ValidationPipe())
  async resendOtpPassword(
    @Body() resendOtpDto: ResendOtpDto,
    @Res() res: Response
  ) : Promise<any>{
    try{
      const{ email} = resendOtpDto;
      console.log('AuthController:resendOtpPassword:start');
      const user = await this.userService.getUserByEmail(email);
      if (validatorUtil.isNullOrUndefined(user)) {
        throw new AppError(400).addParamError(
          'User with this email does not exists',
        );
      }
      if (user.status === UserStatus.PENDING) {
        throw new AppError(400).addParamError('User is not verified');
      }
     
      const otpInfo = await this.otpService.findOne({
        userId: user.UID,
        otpFor: OtpFor.FORGOT_PASSWORD,
        status: OtpStatus.PENDING,
      });
      if (otpInfo && otpInfo.status === OtpStatus.PENDING) {
        console.log('Resending the same OTP:', otpInfo.otp);
        this.notificationService.sendOtpForVerifyRegistration(user, otpInfo.otp);
        return res.status(200).json({ message: 'OTP resent successfully' });
      }
      else{
        const otp = commonUtil.generateRandomNumber(6);
        const otpInfo = await this.otpService.create({
          UID: commonUtil.generateUniqueId(), 
          userId: user.UID, 
          otp, 
          otpFor: OtpFor.FORGOT_PASSWORD, 
        });
        this.notificationService.sendOtpForVerifyRegistration(user, otpInfo.otp);
        commonUtil.consoleLog('AuthController:resendOtpPassword:end');
        return res.status(200).json({ message: 'New OTP generated and sent' });
      }
    }

     catch(e){
      commonUtil.consoleLog('AuthController:resendOtpPassword:error', e);
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


