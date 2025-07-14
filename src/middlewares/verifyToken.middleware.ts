// NPM modules
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from './../services/user.service';
import { AuthService } from './../services/auth.service';
import commonUtil from './../utils/common.util';
import { UserStatus } from './../dataTypes/user';

@Injectable()
export class VerifyToken implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}
  async use(req: Request | any, res: Response, next: NextFunction) {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(400).json({
        success: false,
        errors: ['Please enter authorization token'],
      });
    }
    const { token, tokenPayload, fullToken }: any =
      this.authService.decodeAuthToken(authorization);
    if (!tokenPayload || !tokenPayload.UID) {
      return res.status(401).json({
        success: false,
        errors: ['Invalid authorization token'],
      });
    }
    try {
      if (!this.authService.verifyAuthToken(token)) {
        return res.status(401).json({
          success: false,
          errors: ['Authorization token is not valid'],
        });
      }
    } catch (error) {
      commonUtil.consoleLog('VerifyToken:error', error);
      return res.status(401).json({
        success: false,
        errors: ['Authorization token is not valid'],
      });
    }
    const authUserInfo: any = await this.userService.getUserByUID(
      tokenPayload.UID,
    );
    if (!authUserInfo) {
      return res.status(401).json({
        success: false,
        errors: ['User with this token does not exists'],
      });
    }
    if (authUserInfo.status !== UserStatus.ACTIVE) {
      return res.status(401).json({
        success: false,
        errors: ['User account is not verified yet'],
      });
    }
    req.token = token;
    req.tokenPayload = tokenPayload;
    req.fullToken = fullToken;
    req.user = authUserInfo;
    next();
  }
}
